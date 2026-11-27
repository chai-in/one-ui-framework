import test from 'node:test'
import assert from 'node:assert/strict'
import { findMoment, ONE_MOMENTS, ONE_CONTROLS, SPRING_PRESETS } from '../src/index.ts'

test('catalog has the 36 ordered moments and eight uniquely tagged controls', () => {
  const names = 'bars-fade bloom-toggle snap-grid card-fan gooey-tab-bar blocks-scale stretch-toggle merge-drops paper-plane detent-dial domino-row pebble-rating jelly-pad swipe-confirm bookmark depth-stack menu-morph elastic-string ripple-pad worm-dots download-ring leaf-tabs bell-toggle ink-switch rocker-switch scrub-wave squash-play rubber-search odometer tide-progress eclipse-half magnet-grid checklist flip-coin radial-menu dot-revolve'.split(' ')
  assert.deepEqual(ONE_MOMENTS.map(item => item.slug), names)
  assert.deepEqual(ONE_CONTROLS.map(item => item.slug), 'button field dialog popover choice-group badge tabs switch'.split(' '))
  const all = [...ONE_CONTROLS, ...ONE_MOMENTS]
  assert.equal(new Set(all.map(x => x.tagName)).size, 44)
  assert.equal(new Set(all.map(x => x.id)).size, 44)
  for (const entry of all) {
    assert.ok(Object.hasOwn(SPRING_PRESETS, entry.springPreset))
    for (const key of ['name', 'category', 'semanticRole', 'ariaPattern', 'reducedMotionBehavior'] as const) assert.ok(entry[key])
    assert.ok(entry.attributes.length && Array.isArray(entry.events))
  }
  ONE_MOMENTS.forEach((entry, i) => {
    assert.equal(entry.id, String(i + 1).padStart(2, '0'))
    for (const query of [entry.id, i + 1, entry.slug, entry.tagName, entry.name.toUpperCase()]) assert.equal(findMoment(query), entry)
  })
  assert.equal(findMoment(' prototype '), undefined)
  assert.equal(findMoment('37'), undefined)
})
