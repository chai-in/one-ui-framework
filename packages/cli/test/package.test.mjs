import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

test('packed CLI installs offline and runs with only the published core tarball', t => {
  const dir = mkdtempSync(join(tmpdir(), 'one-ui-pack-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  const packages = fileURLToPath(new URL('../../', import.meta.url))
  function run(executable, args, cwd = dir) {
    const result = spawnSync(executable, args, { cwd, encoding: 'utf8', shell: process.platform === 'win32' })
    assert.equal(result.status, 0, String(result.error ?? '') + result.stderr + result.stdout)
    return result.stdout.trim()
  }
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const tarballs = ['core', 'cli'].map(name => {
    const manifests = JSON.parse(run(npm, ['pack', '--json', '--ignore-scripts', '--offline', join(packages, name)]))
    const [manifest] = Object.values(manifests)
    return join(dir, manifest.filename)
  })
  const consumer = join(dir, 'consumer')
  mkdirSync(consumer)
  writeFileSync(join(consumer, 'package.json'), '{"name":"one-ui-package-test","private":true}\n')
  run(npm, ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', ...tarballs], consumer)
  const bin = join(consumer, 'node_modules/.bin', process.platform === 'win32' ? 'one-ui.cmd' : 'one-ui')
  assert.equal(run(bin, ['--version']), '1.0.0')
  const app = join(dir, 'application')
  run(bin, ['init', '--dir', app, '--platform', 'web', '--inject-rules', 'AGENTS.md'])
  const doctor = JSON.parse(run(bin, ['doctor', '--dir', app, '--json']))
  assert.equal(doctor.healthy, true)
  run(bin, ['add', '09', '--dir', app])
  // Import the exact file copied into the consumer. Its self-contained ESM
  // registers every tag without resolving application packages or a bundler.
  const runtime = join(app, 'src/components/one-ui/one-ui-web.bundle.js')
  const registered = run(process.execPath, ['--input-type=module', '-e',
    `import { pathToFileURL } from 'node:url'
     const { registerOneUI } = await import(pathToFileURL(process.argv[1]))
     const tags = new Map()
     registerOneUI({ get: name => tags.get(name), define: (name, cls) => tags.set(name, cls) })
     console.log(JSON.stringify([...tags.keys()]))`, runtime])
  assert.ok(JSON.parse(registered).includes('one-paper-plane'))
  assert.ok(readFileSync(join(app, 'one-ui/NOTICE.md'), 'utf8').includes('AGPL-3.0-only'))
  assert.equal(JSON.parse(run(bin, ['verify', '--json'])).status, 'passed')
})
