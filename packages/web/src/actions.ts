import { angularDetent, computeSwipeProgress, rubberBand } from '@one-ui/core'
import type { Context, View } from './contracts.js'
import { artwork } from './artwork.js'
import { bounds, button, clamp, element, slot } from './dom.js'

export function action(ctx: Context): View {
  const { host, root, entry, motion } = ctx
  const slug = entry.slug
  const toggle = entry.semanticRole === 'switch' || entry.attributes.includes('pressed')
  const state = entry.semanticRole === 'switch' ? 'checked' : 'pressed'
  const node = button(slug === 'switch' ? 'one-switch' : 'one-btn')
  const label = slot()
  const outcome = element('span', 'one-outcome')
  outcome.setAttribute('role', 'status')
  if (slug !== 'button' && slug !== 'switch') node.append(artwork(slug))
  if (entry.semanticRole === 'switch') node.setAttribute('role', 'switch')
  node.append(label)
  root.append(node, outcome)
  let count = 0
  let dragging: { id: number; start: number; moved: boolean } | undefined
  let suppressClick = false
  function perform() {
    if (ctx.locked) return
    if (toggle) {
      const active = host.toggleAttribute(state)
      ctx.emit('one-toggle', active, { checked: active })
      ctx.emit('one-change', active, { checked: active })
    } else {
      if (slug === 'flip-coin') {
        const tails = Math.random() < .5
        count += 2
        if (Boolean(count % 2) !== tails) count++
      } else count++
      motion.target(slug === 'swipe-confirm' ? 1 : count)
      if (slug === 'paper-plane') { outcome.textContent = 'Send requested'; ctx.emit('one-send', count) }
      if (slug === 'swipe-confirm') {
        outcome.textContent = 'Confirmed'
        ctx.emit('one-confirm', true)
      }
      if (slug === 'flip-coin') outcome.textContent = count % 2 ? 'Tails' : 'Heads'
      ctx.emit('one-action', slug === 'flip-coin' ? outcome.textContent! : host.getAttribute('value') ?? count)
    }
  }
  node.addEventListener('click', event => {
    if (ctx.locked) { event.preventDefault(); event.stopPropagation(); return }
    if (suppressClick && event.detail !== 0) { suppressClick = false; return }
    perform()
  })
  if (slug === 'swipe-confirm') {
    node.addEventListener('pointerdown', event => {
      if (ctx.locked || event.button !== 0 || dragging) return
      suppressClick = false
      dragging = { id: event.pointerId, start: event.clientX, moved: false }
      node.setPointerCapture(event.pointerId)
    })
    const swipe = (x: number) => computeSwipeProgress(x - dragging!.start, node.getBoundingClientRect().width)
    node.addEventListener('pointermove', event => {
      if (dragging?.id !== event.pointerId) return
      dragging.moved ||= Math.abs(event.clientX - dragging.start) > 4
      motion.target(swipe(event.clientX).progress)
    })
    node.addEventListener('pointerup', event => {
      if (dragging?.id !== event.pointerId) return
      suppressClick = dragging.moved || Math.abs(event.clientX - dragging.start) > 4
      const confirmed = swipe(event.clientX).confirmed
      dragging = undefined
      if (suppressClick && confirmed) perform()
      else if (suppressClick) motion.target(0)
    })
    const cancel = () => { if (dragging) { dragging = undefined; suppressClick = true; motion.target(0) } }
    node.addEventListener('pointercancel', cancel)
    node.addEventListener('lostpointercapture', cancel)
  }
  return { update() {
    label.textContent = ctx.label
    if (host.hasAttribute('label')) node.setAttribute('aria-label', ctx.label)
    else node.removeAttribute('aria-label')
    node.disabled = host.hasAttribute('disabled') || (ctx.locked && !host.hasAttribute('loading') && host.getAttribute('aria-busy') !== 'true')
    node.setAttribute('aria-busy', String(host.hasAttribute('loading') || host.getAttribute('aria-busy') === 'true'))
    node.setAttribute('aria-disabled', String(ctx.locked))
    node.dataset.oneRole = host.getAttribute('data-one-role') ?? 'action'
    if (toggle) {
      const active = host.hasAttribute(state)
      node.setAttribute('aria-' + state, String(active))
      motion.target(Number(active))
    } else if (!count && !dragging) motion.target(0)
  } }
}

export function range(ctx: Context): View {
  const { host, root, entry } = ctx
  const input = element('input', 'one-range one-focusable')
  input.type = 'range'
  input.setAttribute('role', 'slider')
  const label = element('label', 'one-range-label')
  const name = element('span')
  const value = element('output')
  value.setAttribute('aria-hidden', 'true')
  const art = artwork(entry.slug)
  label.append(name, art, input, value)
  root.append(label)

  function commit(next: number) {
    if (ctx.locked) return
    const { min, max, step } = bounds(host)
    const numeric = clamp(Number((min + Math.round((next-min)/step)*step).toPrecision(14)), min, max)
    if (numeric === bounds(host).value) return
    host.setAttribute('value', String(numeric))
    ctx.emit('one-change', numeric)
  }
  // Native range handles keyboard, touch and pointer; the graphic is an additional drag surface.
  input.addEventListener('input', () => commit(input.valueAsNumber))
  let pointer: number | undefined
  function drag(event: PointerEvent) {
    const box = art.getBoundingClientRect()
    const { min, max, step } = bounds(host)
    if (!box.width || max === min) return
    let fraction = clamp((event.clientX - box.left)/box.width)
    if (entry.slug === 'detent-dial') {
      const angle = Math.atan2(event.clientX - box.left - box.width/2, box.top + box.height/2 - event.clientY)*180/Math.PI
      const detents = Math.min(360, Math.max(2, Math.round((max-min)/step) + 1))
      fraction = angularDetent(angle, detents)/360*detents/(detents-1)
    }
    commit(min + (max-min)*fraction)
  }
  art.addEventListener('pointerdown', event => {
    if (ctx.locked || event.button !== 0 || pointer !== undefined) return
    event.preventDefault(); input.focus(); pointer = event.pointerId; art.setPointerCapture(pointer); drag(event)
  })
  art.addEventListener('pointermove', event => { if (event.pointerId === pointer) drag(event) })
  art.addEventListener('pointerup', event => { if (pointer === event.pointerId) { drag(event); pointer = undefined } })
  art.addEventListener('lostpointercapture', () => { pointer = undefined })
  if (entry.slug === 'elastic-string') {
    const string = art.querySelector('.string')!
    ctx.motion.sample(p => {
      const bend = ctx.motion.mode === 'reduced' ? 0 : rubberBand((p-.5)*48, 20)
      string.setAttribute('d', `M4 20Q${4+56*p} ${20+bend} 60 20`)
    })
  }
  return { update() {
    const b = bounds(host)
    name.textContent = ctx.label
    input.setAttribute('aria-label', ctx.label)
    input.min = String(b.min); input.max = String(b.max); input.step = String(b.step)
    input.value = String(b.value)
    value.textContent = input.value
    input.disabled = ctx.locked
    const detents = Math.min(360, Math.max(2, Math.round((b.max-b.min)/b.step) + 1))
    art.style.setProperty('--one-arc', (360 - 360/detents) + 'deg')
    if (entry.slug === 'detent-dial') art.style.cursor = ctx.locked ? 'not-allowed' : 'grab'
    ctx.motion.target(b.max === b.min ? 0 : (input.valueAsNumber-b.min)/(b.max-b.min))
  } }
}
