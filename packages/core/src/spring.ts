export interface SpringConfig {
  readonly stiffness: number
  readonly damping: number
  readonly mass: number
}

export const SPRING_PRESETS = {
  snappy: { stiffness: 420, damping: 32, mass: 1 },
  tactile: { stiffness: 360, damping: 24, mass: 1 },
  elastic: { stiffness: 300, damping: 20, mass: 1 },
  gentle: { stiffness: 220, damping: 26, mass: 1 },
  detent: { stiffness: 520, damping: 38, mass: 1 },
} as const satisfies Record<string, SpringConfig>

export type SpringPreset = keyof typeof SPRING_PRESETS
export type MotionMode = 'full' | 'calm' | 'tactile' | 'reduced'
export interface SpringSample { readonly position: number; readonly velocity: number }

function checkConfig({ stiffness, damping, mass }: SpringConfig) {
  if (!Number.isFinite(stiffness) || stiffness <= 0 || !Number.isFinite(mass) || mass <= 0 ||
      !Number.isFinite(damping) || damping < 0) {
    throw new RangeError('Spring mass and stiffness must be positive and damping nonnegative.')
  }
}

function checkTime(t: number) {
  if (!Number.isFinite(t) || t < 0) throw new RangeError('Elapsed time must be finite and nonnegative.')
}

// Solve for signed displacement from equilibrium and its first derivative.
function propagate(t: number, config: SpringConfig, x: number, v: number): SpringSample {
  const a = config.damping / (2 * config.mass)
  const w2 = config.stiffness / config.mass
  const w = Math.sqrt(w2)
  if (t === 0) return { position: x, velocity: v }

  if (a > w) {
    const b = Math.sqrt(a - w) * Math.sqrt(a + w)
    const slow = -w2 / (a + b)
    const fast = -(a + b)
    const decay = Math.exp(slow * t)
    // expm1 keeps the divided difference accurate as the roots coalesce.
    const s = decay * (-Math.expm1(-2 * b * t) / (2 * b))
    const impulse = v - slow * x
    const position = decay * x + s * impulse
    return { position, velocity: slow * position + Math.exp(fast * t) * impulse }
  }

  const decay = Math.exp(-a * t)
  if (decay === 0) return { position: 0, velocity: 0 }
  const b = Math.sqrt(w - a) * Math.sqrt(w + a)
  const c = b === 0 ? decay : decay * Math.cos(b * t)
  const s = b === 0 ? decay * t : decay * (Math.sin(b * t) / b)
  return { position: x * c + (v + a * x) * s, velocity: v * c - (a * v + w2 * x) * s }
}

/** Unit step from 0 to 1. Time is seconds and velocity is units per second. */
export function evaluateSpring(t: number, config: SpringConfig, initialVelocity = 0): SpringSample {
  checkTime(t)
  checkConfig(config)
  if (!Number.isFinite(initialVelocity)) throw new RangeError('Velocity must be finite.')
  const sample = propagate(t, config, -1, initialVelocity)
  return { position: 1 + sample.position, velocity: sample.velocity }
}

/** Last crossing of the position tolerance for a unit step starting at rest, in milliseconds. */
export function computeSettleDurationMs(config: SpringConfig, precision = 0.001): number {
  checkConfig(config)
  if (!(precision > 0 && precision < 1)) throw new RangeError('Precision must be between 0 and 1.')
  if (config.damping === 0) return Infinity
  const w = Math.sqrt(config.stiffness / config.mass)
  const a = config.damping / (2 * config.mass)
  let low = 0
  let limit = Infinity
  if (a < w) {
    const b = Math.sqrt(w - a) * Math.sqrt(w + a)
    // Stationary points occur every half-period with magnitude exp(-a * t).
    let lastPeak = Math.floor(-Math.log(precision) * b / (Math.PI * a))
    const peakMagnitude = (index: number) => Math.exp(-a * (index * Math.PI / b))
    // At an exact tangency the curve has already entered the tolerance band.
    // Compare magnitudes directly because the logarithm can round across an integer.
    if (lastPeak > 0 && peakMagnitude(lastPeak) <= precision) lastPeak--
    else if (peakMagnitude(lastPeak + 1) > precision) lastPeak++
    low = lastPeak * Math.PI / b
    limit = low + (Math.PI / 2 + Math.atan2(a, b)) / b
  }
  let span = 1 / w
  let high = Math.min(limit, low + span)
  const error = (t: number) => Math.abs(propagate(t, config, -1, 0).position)
  while (high < limit && error(high) > precision) {
    span *= 2
    high = Math.min(limit, low + span)
  }
  for (let i = 0; i < 64; i++) {
    const mid = (low + high) / 2
    if (mid === low || mid === high) break
    if (error(mid) > precision) low = mid
    else high = mid
  }
  return high * 1000
}

export interface SpringCssOptions {
  /** Final position tolerance. */
  precision?: number
  /** Maximum interpolation error before snapping the last stop to 1. */
  tolerance?: number
}

export function springToCssLinear(config: SpringConfig, options: SpringCssOptions = {}) {
  const durationMs = computeSettleDurationMs(config, options.precision)
  if (!Number.isFinite(durationMs)) throw new RangeError('A CSS spring requires positive damping.')
  const tolerance = options.tolerance ?? 0.001
  if (!(tolerance > 0 && tolerance < 1)) throw new RangeError('Tolerance must be between 0 and 1.')
  const seconds = durationMs / 1000
  const w = Math.sqrt(config.stiffness / config.mass)
  const a = config.damping / (2 * config.mass)
  // Curvature changes sign where velocity is extremal. These boundaries prevent
  // an entire oscillation from hiding between samples with equal values.
  const b = Math.sqrt(Math.abs(w - a)) * Math.sqrt(w + a)
  let inflection = 1 / w
  if (a < w) inflection = Math.atan2(b, a) / b
  if (a > w) inflection = Math.asinh(b / w) / b
  const period = a < w ? Math.PI / b : Infinity
  if (seconds / period > 65536) throw new RangeError('This spring requires too many CSS stops.')

  const value = (t: number) => 1 + propagate(t, config, -1, 0).position
  const stops = ['0 0%']
  function appendInterval(start: number, end: number) {
    const pending = [[start, value(start), end, value(end)]]
    while (pending.length > 0) {
      const [left, from, right, to] = pending.pop()!
      const middle = left + (right - left) / 2
      const actual = value(middle)
      // On a convex or concave segment the maximum chord error is at most
      // twice its midpoint error. Subdivide only while that bound is too high.
      if (middle !== left && middle !== right && Math.abs(actual - (from + to) / 2) > tolerance / 2) {
        pending.push([middle, actual, right, to], [left, from, middle, actual])
      } else {
        if (stops.length >= 65536) throw new RangeError('This spring requires too many CSS stops.')
        stops.push(right === seconds ? '1 100%' :
          `${Number(to.toFixed(8))} ${Number((right / seconds * 100).toFixed(8))}%`)
      }
    }
  }
  let start = 0
  while (inflection < seconds) {
    appendInterval(start, inflection)
    start = inflection
    inflection += period
  }
  appendInterval(start, seconds)
  return { easing: `linear(${stops.join(', ')})`, durationMs }
}

export interface SpringState extends SpringSample { readonly target: number }
export interface SpringDriverOptions {
  from?: number
  target?: number
  velocity?: number
  config?: SpringConfig
  motionMode?: MotionMode
}

export function createSpringState(position = 0, target = position, velocity = 0): SpringState {
  if (![position, target, velocity].every(Number.isFinite)) throw new RangeError('Spring state must be finite.')
  return { position, target, velocity }
}

/** Advance by a frame delta in milliseconds. State and target are expressed in caller units. */
export function stepSpring(state: SpringState, deltaMs: number, config: SpringConfig = SPRING_PRESETS.snappy,
                           motionMode: MotionMode = 'full'): SpringState {
  checkTime(deltaMs)
  checkConfig(config)
  if (motionMode === 'reduced') return { position: state.target, target: state.target, velocity: 0 }
  if (deltaMs === 0) return state
  const sample = propagate(deltaMs / 1000, config, state.position - state.target, state.velocity)
  if (Math.abs(sample.position) <= 1e-6 && Math.abs(sample.velocity) <= 1e-6) {
    return { position: state.target, target: state.target, velocity: 0 }
  }
  return { position: state.target + sample.position, velocity: sample.velocity, target: state.target }
}

/** Frame-clock independent. Call step(deltaMs) from the rendering platform's own clock. */
export function createSpringDriver(options: SpringDriverOptions = {}) {
  const config = options.config ?? SPRING_PRESETS.snappy
  checkConfig(config)
  let mode = options.motionMode ?? 'full'
  let state = createSpringState(options.from, options.target, options.velocity)
  state = stepSpring(state, 0, config, mode)
  return {
    get state() { return state },
    step(deltaMs: number) { return state = stepSpring(state, deltaMs, config, mode) },
    retarget(target: number) {
      state = createSpringState(state.position, target, state.velocity)
      return state = stepSpring(state, 0, config, mode)
    },
    setMotionMode(next: MotionMode) {
      mode = next
      return state = stepSpring(state, 0, config, mode)
    },
  }
}
