import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { ONE_CONTROLS, ONE_MOMENTS } from '@one-ui/core'
import { OneElement, ONE_TAG_MAP, registerOneUI } from '@one-ui/web'

test('the package and standalone bundle import and register safely on a server', async () => {
  assert.equal(globalThis.HTMLElement, undefined)
  registerOneUI()
  const bundled = await import('@one-ui/web/bundle')
  bundled.registerOneUI()
  assert.equal(typeof OneElement, 'function')
  assert.deepEqual(Object.keys(bundled.ONE_TAG_MAP), Object.keys(ONE_TAG_MAP))
})

test('registry covers the 8 controls, 36 moments and universal wrapper exactly once', () => {
  const expected = [...ONE_CONTROLS, ...ONE_MOMENTS].map(entry => entry.tagName)
  assert.equal(ONE_CONTROLS.length, 8)
  assert.equal(ONE_MOMENTS.length, 36)
  assert.deepEqual(Object.keys(ONE_TAG_MAP).sort(), [...expected, 'one-moment'].sort())
  const definitions = new Map()
  const registry = { get: tag => definitions.get(tag), define(tag, ctor) {
    assert.ok(!definitions.has(tag)); definitions.set(tag, ctor)
  } }
  registerOneUI(registry)
  registerOneUI(registry)
  assert.equal(new Set(definitions.values()).size, 45)
  assert.ok([...definitions.values()].every(ctor => ctor.prototype instanceof OneElement))
})

test('the browser artifact has no import graph and contains every catalog visual', async () => {
  const source = await readFile(new URL('../dist/one-ui-web.bundle.js', import.meta.url), 'utf8')
  const bundled = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'))
  assert.equal(Object.keys(bundled.ONE_TAG_MAP).length, 45)
  const css = await readFile(new URL('../dist/one-moments.css', import.meta.url), 'utf8')
  for (const moment of ONE_MOMENTS) {
    assert.ok(css.includes(`[data-one-moment="${moment.slug}"]`), moment.slug)
    assert.ok(css.includes(`@keyframes one-${moment.slug} {`), moment.slug)
  }
  for (const filename of ['one-moments.css', 'one-primitives.css', 'one-tokens.css', 'one-layout.css']) {
    assert.equal(await readFile(new URL('../dist/' + filename, import.meta.url), 'utf8'),
      await readFile(new URL('../../../platforms/web/' + filename, import.meta.url), 'utf8'))
  }
})
