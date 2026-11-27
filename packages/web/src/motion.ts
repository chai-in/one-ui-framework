import { createSpringDriver, SPRING_PRESETS } from '@one-ui/core'
import type { SpringPreset, MotionMode } from '@one-ui/core'

/** One driver per decorative surface. Retargeting keeps both position and velocity. */
export function animateSurface(host: HTMLElement, surface: HTMLElement, preset: SpringPreset) {
  const driver = createSpringDriver({ config: SPRING_PRESETS[preset] })
  const view = host.ownerDocument.defaultView
  const media = view?.matchMedia?.('(prefers-reduced-motion: reduce)')
  let mode: MotionMode = 'calm'
  let frame: number | undefined
  let previous = 0
  let initialized = false
  let onFrame: ((position: number) => void) | undefined

  function paint() {
    surface.style.setProperty('--one-position', String(driver.state.position))
    onFrame?.(driver.state.position)
  }
  function stop() {
    if (frame !== undefined) view?.cancelAnimationFrame(frame)
    frame = undefined
  }
  function tick(time: number) {
    frame = undefined
    driver.step(Math.max(0, time - previous))
    previous = time
    paint()
    if (driver.state.velocity || driver.state.position !== driver.state.target) {
      frame = view!.requestAnimationFrame(tick)
    }
  }
  const ancestors: Element[] = []
  for (let node: Element | null = host; node;) {
    ancestors.push(node)
    node = node.parentElement ?? (node.getRootNode() as ShadowRoot).host ?? null
  }
  function preference() {
    const explicit = ancestors.find(node => node.hasAttribute('data-one-motion'))?.getAttribute('data-one-motion')
    mode = media?.matches || ancestors.some(node => node.getAttribute('data-one-motion') === 'reduced')
      ? 'reduced' : explicit === 'tactile' ? 'tactile' : 'calm'
    surface.dataset.oneMotion = mode
    driver.setMotionMode(mode === 'tactile' ? mode : 'reduced')
    if (mode !== 'tactile') { stop(); paint() }
  }
  const observer = view?.MutationObserver && new view.MutationObserver(preference)
  for (const node of ancestors) observer?.observe(node, { attributes: true, attributeFilter: ['data-one-motion'] })
  media?.addEventListener('change', preference)
  preference()
  return {
    target(value: number) {
      if (!initialized || !view?.requestAnimationFrame) driver.setMotionMode('reduced')
      driver.retarget(value)
      driver.setMotionMode(mode === 'tactile' ? mode : 'reduced')
      initialized = true
      paint()
      if (frame === undefined && view?.requestAnimationFrame && (driver.state.velocity || driver.state.position !== value)) {
        previous = view.performance.now()
        frame = view.requestAnimationFrame(tick)
      }
    },
    sample(callback: (position: number) => void) { onFrame = callback },
    get mode() { return mode },
    dispose() { stop(); observer?.disconnect(); media?.removeEventListener('change', preference) },
  }
}
export type SurfaceMotion = ReturnType<typeof animateSurface>
