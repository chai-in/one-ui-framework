import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluateSpring, computeSettleDurationMs, springToCssLinear, createSpringDriver, createSpringState, stepSpring, SPRING_PRESETS } from '../src/index.ts'

function close(a: number, b: number, tolerance = 1e-11) {
  assert.ok(Math.abs(a - b) <= tolerance, `${a} vs ${b}, tolerance ${tolerance}`)
}

test('analytical underdamped, critical and overdamped solutions match independently factored examples', () => {
  const t = 0.7
  // Initial offset -1, initial velocity +1. The three characteristic root sets
  // below are -1 ± i, -2 (repeated), and {-1, -3}, respectively.
  for (const [config, position, velocity] of [
    [{ stiffness: 2, damping: 2, mass: 1 }, 1 - Math.exp(-t) * Math.cos(t), Math.exp(-t) * (Math.cos(t) + Math.sin(t))],
    [{ stiffness: 4, damping: 4, mass: 1 }, 1 - (1 + t) * Math.exp(-2*t), (1 + 2*t) * Math.exp(-2*t)],
    [{ stiffness: 3, damping: 4, mass: 1 }, 1 - Math.exp(-t), Math.exp(-t)],
  ] as const) {
    assert.deepEqual(evaluateSpring(0, config, 1), { position: 0, velocity: 1 })
    const sample = evaluateSpring(t, config, 1)
    close(sample.position, position)
    close(sample.velocity, velocity)
    assert.deepEqual(evaluateSpring(1000, config), { position: 1, velocity: 0 })
  }
})

test('near-critical limits from both sides and an extreme overdamped slow pole remain stable', () => {
  const compare = (damping: number) => evaluateSpring(0.93, { stiffness: 4, damping, mass: 1 }, -2)
  for (const damping of [4 - 1e-12, 4 + 1e-12]) {
    close(compare(damping).position, compare(4).position)
    close(compare(damping).velocity, compare(4).velocity)
  }
  const sample = evaluateSpring(1e12, { stiffness: 1, damping: 1e12, mass: 1 })
  close(sample.position, 1 - Math.exp(-1))
  close(sample.velocity, 1e-12 * Math.exp(-1), 1e-24)
})

test('settle duration is the final boundary crossing across regimes and tolerances', () => {
  for (const damping of [0.1, 1, 10, 19.9999999, 20, 20.0000001, 25, 2000]) {
    const config = { stiffness: 100, damping, mass: 1 }
    for (const precision of [0.1, 0.01, 0.001]) {
      const t = computeSettleDurationMs(config, precision) / 1000
      const error = (seconds: number) => Math.abs(1 - evaluateSpring(seconds, config).position)
      close(error(t), precision)
      assert.ok(error(t * (1 - 1e-9)) > precision)
      for (let i = 1; i <= 512; i++) assert.ok(error(t + i * t / 512) <= precision + 1e-12)
    }
  }
  const config = { stiffness: 100, damping: 1, mass: 1 }
  const firstPeak = Math.PI / (Math.sqrt(9.5) * Math.sqrt(10.5))
  const peakError = Math.exp(-0.5 * firstPeak)
  assert.ok(computeSettleDurationMs(config, peakError) / 1000 < firstPeak / 2)
  assert.ok(computeSettleDurationMs(config, peakError - 1e-8) / 1000 > firstPeak)
  // Undamped oscillation never settles inside a position tolerance below 1.
  const undamped = { stiffness: 1, damping: 0, mass: 1 }
  close(evaluateSpring(Math.PI, undamped).position, 2)
  assert.equal(computeSettleDurationMs(undamped), Infinity)
  assert.throws(() => springToCssLinear(undamped), RangeError)
})

test('linear easing has exact boundary stops, preserves overshoot and tracks the analytical curve', () => {
  for (const config of Object.values(SPRING_PRESETS)) {
    const { easing, durationMs } = springToCssLinear(config)
    assert.equal(durationMs, computeSettleDurationMs(config))
    assert.match(easing, /^linear\(0 0%, (?:-?\d+(?:\.\d+)? \d+(?:\.\d+)?%, )+1 100%\)$/)
    const stops = easing.slice(7, -1).split(', ').map(stop => stop.split(' ').map(parseFloat))
    assert.ok(stops.length < 64)
    let segment = 1
    for (let i = 0; i <= 1000; i++) {
      const percent = i / 10
      while (stops[segment][1] < percent) segment++
      const [from, start] = stops[segment-1]
      const [to, end] = stops[segment]
      assert.ok(end > start)
      close(from + (to - from) * (percent - start) / (end - start),
        evaluateSpring(durationMs * percent / 100000, config).position, 0.00201)
    }
    assert.ok(stops.some(([position]) => position > 1))
  }
})

test('retargeting preserves both position and signed instantaneous velocity', () => {
  const driver = createSpringDriver({ from: -10, target: 40, config: SPRING_PRESETS.tactile })
  const before = driver.step(83)
  assert.ok(before.velocity > 0)
  const after = driver.retarget(-40)
  assert.deepEqual(after, { ...before, target: -40 })
  const tinyStep = driver.step(0.0001)
  close((tinyStep.position - after.position) / 1e-7, after.velocity, 0.01)
  assert.deepEqual(driver.retarget(tinyStep.position), { ...tinyStep, target: tinyStep.position })
  assert.ok(driver.step(1).position > tinyStep.position)
  driver.retarget(-40)
  assert.deepEqual(driver.step(10000), { position: -40, target: -40, velocity: 0 })
})

test('analytic stepping is independent of frame rate', () => {
  const state = createSpringState(4, -10, -2.5)
  for (const damping of [1, 4, 10]) {
    const config = { stiffness: 4, damping, mass: 1 }
    const once = stepSpring(state, 350, config)
    let split = state
    for (let i = 0; i < 35; i++) split = stepSpring(split, 10, config)
    close(once.position, split.position)
    close(once.velocity, split.velocity)
  }
})

test('reduced motion settles on creation, mode change and retarget before another frame', () => {
  const initial = createSpringDriver({ from: 10, target: 5, velocity: 100, motionMode: 'reduced' })
  assert.deepEqual(initial.state, { position: 5, target: 5, velocity: 0 })
  assert.deepEqual(initial.retarget(-1), { position: -1, target: -1, velocity: 0 })
  const driver = createSpringDriver({ target: 10 })
  driver.step(16)
  assert.deepEqual(driver.setMotionMode('reduced'), { position: 10, target: 10, velocity: 0 })
  driver.setMotionMode('full')
  assert.deepEqual(driver.retarget(20), { position: 10, target: 20, velocity: 0 })
  assert.deepEqual(stepSpring(driver.state, 0, SPRING_PRESETS.snappy, 'reduced'), { position: 20, target: 20, velocity: 0 })
})

test('invalid times, precision, states and physics parameters fail explicitly', () => {
  assert.throws(() => evaluateSpring(-1, SPRING_PRESETS.gentle), RangeError)
  assert.throws(() => evaluateSpring(1, { ...SPRING_PRESETS.gentle, mass: 0 }), RangeError)
  assert.throws(() => evaluateSpring(0, SPRING_PRESETS.gentle, Infinity), RangeError)
  assert.throws(() => computeSettleDurationMs(SPRING_PRESETS.elastic, 1), RangeError)
  assert.throws(() => createSpringState(NaN), RangeError)
})
