import { computeFanTransform, computeMagneticOffset } from '@one-ui/core'
import { artwork } from './artwork.js'
import type { Context, View } from './contracts.js'
import { arrowIndex, button, element, options, slot } from './dom.js'

const defaults: Record<string, string[]> = {
  'pebble-rating': ['1', '2', '3', '4', '5'],
  'snap-grid': ['1', '2', '3', '4'], 'magnet-grid': ['1', '2', '3', '4'],
}

export function selection(ctx: Context): View {
  const { host, entry, root, motion } = ctx
  const tabs = entry.semanticRole === 'tablist'
  const group = element('div', tabs ? 'one-tabs one-options' : 'one-options')
  group.setAttribute('role', entry.semanticRole)
  root.append(group)
  const labels = options(host, defaults[entry.slug] ?? ['1', '2', '3'])
  const panels: HTMLElement[] = []
  const buttons = labels.map((label, i) => {
    const item = button('one-tab one-option')
    item.setAttribute('role', tabs ? 'tab' : 'radio')
    const image = artwork(entry.slug)
    if (entry.slug !== 'tabs') item.append(image)
    item.append(element('span', '', label))
    const marker = element('span', 'one-option-mark', '✓')
    marker.setAttribute('aria-hidden', 'true')
    item.append(marker)
    group.append(item)
    if (tabs) {
      const panel = element('div', 'one-panel')
      panel.id = 'panel-' + i
      item.id = 'tab-' + i
      item.setAttribute('aria-controls', panel.id)
      panel.setAttribute('aria-labelledby', item.id)
      panel.setAttribute('role', 'tabpanel')
      panel.tabIndex = 0
      const content = slot('panel-' + i)
      content.textContent = label
      panel.append(content)
      root.append(panel)
      panels.push(panel)
    }
    if (entry.slug === 'card-fan') {
      const fan = computeFanTransform(i, labels.length, 28, 5)
      image.style.setProperty('--one-angle', fan.rotateDeg + 'deg')
      image.style.setProperty('--one-lift', fan.translateY + 'px')
    }
    if (entry.slug === 'magnet-grid') {
      item.addEventListener('pointermove', event => {
        if (ctx.locked || motion.mode !== 'tactile') return
        const box = item.getBoundingClientRect()
        const offset = computeMagneticOffset({ x: box.x + box.width/2, y: box.y + box.height/2 },
          { x: event.clientX, y: event.clientY }, Math.max(box.width, box.height), .3)
        image.style.setProperty('--one-x', offset.x + 'px')
        image.style.setProperty('--one-y', offset.y + 'px')
      })
      item.addEventListener('pointerleave', () => {
        image.style.removeProperty('--one-x')
        image.style.removeProperty('--one-y')
      })
    }
    function select() {
      if (ctx.locked) return
      host.setAttribute('value', label)
      ctx.emit('one-select', label, { index: i })
      ctx.emit('one-change', label, { index: i })
    }
    item.addEventListener('click', select)
    item.addEventListener('keydown', event => {
      if (ctx.locked) return
      const axis = tabs ? (group.getAttribute('aria-orientation') === 'vertical' ? 'vertical' : 'horizontal') : undefined
      const horizontal = event.key === 'ArrowRight' || event.key === 'ArrowLeft'
      const rtl = horizontal && axis !== 'vertical' && host.ownerDocument.defaultView?.getComputedStyle(item).direction === 'rtl'
      const direction = rtl ? -1 : 1
      const next = arrowIndex(event, i, labels.length, entry.slug.endsWith('-grid') ? 2 : 1, axis, direction)
      if (next === null) return
      event.preventDefault()
      buttons[next].focus()
      buttons[next].click()
    })
    return item
  })
  // The selection marker follows the live spring when a second item is selected mid-flight.
  motion.sample(position => buttons.forEach((item, i) => {
    item.style.setProperty('--one-nearness', String(Math.max(0, 1 - Math.abs(i - position))))
  }))
  return { update() {
    group.setAttribute('aria-label', ctx.label)
    if (tabs) group.setAttribute('aria-orientation', host.getAttribute('orientation') === 'vertical' ? 'vertical' : 'horizontal')
    const selected = Math.max(0, labels.indexOf(host.getAttribute('value') ?? ''))
    buttons.forEach((item, i) => {
      item.disabled = ctx.locked
      item.setAttribute(tabs ? 'aria-selected' : 'aria-checked', String(i === selected))
      item.tabIndex = i === selected ? 0 : -1
      if (tabs) panels[i].hidden = i !== selected
    })
    motion.target(selected)
  } }
}

export function checklist(ctx: Context): View {
  const labels = options(ctx.host, ['1', '2', '3'])
  const group = element('div', 'one-checks')
  group.setAttribute('role', 'group')
  ctx.root.append(group)
  const inputs = labels.map((label, index) => {
    const row = element('label', 'one-check')
    const input = element('input', 'one-focusable')
    input.type = 'checkbox'
    row.append(input, artwork('checklist'), element('span', '', label))
    group.append(row)
    input.addEventListener('change', () => {
      if (ctx.locked) return
      const value = labels.filter((_, i) => inputs[i].checked).join(',')
      ctx.host.setAttribute('value', value)
      ctx.emit('one-change', value, { index, checked: input.checked })
    })
    return input
  })
  return { update() {
    group.setAttribute('aria-label', ctx.label)
    const values = optionsFromValue(ctx.host)
    inputs.forEach((input, i) => { input.disabled = ctx.locked; input.checked = values.includes(labels[i]) })
    ctx.motion.target(values.length)
  } }
}
function optionsFromValue(host: HTMLElement) {
  return (host.getAttribute('value') ?? '').split(',').map(value => value.trim()).filter(Boolean)
}

export function menu(ctx: Context): View {
  const { host, root, entry } = ctx
  const trigger = button('one-btn')
  const label = element('span')
  trigger.append(artwork(entry.slug), label)
  trigger.setAttribute('aria-haspopup', 'menu')
  trigger.setAttribute('aria-controls', 'actions')
  const list = element('div', 'one-menu')
  list.id = 'actions'
  list.setAttribute('role', 'menu')
  root.append(trigger, list)
  function open(next: boolean, index = 0) {
    const changed = host.hasAttribute('open') !== next
    if (changed) host.toggleAttribute('open', next)
    if (next) items[index].focus()
    else trigger.focus()
    if (changed) ctx.emit('one-toggle', next)
  }
  const items = options(host, ['Edit', 'Share', 'Archive']).map((name, i, all) => {
    const radial = entry.slug === 'radial-menu'
    const item = button(radial ? 'one-radial-target' : 'one-tab')
    item.setAttribute('role', 'menuitem')
    if (radial) item.append(element('span', 'one-tab one-radial-face', name))
    else item.textContent = name
    item.tabIndex = -1
    const angle = 2 * Math.PI * i / all.length - Math.PI / 2
    item.style.setProperty('--one-menu-x', String(Math.cos(angle)))
    item.style.setProperty('--one-menu-y', String(Math.sin(angle)))
    item.addEventListener('click', () => {
      if (ctx.locked) return
      host.setAttribute('value', name)
      open(false)
      ctx.emit('one-select', name, { index: i })
      ctx.emit('one-action', name, { index: i })
    })
    item.addEventListener('keydown', event => {
      const next = arrowIndex(event, i, items.length, 1, 'vertical')
      if (next !== null) { event.preventDefault(); items[next].focus() }
    })
    list.append(item)
    return item
  })
  if (entry.slug === 'radial-menu' && items.length <= 6) list.classList.add('one-radial')
  trigger.addEventListener('click', () => { if (!ctx.locked) open(!host.hasAttribute('open')) })
  trigger.addEventListener('keydown', event => {
    if (!ctx.locked && !event.defaultPrevented && !event.isComposing && !event.altKey && !event.ctrlKey && !event.metaKey && ['ArrowDown', 'ArrowUp'].includes(event.key)) {
      event.preventDefault()
      open(true, event.key === 'ArrowUp' ? items.length - 1 : 0)
    }
  })
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !event.defaultPrevented && !event.isComposing && !ctx.locked && host.hasAttribute('open')) {
      event.preventDefault(); event.stopPropagation(); open(false)
    }
  })
  function dismiss() {
    if (host.hasAttribute('open')) { host.removeAttribute('open'); ctx.emit('one-toggle', false) }
  }
  root.addEventListener('focusout', event => {
    if (event.relatedTarget && !root.contains(event.relatedTarget as Node)) dismiss()
  })
  const outside = (event: Event) => { if (!event.composedPath().includes(host)) dismiss() }
  host.ownerDocument.addEventListener('pointerdown', outside)
  return {
    update() {
      label.textContent = ctx.label
      const expanded = host.hasAttribute('open') && !ctx.locked
      list.hidden = !expanded
      list.setAttribute('aria-label', ctx.label)
      trigger.setAttribute('aria-expanded', String(expanded))
      trigger.disabled = ctx.locked
      ctx.motion.target(Number(expanded))
    },
    dispose() { host.ownerDocument.removeEventListener('pointerdown', outside) },
  }
}
