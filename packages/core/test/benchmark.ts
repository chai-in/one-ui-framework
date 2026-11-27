import { performance } from 'node:perf_hooks'
import { evaluateSpring, SPRING_PRESETS } from '../src/spring.ts'

// Rotate through all damping regimes and consume both outputs on every call.
const configs = [
  SPRING_PRESETS.snappy,
  { stiffness: 100, damping: 20, mass: 1 },
  { stiffness: 100, damping: 30, mass: 1 },
]
function run(iterations: number): number {
  let checksum = 0
  for (let i = 0; i < iterations; i++) {
    const { position, velocity } = evaluateSpring((i % 1000) / 1000, configs[i % configs.length], i % 5)
    checksum += position + velocity
  }
  return checksum
}

run(300_000)
const iterations = 3_000_000
const start = performance.now()
const checksum = run(iterations)
const elapsedMs = performance.now() - start
if (!Number.isFinite(checksum) || checksum <= 0) throw new Error('Invalid spring samples.')
console.log(JSON.stringify({ node: process.version, iterations, elapsedMs, evaluationsPerSecond: iterations / (elapsedMs / 1000), checksum }))
