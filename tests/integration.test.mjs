// SPDX-License-Identifier: AGPL-3.0-only
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { lstatSync, mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, posix } from 'node:path'
import { performance } from 'node:perf_hooks'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { evaluateSpring, ONE_CONTROLS, ONE_MOMENTS, SPRING_PRESETS } from '@one-ui/core'
import * as react from '@one-ui/react'
import { registerOneUI } from '@one-ui/web'

const root = fileURLToPath(new URL('../', import.meta.url))
const read = path => readFileSync(join(root, path), 'utf8')
const catalog = JSON.parse(read('skills/one-ui/assets/catalog.json'))
const entries = [...catalog.controls, ...catalog.moments]
const numbered = number => String(number).padStart(2, '0')
const componentName = slug => 'One' + slug.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join('')

test('the installed skill carries the exact canonical token file', () => {
  assert.deepEqual(readFileSync(join(root, 'tokens/one.tokens.json')),
    readFileSync(join(root, 'skills/one-ui/assets/one.tokens.json')))
})

test('copied and symlinked standalone skills carry the canonical license and notices', t => {
  const repo = mkdtempSync(join(tmpdir(), 'one-ui-install-'))
  t.after(() => rmSync(repo, { recursive: true, force: true }))
  for (const symlink of [false, true]) {
    execFileSync('python3', [join(root, 'scripts/install.py'), '--repo', repo, ...(symlink ? ['--symlink'] : [])])
    const installed = join(repo, '.agents/skills/one-ui')
    assert.equal(lstatSync(installed).isSymbolicLink(), symlink)
    for (const file of ['LICENSE', 'NOTICE.md']) {
      assert.deepEqual(readFileSync(join(installed, file)), readFileSync(join(root, file)), file)
    }
  }
})

test('core and the agent agree on every catalog field', () => {
  assert.deepEqual(catalog.moments.map(entry => entry.id), Array.from({ length: 36 }, (_, i) => numbered(i + 1)))
  assert.equal(catalog.controls.length, 8)
  assert.equal(new Set(entries.map(entry => entry.slug)).size, 44)
  assert.deepEqual(ONE_MOMENTS, catalog.moments)
  assert.deepEqual(ONE_CONTROLS, catalog.controls)
})

test('every catalog tag registers the matching component', () => {
  const registered = new Map()
  registerOneUI({ get: tag => registered.get(tag), define: (tag, ctor) => registered.set(tag, ctor) })
  assert.deepEqual([...registered.keys()].sort(), [...entries.map(entry => entry.tagName), 'one-moment'].sort())
  for (const entry of entries) assert.deepEqual(registered.get(entry.tagName).entry, entry, entry.tagName)
})

test('React exports all named controls and the matching moment map', () => {
  assert.deepEqual(Object.keys(react.ONE_REACT_MOMENTS).sort(), catalog.moments.map(entry => entry.slug).sort())
  for (const { slug } of entries) {
    const Component = react[componentName(slug)]
    assert.ok(typeof Component === 'function' || Component?.$$typeof === Symbol.for('react.forward_ref'), slug)
  }
  for (const { slug } of catalog.moments) {
    assert.equal(react.ONE_REACT_MOMENTS[slug], react[componentName(slug)], slug)
  }
})

// Join Swift's raw-value cases to their metadata by case name. Kotlin and
// Dart store the same fields together as constructor arguments in each enum.
function swiftMoments(source) {
  const cases = [...source.matchAll(/^\s*case (\w+) = "([\w-]+)"/gm)]
  assert.equal(cases.length, 36)
  const slugs = new Map(cases.map(([, key, slug]) => [key, slug]))
  const metadata = /case \.(\w+):\s*\(\s*(\d+),\s*"([^"]+)",\s*"([^"]+)",\s*\.(\w+),\s*"([^"]+)"/g
  return [...source.matchAll(metadata)].map(([, key, id, name, category, spring, reduced]) =>
    [numbered(id), slugs.get(key), name, category, spring, reduced])
}

function constructorMoments(source) {
  const metadata = /^\s*\w+\(\s*(\d+),\s*['"]([\w-]+)['"],\s*['"]([^'"]+)['"],\s*['"](\w+)['"],\s*OneSpringPreset\.(\w+),\s*['"]([^'"]+)['"]/gm
  return [...source.matchAll(metadata)].map(([, id, slug, name, category, spring, reduced]) =>
    [numbered(id), slug, name, category, spring.toLowerCase(), reduced])
}

const native = [
  { name: 'Swift', path: 'platforms/apple/Sources/OneUI/OneMoments.swift', parse: swiftMoments },
  { name: 'Compose', path: 'platforms/android/OneMoments.kt', parse: constructorMoments },
  { name: 'Flutter', path: 'platforms/flutter/one_moments.dart', parse: constructorMoments },
]
for (const platform of native) {
  test(platform.name + ' moment metadata matches the 36 catalog entries', () => {
    const expected = catalog.moments.map(e => [e.id, e.slug, e.name, e.category, e.springPreset, e.reducedMotionBehavior])
    const actual = platform.parse(read(platform.path))
    assert.deepEqual(actual.sort(([a], [b]) => a.localeCompare(b)), expected)
  })
}

test('root and workspace packages declare AGPL v3 only', () => {
  const license = read('LICENSE')
  assert.match(license, /^\s*GNU AFFERO GENERAL PUBLIC LICENSE\s+Version 3, 19 November 2007/)
  assert.match(license, /13\. Remote Network Interaction/)
  assert.match(license, /END OF TERMS AND CONDITIONS/)
  for (const path of ['', 'packages/core/', 'packages/web/', 'packages/react/', 'packages/cli/']) {
    assert.equal(JSON.parse(read(path + 'package.json')).license, 'AGPL-3.0-only', path + 'package.json')
  }
})

test('agent rules fit the byte budget and include all 28 IDs', () => {
  const rules = read('RULES.md')
  assert.ok(Buffer.byteLength(rules) < 3800)
  const ids = [...new Set(rules.match(/\bONE-\d\d\b/g))].sort()
  assert.deepEqual(ids, Array.from({ length: 28 }, (_, i) => 'ONE-' + numbered(i + 1)))
})

test('standalone web bundle is below 30 kB gzip', t => {
  const bundle = readFileSync(fileURLToPath(import.meta.resolve('@one-ui/web/bundle')))
  const bytes = gzipSync(bundle, { level: 9 }).length
  t.diagnostic(bundle.length + ' bytes raw, ' + bytes + ' bytes gzip (-9)')
  assert.ok(bytes < 30_000, bytes + ' bytes gzip')
})

test('100,000 spring evaluations take less than 50 ms', t => {
  function sample(count) {
    let checksum = 0
    for (let i = 0; i < count; i++) {
      const { position, velocity } = evaluateSpring((i % 1000) / 1000, SPRING_PRESETS.tactile, i % 5)
      checksum += position + velocity
    }
    return checksum
  }
  sample(100_000)
  const start = performance.now()
  const checksum = sample(100_000)
  const elapsed = performance.now() - start
  assert.ok(Number.isFinite(checksum) && checksum > 0)
  t.diagnostic('100,000 evaluations in ' + elapsed.toFixed(3) + ' ms')
  assert.ok(elapsed < 50, elapsed + ' ms')
})

test('active sources use current token and skill paths', () => {
  const generated = new Set(['.git', '.build', '.swiftpm', 'node_modules', '__pycache__', 'dist', '.venv', 'venv'])
  const historical = new Set(['MIGRATION.md', 'CHANGELOG.md', 'NOTICE.md'])
  const stale = /asterline-tokens\.css|skills[\\/]asterline-ui/
  const findings = []
  function visit(directory) {
    for (const entry of readdirSync(join(root, directory), { withFileTypes: true })) {
      const path = posix.join(directory, entry.name)
      if (entry.isDirectory() && generated.has(entry.name)) continue
      if (stale.test(path)) findings.push(path)
      if (entry.isDirectory()) visit(path)
      if (!entry.isFile() || historical.has(path)) continue
      const contents = readFileSync(join(root, path))
      if (contents.includes(0)) continue
      for (const [line, value] of contents.toString('utf8').split('\n').entries()) {
        if (stale.test(value)) findings.push(path + ':' + (line + 1))
      }
    }
  }
  visit('')
  assert.deepEqual(findings, [])
})
