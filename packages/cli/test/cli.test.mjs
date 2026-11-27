import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { ONE_CONTROLS, ONE_MOMENTS } from '@one-ui/core'

const bin = fileURLToPath(new URL('../dist/bin.js', import.meta.url))
const repo = fileURLToPath(new URL('../../../', import.meta.url))
const read = (root, path) => readFileSync(join(root, path), 'utf8')
const project = t => {
  const directory = mkdtempSync(join(tmpdir(), 'one ui cli-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  return directory
}
function write(root, path, content) {
  mkdirSync(dirname(join(root, path)), { recursive: true })
  writeFileSync(join(root, path), content)
}
function run(args, cwd = tmpdir(), code = 0, env) {
  const result = spawnSync(process.execPath, [bin, ...args], { cwd, env, encoding: 'utf8' })
  assert.equal(result.status, code, result.stderr + result.stdout)
  return result.stdout.trim()
}
function json(args, cwd, code, env) {
  return JSON.parse(run([...args, '--json'], cwd, code, env))
}

test('help, command help, version and parse errors', () => {
  assert.match(run(['--help']), /doctor \[--dir PATH\]/)
  assert.match(run(['theme', '--help']), /--canvas HEX/)
  assert.equal(run(['--version']), '1.0.0')
  for (const args of [['unknown'], ['inspect'], ['inspect', '404'], ['list', '--type', 'invalid'],
    ['init', '--platform', 'typo'], ['init', '--inject-rules', '../outside'], ['add'], ['doctor', '--unused']]) {
    assert.equal(json(args, undefined, 1).status, 'failed')
  }
})

test('list returns 8 controls and 36 moments with stable core IDs and compact JSON', () => {
  const output = run(['list', '--json'])
  assert.equal(output.split('\n').length, 1)
  const { controls, moments } = JSON.parse(output)
  assert.deepEqual([controls.length, moments.length], [8, 36])
  assert.deepEqual(controls.map(e => e.id), ONE_CONTROLS.map(e => e.id))
  assert.deepEqual(moments.map(e => e.id), ONE_MOMENTS.map(e => e.id))
  assert.deepEqual(json(['list', '--type', 'moments', '--category', 'Action', '--search', 'PLANE']),
    { controls: [], moments: [moments[8]] })
  assert.deepEqual(json(['list', '--search', 'unknown']), { controls: [], moments: [] })
})

test('audit reports JSX motion findings, supported native checks and empty coverage', t => {
  const dir = project(t)
  write(dir, 'app/UI.jsx', '<span className="animate-pulse">Live</span>\n<button disabled={isAnimating}>Next</button>')
  write(dir, 'app/UI.kt', 'val fill = Color(0xFF112233)')
  write(dir, 'app/ui.dart', 'Text("Next", textScaler: TextScaler.noScaling)')
  write(dir, 'app/one_design_tokens.g.dart', 'const fill = Color(0xFF112233);')
  write(dir, 'app/node_modules/lib/index.js', 'const ignored = "Oops!";')
  const report = json(['audit', 'app'], dir).report
  assert.equal(report.filesScanned, 3)
  assert.deepEqual(report.filesByPlatform, { web: 1, compose: 1, flutter: 1 })
  assert.deepEqual(report.findings.map(f => [f.rule, f.line, f.severity]).sort(), [
    ['ONE-01', 1, 'warn'], ['ONE-21', 1, 'warn'], ['ONE-26', 2, 'warn'], ['ONE-27', 1, 'warn'],
  ])
  write(dir, 'notes/review.md', 'A proposed button.')
  for (const target of ['notes', 'notes/review.md', 'app/one_design_tokens.g.dart']) {
    const skipped = json(['audit', target], dir, 1).report
    assert.equal(skipped.filesScanned, 0)
    assert.equal(skipped.unscannedTargets.length, 1)
  }
})

test('inspect distinguishes field edits from rubber-search submission', () => {
  assert.deepEqual(json(['inspect', 'field']).webEvents, ['one-change'])
  assert.deepEqual(json(['inspect', 'rubber-search']).webEvents, ['one-change', 'one-action'])
})

test('inspect accepts numeric IDs, moment slugs, names and control tags', () => {
  for (const [query, entry, type, id] of [
    ['09', ONE_MOMENTS[8], 'OnePaperPlane', 'OnePaperPlaneButton'],
    ['swipe-confirm', ONE_MOMENTS[13], 'OneSwipeConfirm', 'OneSwipeConfirm'],
    ['Paper Plane', ONE_MOMENTS[8], 'OnePaperPlane', 'OnePaperPlaneButton'],
    ['one-switch', ONE_CONTROLS.at(-1), 'OneSwitch', 'Toggle'],
  ]) {
    const { snippets, ...spec } = json(['inspect', query])
    assert.deepEqual(spec, entry)
    assert.ok(spec.webEvents.every(e => e.startsWith('one-')))
    assert.ok(snippets.html.includes(`<${entry.tagName} label=`))
    assert.ok(snippets.react.includes(`import { ${type} }`))
    assert.ok(snippets.swift.includes('import OneUI') && snippets.swift.includes(id))
  }
})

test('init writes canonical web assets and upgrades only managed rules, idempotently', t => {
  const dir = project(t)
  write(dir, 'AGENTS.md', 'My instructions\r\n<!-- asterline-ui:v0.3 -->\r\nold\r\n<!-- /asterline-ui:v0.3 -->\r\nKeep this too.\r\n')
  write(dir, 'LICENSE', 'Host license\n')
  const args = ['init', '--dir', dir, '--platform', 'web', '--inject-rules', 'AGENTS.md']
  const first = json(args)
  assert.equal(first.dryRun, false)
  assert.deepEqual(first.config.platforms, ['web'])
  for (const filename of ['one-tokens.css', 'one-primitives.css', 'one-layout.css', 'one-moments.css']) {
    assert.equal(read(dir, 'src/styles/' + filename), read(repo, 'platforms/web/' + filename))
  }
  assert.equal(read(dir, 'LICENSE'), 'Host license\n')
  assert.equal(read(dir, 'one-ui/LICENSE'), read(repo, 'LICENSE'))
  const rules = read(dir, 'AGENTS.md')
  assert.ok(rules.startsWith('My instructions\r\n') && rules.endsWith('Keep this too.\r\n'))
  assert.equal(rules.match(/<!-- one-ui:v1.0 -->/g).length, 1)
  assert.ok(rules.includes('ONE-28') && !rules.includes('asterline-ui:v0.3'))
  assert.ok(json(args).files.every(f => f.status === 'current'))
  assert.equal(read(dir, 'AGENTS.md'), rules)
})

test('auto identifies React, Next, Tailwind v4 and native stacks together', t => {
  const dir = project(t)
  write(dir, 'package.json', JSON.stringify({ dependencies: { next: '^15', react: '^19' }, devDependencies: { tailwindcss: '^4.1' } }))
  write(dir, 'Package.swift', '')
  write(dir, 'Sources/App/Main.swift', '')
  write(dir, 'app/build.gradle.kts', '')
  write(dir, 'build.gradle.kts', '')
  write(dir, 'pubspec.yaml', '')
  const r = json(['init', '--dir', dir, '--compat-asterline', '--preset', 'paper-editorial', '--motion', 'reduced'])
  assert.deepEqual(r.config.platforms, ['react', 'tailwind', 'apple', 'android', 'flutter'])
  assert.deepEqual([r.config.preset, r.config.motion], ['paper-editorial', 'reduced'])
  for (const path of ['Sources/App/OneDesignTokens.generated.swift', 'app/src/main/java/one/ui/OneDesignTokens.generated.kt',
    'lib/one_ui/one_design_tokens.g.dart', 'src/styles/one-tailwind-v4.css', 'src/styles/one-compat-asterline.css']) {
    assert.ok(existsSync(join(dir, path)), path)
  }
  const sheet = read(dir, 'src/styles/one-ui.css')
  assert.ok(sheet.startsWith('@import "tailwindcss";'))
  assert.ok(sheet.indexOf('one-tokens.css') < sheet.indexOf('one-tailwind-v4.css'))
})

test('auto detects Xcode, Vite and Astro and avoids Tailwind v4 bridge on Tailwind 3', t => {
  const dir = project(t)
  mkdirSync(join(dir, 'Demo.xcodeproj'))
  const args = ['init', '--dir', dir, '--dry-run']
  assert.deepEqual(json(args).config.platforms, ['apple'])
  for (const deps of [{ vite: '^7' }, { astro: '^5' }, { tailwindcss: '^3.4' }]) {
    write(dir, 'package.json', JSON.stringify({ devDependencies: deps }))
    assert.deepEqual(json(args).config.platforms, ['web', 'apple'])
  }
})

test('init and add dry runs leave an absent target absent', t => {
  const dir = join(project(t), 'new')
  for (const args of [['init', '--platform', 'all', '--inject-rules', 'GEMINI.md'], ['add', 'all']]) {
    const result = json([...args, '--dir', dir, '--dry-run'])
    assert.equal(result.dryRun, true)
    assert.ok(result.files.length > 5)
    assert.equal(existsSync(dir), false)
  }
})

test('add produces standalone web examples with local module, CSS, notices and accessible labels', t => {
  const dir = project(t)
  const result = json(['add', 'paper-plane', 'swipe-confirm', '09', '--dir', dir])
  assert.deepEqual(result.components, ['paper-plane', 'swipe-confirm'])
  assert.equal(result.mode, 'web')
  const folder = 'src/components/one-ui/'
  for (const slug of result.components) {
    const html = read(dir, folder + slug + '.html')
    assert.ok(html.includes('SPDX-License-Identifier: AGPL-3.0-only'))
    assert.ok(html.includes(`<one-${slug} label=`))
    assert.ok(html.includes("from './one-ui-web.bundle.js'") && html.includes('registerOneUI()'))
    assert.ok(existsSync(resolve(dir, folder, '../../styles/one-ui.css')))
  }
  assert.ok(read(dir, folder + 'one-ui-web.bundle.js').includes('registerOneUI'))
  assert.match(read(dir, 'src/styles/one-ui.css'), /@import "\.\/one-tokens.css";/)
  assert.ok(json(['add', '09', '14', '--dir', dir]).files.every(f => f.status === 'current'))
})

test('CSS and React add expand categories and all, preserving custom styles', t => {
  const dir = project(t)
  const source = '@charset "UTF-8";\n/* @import "./one-tokens.css"; */\nbody { margin: 0; }\n'
  write(dir, 'src/styles/one-ui.css', source)
  const r = json(['add', 'action', '09', '--dir', dir, '--mode', 'react'])
  assert.equal(r.components.length, [...ONE_CONTROLS, ...ONE_MOMENTS].filter(e => e.category === 'action').length)
  assert.match(read(dir, 'src/components/one-ui/paper-plane.tsx'), /OnePaperPlane as default/)
  const sheet = read(dir, 'src/styles/one-ui.css')
  assert.ok(sheet.startsWith('@charset "UTF-8";\n@import') && sheet.endsWith('body { margin: 0; }\n'))
  assert.equal(json(['add', 'all', '--dir', dir, '--mode', 'css']).components.length, 44)
  assert.ok(read(dir, 'src/components/one-ui/paper-plane.css').includes('[data-one-component="paper-plane"]'))
})

test('conflicts, invalid names and malformed rule blocks cause no partial writes', t => {
  const dir = project(t)
  write(dir, 'src/components/one-ui/swipe-confirm.html', 'local edits')
  assert.match(json(['add', '09', '14', '--dir', dir], undefined, 1).error, /Existing file differs/)
  assert.equal(existsSync(join(dir, 'src/styles')), false)
  assert.equal(read(dir, 'src/components/one-ui/swipe-confirm.html'), 'local edits')
  assert.match(json(['add', '09', 'nonesuch', '--dir', dir], undefined, 1).error, /Unknown component/)
  write(dir, 'CLAUDE.md', '<!-- one-ui:v1.0 -->\nLocal instructions')
  assert.match(json(['init', '--dir', dir, '--inject-rules', 'CLAUDE.md'], undefined, 1).error, /Unpaired/)
  assert.equal(existsSync(join(dir, 'one-ui.config.json')), false)
})

test('generated files stay within the target when a folder is symlinked', t => {
  const dir = project(t)
  const elsewhere = project(t)
  symlinkSync(elsewhere, join(dir, 'src'), 'dir')
  assert.match(json(['init', '--dir', dir], undefined, 1).error, /symbolic link/)
  assert.deepEqual(readdirSync(elsewhere), [])
})

test('theme validates both schemes and writes CSS only after a successful check', t => {
  const dir = project(t)
  const valid = json(['theme', 'obsidian-studio', '--validate'], dir)
  assert.ok(valid.valid && valid.pairsChecked > 100)
  assert.deepEqual(readdirSync(dir), [])
  const path = 'custom/one.css'
  json(['theme', 'obsidian-studio', '--validate', '--accent', '#ead49e', '--out', path], dir)
  const css = read(dir, path)
  assert.ok(css.includes('--one-color-action: #ead49e;') && css.includes('color-scheme: light dark;'))
  const failed = json(['theme', 'obsidian-studio', '--accent', '#000', '--out', path], dir, 1)
  assert.equal(failed.valid, false)
  assert.deepEqual(failed.failures.map(p => [p.scheme, p.foreground, p.ratio]), [['light', 'onAction', 1], ['dark', 'onAction', 1]])
  assert.equal(read(dir, path), css)
  assert.equal(json(['theme', 'default', '--canvas', '#fff', '--validate'], dir, 1).valid, false)
  assert.equal(json(['theme', 'default', '--canvas', 'invalid'], dir, 1).status, 'failed')
  json(['theme', 'high-contrast'], dir)
  assert.ok(existsSync(join(dir, 'one-theme.css')))
})

test('doctor reports healthy web install and actionable failures for missing setup', t => {
  const dir = project(t)
  assert.equal(json(['doctor', '--dir', dir], undefined, 1).healthy, false)
  json(['init', '--dir', dir, '--inject-rules', 'AGENTS.md', '--preset', 'paper-editorial'])
  const healthy = json(['doctor', '--dir', dir])
  assert.equal(healthy.healthy, true)
  assert.ok(healthy.checks.every(c => c.pass))
  write(dir, 'src/styles/one-tokens.css', '/* missing motion and preset */')
  write(dir, 'src/styles/one-ui.css', '/* @import "./one-tokens.css"; */')
  const bad = json(['doctor', '--dir', dir], undefined, 1)
  assert.deepEqual(bad.checks.filter(c => !c.pass).map(c => c.name), ['styles', 'theme', 'reduced-motion'])
})

test('verify and audit run bundled Python, surface its report and propagate failures', t => {
  const dir = project(t)
  const verified = json(['verify'], dir)
  assert.equal(verified.status, 'passed')
  assert.equal(verified.report.pairsFailed, 0)
  assert.ok(verified.report.pairsChecked > 0)
  write(dir, 'bad.json', '{}')
  assert.equal(json(['verify', '--tokens', 'bad.json'], dir, 1).status, 'failed')
  write(dir, 'app.html', '<button>Send</button>')
  assert.equal(json(['audit', 'app.html'], dir).report.filesScanned, 1)
  write(dir, 'app.css', '.button { transition: all 1s; }')
  assert.equal(json(['audit', 'app.css'], dir, 1).status, 'failed')
  assert.equal(json(['audit', 'absent'], dir, 1).status, 'failed')
  const unavailable = json(['verify'], dir, 1, { ...process.env, PATH: dir })
  assert.equal(unavailable.status, 'unavailable')
})

test('reconfiguring Tailwind preserves custom CSS and orders the active imports', t => {
  const dir = project(t)
  write(dir, 'src/styles/one-ui.css', 'body { margin: auto; }\n')
  json(['init', '--platform', 'web', '--dir', dir])
  json(['init', '--platform', 'tailwind', '--dir', dir])
  const tailwind = read(dir, 'src/styles/one-ui.css')
  assert.ok(tailwind.startsWith('@import "tailwindcss";\n@import "./one-tokens.css";'))
  assert.ok(tailwind.endsWith('body { margin: auto; }\n'))
  json(['init', '--platform', 'web', '--dir', dir])
  assert.ok(!read(dir, 'src/styles/one-ui.css').includes('tailwind'))
})

test('native doctor checks platform appearance and reduced-motion hooks', t => {
  const dir = project(t)
  json(['init', '--platform', 'flutter', '--dir', dir])
  const first = json(['doctor', '--dir', dir], undefined, 1)
  assert.deepEqual(first.checks.filter(c => !c.pass).map(c => c.name), ['flutter-reduced-motion'])
  write(dir, 'lib/app.dart', 'bool reduce(BuildContext c) => MediaQuery.disableAnimationsOf(c);')
  assert.equal(json(['doctor', '--dir', dir]).healthy, true)
})
