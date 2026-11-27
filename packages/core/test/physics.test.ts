import test from 'node:test'
import assert from 'node:assert/strict'
import { rubberBand, snapToDetent, angularDetent, computeMagneticOffset, computeSwipeProgress, computeFanTransform, computeOdometerDigits } from '../src/index.ts'

test('rubber band is signed, monotone, compressive and bounded', () => {
  let last = 0
  for (const offset of [1, 10, 50, 100, 1000, 10000]) {
    const positive = rubberBand(offset, 80)
    assert.ok(positive > last && positive < 80 && positive < offset)
    assert.equal(rubberBand(-offset, 80), -positive)
    last = positive
  }
  assert.equal(rubberBand(0, 10), 0)
  assert.equal(rubberBand(80, 80, 1), 40)
  assert.equal(rubberBand(100, 0), 0)
})

test('linear and angular detents include endpoints, clamp, wrap and break ties consistently', () => {
  assert.equal(snapToDetent(1.4, 5, -2, 2), 1)
  assert.equal(snapToDetent(1.5, 5, -2, 2), 2)
  assert.equal(snapToDetent(-10, 5, -2, 2), -2)
  assert.equal(snapToDetent(10, 5, -2, 2), 2)
  assert.equal(snapToDetent(1, 1, -2, 2), -2)
  for (const [value, expected] of [[-50, 315], [359, 0], [90, 90], [382.5, 45]]) {
    assert.equal(angularDetent(value, 8), expected)
  }
  assert.throws(() => angularDetent(0, 0), RangeError)
})

test('magnetic offset falls to zero at the radius and respects vector direction', () => {
  const p = { x: 4, y: 3 }
  assert.deepEqual(computeMagneticOffset(p, { x: 0, y: 0 }, 10, 0.5), { x: -1, y: -0.75 })
  assert.deepEqual(computeMagneticOffset(p, { x: 0, y: 0 }, 5, 1), { x: 0, y: 0 })
  assert.deepEqual(computeMagneticOffset(p, p, 0, 1), { x: 0, y: 0 })
})

test('swipe progress clamps and commits exactly at its threshold', () => {
  assert.deepEqual(computeSwipeProgress(75, 100, 0.75), { progress: 0.75, confirmed: true })
  assert.deepEqual(computeSwipeProgress(74, 100, 0.75), { progress: 0.74, confirmed: false })
  assert.deepEqual(computeSwipeProgress(-5, 100), { progress: 0, confirmed: false })
  assert.deepEqual(computeSwipeProgress(120, 100), { progress: 1, confirmed: true })
  assert.deepEqual(computeSwipeProgress(10, 0), { progress: 0, confirmed: false })
})

test('fan is symmetric with a well-defined single-card transform', () => {
  assert.deepEqual(computeFanTransform(0, 3, 90, 12), { rotateDeg: -45, translateY: 0 })
  assert.deepEqual(computeFanTransform(2, 3, 90, 12), { rotateDeg: 45, translateY: 0 })
  assert.deepEqual(computeFanTransform(1, 3, 90, 12), { rotateDeg: 0, translateY: -12 })
  assert.deepEqual(computeFanTransform(0, 1, 90, 12), { rotateDeg: 0, translateY: 0 })
  assert.throws(() => computeFanTransform(3, 3, 90, 12), RangeError)
})

test('odometer wheels retain decimal place through carries, borrows, and sign changes', () => {
  assert.deepEqual(computeOdometerDigits(99, 100), [
    { place: 2, from: null, to: 1, steps: 1 },
    { place: 1, from: 9, to: 0, steps: 1 },
    { place: 0, from: 9, to: 0, steps: 1 },
  ])
  assert.deepEqual(computeOdometerDigits(11, 8), [
    { place: 1, from: 1, to: null, steps: -1 }, { place: 0, from: 1, to: 8, steps: -3 },
  ])
  assert.deepEqual(computeOdometerDigits(-1, 0), [{ place: 0, from: 1, to: 0, steps: -1 }])
  assert.equal(computeOdometerDigits(1, 122).at(-1)?.steps, 121)
  assert.throws(() => computeOdometerDigits(0.1, 10), RangeError)
})
