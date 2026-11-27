export interface Point { readonly x: number; readonly y: number }

function finite(value: number, label: string) {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`)
}

function positiveCount(count: number) {
  if (!Number.isSafeInteger(count) || count < 1) throw new RangeError('Count must be a positive integer.')
}

/** Signed overscroll in caller units. The asymptote is limit and the initial slope is resistance. */
export function rubberBand(offset: number, limit: number, resistance = 0.55): number {
  finite(offset, 'Offset')
  finite(limit, 'Limit')
  finite(resistance, 'Resistance')
  if (limit < 0 || resistance < 0) throw new RangeError('Limit and resistance must be nonnegative.')
  if (offset === 0 || limit === 0 || resistance === 0) return 0
  return Math.sign(offset) * (limit / (1 + limit / Math.abs(offset) / resistance))
}

/** Nearest of steps equally spaced detents including both endpoints. One detent is at min. */
export function snapToDetent(value: number, steps: number, min: number, max: number): number {
  positiveCount(steps)
  finite(value, 'Value')
  finite(min, 'Minimum')
  finite(max, 'Maximum')
  if (max < min) throw new RangeError('Maximum must be at least minimum.')
  if (steps === 1 || max === min || value <= min) return min
  if (value >= max) return max
  const index = Math.round((value - min) / (max - min) * (steps - 1))
  return min + (max - min) * (index / (steps - 1))
}

/** Snapped angle in [0, 360). Increasing angles win ties. */
export function angularDetent(angleDeg: number, count: number): number {
  positiveCount(count)
  finite(angleDeg, 'Angle')
  const angle = (angleDeg % 360 + 360) % 360
  return (Math.round(angle / 360 * count) % count) * (360 / count)
}

/** Offset toward target with linear radial falloff. Strength is a fraction in [0, 1]. */
export function computeMagneticOffset(point: Point, target: Point, radius: number, strength = 1): Point {
  finite(radius, 'Radius')
  if (radius < 0 || !(strength >= 0 && strength <= 1)) throw new RangeError('Invalid magnetic field.')
  const dx = target.x - point.x
  const dy = target.y - point.y
  finite(dx, 'Horizontal distance')
  finite(dy, 'Vertical distance')
  const distance = Math.hypot(dx, dy)
  if (distance >= radius || distance === 0 || strength === 0) return { x: 0, y: 0 }
  const factor = strength * (1 - distance / radius)
  return { x: dx * factor, y: dy * factor }
}

/** Rightward track progress in [0, 1] and whether the fractional commit threshold was reached. */
export function computeSwipeProgress(deltaX: number, trackWidth: number, threshold = 0.8) {
  finite(deltaX, 'Swipe distance')
  finite(trackWidth, 'Track width')
  if (trackWidth < 0 || !(threshold > 0 && threshold <= 1)) throw new RangeError('Invalid swipe track or threshold.')
  const progress = trackWidth === 0 ? 0 : Math.max(0, Math.min(1, deltaX / trackWidth))
  return { progress, confirmed: progress >= threshold }
}

/** Symmetric fan. Middle cards lift furthest and the edge rotations span spreadDeg in total. */
export function computeFanTransform(index: number, total: number, spreadDeg: number, liftPx: number) {
  positiveCount(total)
  if (!Number.isSafeInteger(index) || index < 0 || index >= total) throw new RangeError('Index is outside the fan.')
  finite(spreadDeg, 'Spread')
  finite(liftPx, 'Lift')
  if (total === 1) return { rotateDeg: 0, translateY: 0 }
  const fraction = index / (total - 1) * 2 - 1
  return { rotateDeg: fraction * spreadDeg / 2, translateY: -liftPx * (1 - fraction * fraction) || 0 }
}

export interface OdometerDigit {
  /** Decimal place, starting at zero for units. */
  place: number
  /** Null denotes a newly inserted or removed wheel. Signs are formatted separately. */
  from: number | null
  to: number | null
  /** Signed number of digit increments, including full turns. */
  steps: number
}

/** Most significant magnitude digit first. Keys remain stable across carries and borrows. */
export function computeOdometerDigits(prev: number, next: number): OdometerDigit[] {
  if (!Number.isSafeInteger(prev) || !Number.isSafeInteger(next)) throw new RangeError('Odometer values must be safe integers.')
  const before = String(Math.abs(prev))
  const after = String(Math.abs(next))
  return Array.from({ length: Math.max(before.length, after.length) }, (_, index) => {
    const place = Math.max(before.length, after.length) - index - 1
    const a = before.at(-1 - place)
    const b = after.at(-1 - place)
    const divisor = 10 ** place
    return {
      place, from: a === undefined ? null : Number(a), to: b === undefined ? null : Number(b),
      steps: Math.floor(Math.abs(next) / divisor) - Math.floor(Math.abs(prev) / divisor),
    }
  })
}
