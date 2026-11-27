import { computeOdometerDigits } from '@one-ui/core'
import { artwork } from './artwork.js'
import type { Context, View } from './contracts.js'
import { bounds, button, clamp, element, numberAttr } from './dom.js'

export function progress(ctx: Context): View {
  const { host, root, motion, entry } = ctx
  const meter = element('div', 'one-meter')
  meter.setAttribute('role', 'progressbar')
  const name = element('span')
  const numeric = element('span', 'one-tabular')
  meter.append(artwork(entry.slug), name, numeric)
  root.append(meter)
  let complete: boolean | undefined
  return { update() {
    const { min, max, value: boundedValue } = bounds(host)
    const state = host.getAttribute('data-one-state') ?? ''
    const terminal = ['completed', 'cancelled', 'error', 'offline', 'unavailable', 'empty'].includes(state)
    const raw = host.getAttribute('value')
    const known = state === 'completed' || Boolean(raw?.trim() && Number.isFinite(Number(raw)))
    const value = state === 'completed' ? max : boundedValue
    name.textContent = ctx.label
    meter.setAttribute('aria-label', ctx.label)
    meter.setAttribute('aria-valuemin', String(min))
    meter.setAttribute('aria-valuemax', String(max))
    if (known) meter.setAttribute('aria-valuenow', String(value))
    else meter.removeAttribute('aria-valuenow')
    meter.toggleAttribute('data-indeterminate', !known && !terminal)
    numeric.textContent = terminal ? state : known ? String(value) : ''
    if (terminal) meter.setAttribute('aria-valuetext', state)
    else meter.removeAttribute('aria-valuetext')
    const fraction = known && max > min ? (value - min) / (max - min) : Number(state === 'completed')
    motion.target(fraction)
    const done = state === 'completed' || (known && value === max && !terminal)
    const newlyComplete = done && complete === false
    complete = done
    if (newlyComplete) ctx.emit('one-complete', value)
  } }
}

export function drops(ctx: Context): View {
  const text = element('span')
  text.setAttribute('role', 'status')
  text.setAttribute('aria-atomic', 'true')
  ctx.root.append(artwork('merge-drops'), text)
  return { update() {
    const value = ctx.host.getAttribute('value') ?? ''
    text.textContent = value || ctx.label
    text.setAttribute('aria-label', ctx.label)
    ctx.motion.target(Number(Boolean(value) && value !== '0'))
  } }
}

export function odometer(ctx: Context): View {
  const { root, motion, host } = ctx
  const readout = element('span', 'one-odometer')
  readout.setAttribute('aria-hidden', 'true')
  const status = element('span', 'one-visually-hidden')
  status.setAttribute('role', 'status')
  status.setAttribute('aria-atomic', 'true')
  const sign = element('span')
  readout.append(sign)
  const down = button('one-tab'), up = button('one-tab')
  down.textContent = '−'; up.textContent = '+'
  root.append(down, readout, up, status)
  const wheels: HTMLElement[] = []
  let last = 0
  function integer(n: number) { return Math.trunc(clamp(n, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)) }
  function step(direction: number) {
    if (ctx.locked) return
    const min = integer(numberAttr(host, 'min', Number.MIN_SAFE_INTEGER))
    const max = Math.max(min, integer(numberAttr(host, 'max', Number.MAX_SAFE_INTEGER)))
    const step = Math.max(1, integer(numberAttr(host, 'step', 1)))
    const value = clamp(last + direction*step, min, max)
    host.setAttribute('value', String(value))
    ctx.emit('one-change', value)
  }
  down.addEventListener('click', () => step(-1)); up.addEventListener('click', () => step(1))
  root.addEventListener('keydown', event => {
    if (['ArrowUp','ArrowRight','ArrowDown','ArrowLeft'].includes(event.key)) {
      event.preventDefault(); step(['ArrowUp','ArrowRight'].includes(event.key) ? 1 : -1)
    }
  })
  motion.sample(position => {
    const magnitude = Math.abs(position)
    sign.textContent = position < 0 ? '−' : ''
    wheels.forEach((wheel, place) => {
      const scaled = magnitude / 10**place
      const tick = Math.floor(scaled)
      const carry = place === 0 ? scaled-tick : clamp(magnitude % 10**place - (10**place-1))
      wheel.style.transform = `translateY(-${tick%10 + carry}em)`
      wheel.parentElement!.hidden = place > 0 && magnitude < 10**place && Math.abs(last) < 10**place
    })
  })
  return { update() {
    const next = integer(numberAttr(host, 'value', 0))
    const digits = computeOdometerDigits(last, next)
    for (let place = wheels.length; place < digits.length; place++) {
      const window = element('span', 'one-digit-window')
      const reel = element('span', 'one-digit-reel', '01234567890')
      window.append(reel)
      readout.insertBefore(window, sign.nextSibling)
      wheels.push(reel)
    }
    last = next
    const description = ctx.label + ' ' + next
    if (status.textContent !== description) status.textContent = description
    up.setAttribute('aria-label', 'Increase ' + ctx.label)
    down.setAttribute('aria-label', 'Decrease ' + ctx.label)
    up.disabled = down.disabled = ctx.locked
    motion.target(next)
  } }
}
