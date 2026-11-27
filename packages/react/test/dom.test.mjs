import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test, { afterEach, beforeEach } from 'node:test'
import { JSDOM } from 'jsdom'
import * as React from 'react'
import { renderToString } from 'react-dom/server'
import { createSpringDriver, ONE_MOMENTS, SPRING_PRESETS } from '@one-ui/core'
import * as ui from '@one-ui/react'

const dom = new JSDOM('<!doctype html><body></body>')
globalThis.window = dom.window
globalThis.document = window.document
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const { createRoot, hydrateRoot } = await import('react-dom/client')
const act = React.act ?? (await import('react-dom/test-utils')).act
const h = React.createElement
const options = [
  { value: 'first', label: 'First', panel: 'First panel', variant: 'accept' },
  { value: 'locked', label: 'Locked', panel: 'Locked panel', variant: 'decline', disabled: true },
  { value: 'last', label: 'Last', panel: 'Last panel', variant: 'neutral' },
]
let root, container, media, frames, now, nextFrame
beforeEach(() => {
  document.body.replaceChildren()
  container = document.createElement('main')
  document.body.append(container)
  root = createRoot(container)
  media = new window.EventTarget()
  media.matches = false
  window.matchMedia = query => { assert.equal(query, '(prefers-reduced-motion: reduce)'); return media }
  frames = new Map()
  nextFrame = 0
  now = 0
  window.performance.now = () => now
  window.requestAnimationFrame = callback => { frames.set(++nextFrame, callback); return nextFrame }
  window.cancelAnimationFrame = id => frames.delete(id)
})
afterEach(async () => { await act(() => root.unmount()); assert.equal(frames.size, 0) })
const render = element => act(() => root.render(element))
const click = element => act(() => element.click())
const key = (el, key, init) => act(() => { el.dispatchEvent(new window.KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init })) })
const $ = selector => container.querySelector(selector)
const $$ = selector => [...container.querySelectorAll(selector)]
async function setInput(input, value, type = 'input') {
  await act(() => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, value)
    input.dispatchEvent(new window.Event(type, { bubbles: true }))
  })
}
async function frame(ms) {
  const pending = [...frames.values()]
  frames.clear()
  now += ms
  await act(() => pending.forEach(callback => callback(now)))
}
async function reduce(matches) {
  await act(() => { media.matches = matches; media.dispatchEvent(new window.Event('change')) })
}
function pointer(el, type, x) {
  return act(() => { el.dispatchEvent(Object.assign(new window.MouseEvent(type, { clientX: x, bubbles: true, button: 0 }), { isPrimary: true, pointerId: 1 })) })
}

test('a loading destructive button keeps role colors and suppresses repeat activation', async () => {
  const css = readFileSync(new URL(import.meta.resolve('@one-ui/react/styles.css')), 'utf8')
  const [, disabledFillSelector] = css.match(/([^{}]+)\{\s*background:\s*var\(--one-color-disabled-fill\);/)
  let calls = 0
  const props = { variant: 'destructive', onClick: () => calls++ }
  await render(h(ui.OneButton, { ...props, loading: true }, 'Delete'))
  const button = $('button')
  assert.equal(button.dataset.oneVariant, 'destructive')
  assert.equal(button.getAttribute('aria-busy'), 'true')
  assert.equal(button.getAttribute('aria-disabled'), 'true')
  assert.equal(button.matches(disabledFillSelector.trim()), false)
  await click(button)
  await click(button)
  assert.equal(calls, 0)
  await render(h(ui.OneButton, { ...props, loading: true, disabled: true }, 'Delete'))
  assert.equal(button.disabled, true)
  assert.equal(button.getAttribute('aria-busy'), 'true')
  assert.equal(button.matches(disabledFillSelector.trim()), false)
  await click(button)
  assert.equal(calls, 0)
  await render(h(ui.OneButton, { ...props, 'aria-disabled': true }, 'Delete'))
  assert.equal(button.matches(disabledFillSelector.trim()), true)
})

test('native button guards repeated loading clicks, accepts refs and retains its label', async () => {
  let calls = 0
  const ref = React.createRef()
  const props = { onClick: () => calls++, ref, variant: 'destructive' }
  await render(h(ui.OneButton, { ...props, loading: true }, 'Delete'))
  await click(ref.current)
  assert.equal(calls, 0)
  assert.equal(ref.current.textContent, 'Delete')
  assert.equal(ref.current.type, 'button')
  assert.equal(ref.current.getAttribute('aria-busy'), 'true')
  await render(h(ui.OneButton, props, 'Delete'))
  await click(ref.current)
  assert.equal(calls, 1)
})
test('choice group emits the chosen action and disables unavailable choices', async () => {
  const chosen = []
  await render(h(ui.OneChoiceGroup, { label: 'Actions', options, onChoose: v => chosen.push(v) }))
  for (const button of $$('button')) await click(button)
  assert.deepEqual(chosen, ['first', 'last'])
})
test('native field forwards input events, disabled state and ref', async () => {
  const ref = React.createRef()
  let received
  await render(h(ui.OneField, { label: 'Name', ref, onChange: e => { received = e.currentTarget.value } }))
  await setInput(ref.current, 'Ari')
  assert.equal(received, 'Ari')
  assert.equal(ref.current.labels[0].textContent, 'Name')
})
test('core controlled switch retains the supplied value until its parent accepts the change', async () => {
  const changed = []
  const props = { label: 'Alerts', onCheckedChange: v => changed.push(v) }
  await render(h(ui.OneSwitch, { ...props, checked: false }))
  await click($('button'))
  assert.deepEqual(changed, [true])
  assert.equal($('button').getAttribute('aria-checked'), 'false')
  await render(h(ui.OneSwitch, { ...props, checked: true }))
  assert.equal($('button').getAttribute('aria-checked'), 'true')
})
test('core tabs skip disabled siblings, wrap, respect orientation and associate each panel', async () => {
  const changed = []
  await render(h(ui.OneTabs, { label: 'Views', options, orientation: 'vertical', onValueChange: v => changed.push(v) }))
  const [first, locked, last] = $$('[role=tab]')
  await key(first, 'ArrowRight')
  assert.equal(first.tabIndex, 0)
  await key(first, 'ArrowDown')
  assert.equal(last.tabIndex, 0)
  assert.equal(document.activeElement, last)
  assert.equal(document.getElementById(last.getAttribute('aria-controls')).hidden, false)
  assert.equal(locked.disabled, true)
  await key(last, 'ArrowDown')
  await key(first, 'End')
  await key(last, 'Home')
  assert.deepEqual(changed, ['last', 'first', 'last', 'first'])
})
test('horizontal tabs follow reading direction and recover focus when the current tab disappears', async () => {
  const changed = []
  const show = options => render(h(React.Fragment, null, h('button', null, 'Outside'),
    h(ui.OneTabs, { label: 'Views', options, onValueChange: value => changed.push(value) })))
  await show(options)
  const [first, , last] = $$('[role=tab]')
  first.style.direction = 'rtl'
  first.focus()
  await key(first, 'ArrowDown')
  await key(first, 'ArrowRight', { altKey: true })
  assert.equal(document.activeElement, first)
  await key(first, 'ArrowRight')
  assert.equal(document.activeElement, last)
  await show(options.slice(0, 2))
  assert.equal(document.activeElement, first)
  assert.equal(first.getAttribute('aria-selected'), 'true')
  const outside = $('button')
  outside.focus()
  await show(options.slice(1))
  assert.equal(document.activeElement, outside)
  assert.deepEqual(changed, ['last'])
})
test('dialog opens modally, requests cancellation and restores its invoker', async () => {
  // jsdom does not implement the browser's top layer. Exercise the native API boundary.
  const proto = window.HTMLDialogElement.prototype
  proto.showModal = function () { this.open = true; this.querySelector('button').focus() }
  proto.close = function () { this.open = false }
  const states = []
  await render(h(React.Fragment, null, h('button', null, 'Other action'),
    h(ui.OneDialog, { label: 'Details', trigger: 'Show', onOpenChange: open => states.push(open) }, 'Details here')))
  const [previous, trigger] = $$('button')
  // A pointing-device click does not focus a button on every browser/platform.
  previous.focus()
  await click(trigger)
  assert.equal($('dialog').open, true)
  assert.equal(document.activeElement, $('dialog button'))
  await act(() => { $('dialog').dispatchEvent(new window.Event('cancel', { cancelable: true })) })
  assert.equal($('dialog').open, false)
  assert.equal(document.activeElement, trigger)
  assert.deepEqual(states, [true, false])
})
test('nested popovers close one layer per Escape and only the outer disclosure on outside press', async () => {
  const child = h(ui.OnePopover, { label: 'Child' }, h('input'))
  await render(h(ui.OnePopover, { label: 'Parent' }, child))
  const [parent, inner] = $$('button')
  await click(parent); await click(inner)
  $('input').focus()
  await key($('input'), 'Escape')
  assert.equal(document.activeElement, inner)
  assert.equal(inner.getAttribute('aria-expanded'), 'false')
  assert.equal(parent.getAttribute('aria-expanded'), 'true')
  await key(inner, 'Escape')
  assert.equal(document.activeElement, parent)
  await click(parent)
  await pointer(document.body, 'pointerdown', 0)
  assert.equal(parent.getAttribute('aria-expanded'), 'false')
})

test('search Escape protects composition, clears the query, and then dismisses the containing popover', async () => {
  const changed = [], submitted = []
  await render(h(ui.OnePopover, { label: 'Find', defaultOpen: true }, h(ui.OneRubberSearch, {
    defaultValue: 'draft', onValueChange: value => changed.push(value), onSubmit: value => submitted.push(value),
  })))
  const input = $('input')
  await act(() => input.focus())
  await key(input, 'Escape', { isComposing: true })
  await key(input, 'Enter', { isComposing: true })
  assert.equal(input.value, 'draft')
  assert.deepEqual(submitted, [])
  await key(input, 'Escape')
  assert.equal(input.value, '')
  assert.equal($('button').getAttribute('aria-expanded'), 'true')
  assert.deepEqual(changed, [''])
  await key(input, 'Escape')
  assert.equal($('button').getAttribute('aria-expanded'), 'false')
  assert.equal(document.activeElement, $('button'))
})

test('an open popover leaves Escape to an unrelated modal in a shadow root', async () => {
  await render(h(ui.OnePopover, { label: 'Background details', defaultOpen: true }, 'Details'))
  const host = document.body.appendChild(document.createElement('section'))
  const shadow = host.attachShadow({ mode: 'open' })
  const dialog = shadow.appendChild(document.createElement('dialog'))
  dialog.open = true
  dialog.append(document.createElement('slot'))
  const slottedButton = host.appendChild(document.createElement('button'))
  const escape = new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true, composed: true, cancelable: true })
  await act(() => slottedButton.dispatchEvent(escape))
  assert.equal(escape.defaultPrevented, false)
  assert.equal($('button').getAttribute('aria-expanded'), 'true')
})

test('provider updates uncontrolled settings, honors explicit props and inherits scoped overrides', async () => {
  let current, nested, changes = 0
  function Probe({ inner }) {
    const theme = ui.useOneTheme()
    if (inner) nested = theme
    else current = theme
    return null
  }
  await render(h(ui.OneProvider, { theme: 'light', tokens: { overlay: '#010203' }, onThemeChange: () => changes++ },
    h(Probe), h(ui.OneProvider, { preset: 'high-contrast' }, h(Probe, { inner: true }))))
  await act(() => current.updateTheme({ theme: 'dark', density: 'compact', motion: 'reduced', actionBorder: 'bordered' }))
  assert.equal(changes, 1)
  assert.equal(current.theme, 'light')
  assert.equal(nested.preset, 'high-contrast')
  assert.equal(nested.palettes.dark.overlay, '#010203')
  assert.equal(nested.motion, 'reduced')
  assert.equal(nested.density, 'compact')
  assert.equal($('[data-one-preset=high-contrast]').dataset.oneActionBorder, 'bordered')
})
test('spring preserves velocity through reversal and configuration changes, then snaps on system reduction', async () => {
  function Probe({ target, config }) { return h('output', null, ui.useOneSpring(target, config)) }
  const renderAt = (target, config) => render(h(Probe, { target, config }))
  const engine = createSpringDriver({ config: SPRING_PRESETS.tactile })
  await renderAt(0, 'tactile')
  await renderAt(10, 'tactile')
  engine.retarget(10)
  await frame(40)
  assert.equal(Number($('output').textContent), engine.step(40).position)
  await renderAt(-6, 'tactile')
  engine.retarget(-6)
  await frame(12)
  assert.equal(Number($('output').textContent), engine.step(12).position)
  const changed = createSpringDriver({ from: engine.state.position, velocity: engine.state.velocity, target: -3, config: SPRING_PRESETS.gentle })
  await renderAt(-3, { ...SPRING_PRESETS.gentle })
  await frame(13)
  assert.equal(Number($('output').textContent), changed.step(13).position)
  await reduce(true)
  assert.equal($('output').textContent, '-3')
  assert.equal(frames.size, 0)
  await renderAt(100, 'snappy')
  assert.equal($('output').textContent, '100')
  await reduce(false)
  assert.equal(frames.size, 0)
})
test('provider reduction sets final values immediately with the same action and focus', async () => {
  function renderSwitch(motion) {
    return render(h(ui.OneProvider, { motion }, h(ui.OneBloomToggle, { label: 'Active' }), h(ui.OneBarsFade)))
  }
  await renderSwitch('tactile')
  const toggle = $('button')
  toggle.focus()
  await click(toggle)
  await frame(16)
  assert.ok(Number(toggle.style.getPropertyValue('--one-position')) < 1)
  await renderSwitch('reduced')
  assert.equal(document.activeElement, toggle)
  assert.equal(toggle.getAttribute('aria-checked'), 'true')
  assert.equal(toggle.style.getPropertyValue('--one-position'), '1')
  assert.equal($('[role=progressbar]').dataset.animate, 'false')
  await click(toggle)
  assert.equal(toggle.style.getPropertyValue('--one-position'), '0')
})
test('hydrates server snapshots with system reduced motion and preserves generated IDs', async () => {
  function Probe() { return h('output', null, ui.useReducedMotion() ? 'reduced' : 'full') }
  const tree = h(ui.OneProvider, null, h(ui.OneField, { label: 'Name' }), h(Probe))
  await act(() => root.unmount())
  container.innerHTML = renderToString(tree)
  const input = $('input')
  assert.equal($('output').textContent, 'full')
  media.matches = true
  const errors = []
  await act(() => { root = hydrateRoot(container, tree, { onRecoverableError: error => errors.push(error) }) })
  assert.equal($('input'), input)
  assert.equal(input.labels[0].textContent, 'Name')
  assert.equal($('output').textContent, 'reduced')
  assert.deepEqual(errors, [])
})

for (const spec of ONE_MOMENTS) {
  test(spec.name + ' commits its catalog state independently of animation', async () => {
    const Component = ui.ONE_REACT_MOMENTS[spec.slug]
    const props = { label: 'Example' }
    const received = []
    const record = value => received.push(value)
    const show = extra => render(h(ui.OneProvider, { motion: 'reduced' }, h(Component, { ...props, ...extra })))
    if (spec.semanticRole === 'switch' || spec.attributes.includes('pressed')) {
      const pressed = spec.attributes.includes('pressed')
      await show({ [pressed ? 'onPressedChange' : 'onCheckedChange']: record })
      const button = $('button')
      await click(button); await click(button)
      assert.equal(button.getAttribute(pressed ? 'aria-pressed' : 'aria-checked'), 'false')
      assert.deepEqual(received, [true, false])
    } else if (spec.attributes.includes('open')) {
      await show({ options, onChoose: record })
      const button = $('button')
      await key(button, 'ArrowUp')
      const [first, , last] = $$('[role=menuitem]')
      assert.equal(document.activeElement, last)
      await key(last, 'ArrowDown')
      assert.equal(document.activeElement, first)
      await key(first, 'Escape')
      assert.equal(document.activeElement, button)
      await click(button)
      await click(last)
      assert.deepEqual(received, ['last'])
      assert.equal(button.getAttribute('aria-expanded'), 'false')
    } else if (spec.semanticRole === 'button') {
      await show({ onClick: () => record('click') })
      await click($('button'))
      assert.deepEqual(received, ['click'])
      if (spec.slug === 'swipe-confirm') assert.equal($('[role=status]').textContent, 'Confirmed')
      if (spec.slug === 'flip-coin') assert.match($('[role=status]').textContent, /^(Heads|Tails)$/)
    } else if (spec.semanticRole === 'radiogroup') {
      await show({ options, onValueChange: record })
      await click($$('input')[2])
      assert.equal($('input:checked').value, 'last')
      assert.deepEqual(received, ['last'])
    } else if (spec.semanticRole === 'tablist') {
      await show({ options, onValueChange: record })
      const tabs = $$('[role=tab]')
      await key(tabs[0], 'ArrowLeft')
      assert.equal(tabs[2].getAttribute('aria-selected'), 'true')
      assert.deepEqual(received, ['last'])
    } else if (spec.semanticRole === 'group') {
      await show({ options, onValueChange: record })
      await click($$('input')[0]); await click($$('input')[2]); await click($$('input')[0])
      assert.deepEqual(received, [['first'], ['first', 'last'], ['last']])
    } else if (spec.semanticRole === 'slider') {
      await show({ min: -1, max: 1, step: .25, onValueChange: record, valueText: n => String(n * 100) + '%' })
      await setInput($('input'), '.75')
      assert.equal($('input').getAttribute('aria-valuetext'), '75%')
      assert.deepEqual(received, [.75])
    } else if (spec.semanticRole === 'searchbox') {
      await show({ onSubmit: record, onValueChange: record })
      await setInput($('input'), 'notes')
      await key($('input'), 'Enter')
      assert.deepEqual(received, ['notes', 'notes'])
    } else if (spec.semanticRole === 'progressbar') {
      await show({ max: 5 })
      assert.equal($('[role=progressbar]').hasAttribute('aria-valuenow'), false)
      await show({ max: 5, value: 6 })
      assert.equal($('[role=progressbar]').getAttribute('aria-valuenow'), '5')
      assert.equal($('[role=progressbar]').dataset.animate, 'false')
    } else if (spec.slug === 'odometer') {
      await show({ value: 99 }); await show({ value: -102 })
      assert.equal($('.one-sr-only').textContent, 'Example -102')
      assert.equal($('.one-mark').textContent, '−102')
    } else {
      await show({ value: 'Separate', merged: false }); await show({ value: 'Merged', merged: true })
      assert.equal($('[role=status]').textContent, 'Example Merged')
    }
    assert.equal(frames.size, 0)
  })
}
test('swipe confirmation suppresses a short drag and accepts a full gesture or keyboard click', async () => {
  let count = 0
  await render(h(ui.OneSwipeConfirm, { onClick: () => count++ }))
  const el = $('button')
  el.setPointerCapture = () => {}
  Object.defineProperty(el, 'clientWidth', { value: 100 })
  async function drag(x, end = 'pointerup') {
    await pointer(el, 'pointerdown', 0); await pointer(el, 'pointermove', x); await pointer(el, end, x)
    await act(() => { el.dispatchEvent(new window.MouseEvent('click', { bubbles: true, detail: 1 })) })
  }
  await drag(60)
  await drag(90, 'pointercancel')
  await drag(90, 'lostpointercapture')
  assert.equal(count, 0)
  await drag(90)
  assert.equal(count, 1)
  await click(el)
  assert.equal(count, 2)
})
test('menus collapse when choices become unavailable and dismiss on pointer-only outside interactions', async () => {
  const states = []
  const show = (extra = {}) => render(h(ui.OneMenuMorph, { options, onOpenChange: state => states.push(state), ...extra }))
  await show()
  const button = $('button')
  await click(button)
  assert.equal(document.activeElement, $('[role=menuitem]'))
  await pointer(document.body, 'pointerdown', 0)
  assert.equal($('[role=menu]').hidden, true)
  await click(button)
  await show({ options: [options[1]] })
  assert.equal(button.getAttribute('aria-disabled'), 'true')
  assert.equal(button.getAttribute('aria-expanded'), 'false')
  await key(button, 'ArrowDown')
  await click(button)
  await show()
  assert.equal($('[role=menu]').hidden, true)
  assert.deepEqual(states, [true, false, true, false])
})
test('a menu command can intentionally move focus to the next step', async () => {
  const states = []
  await render(h(React.Fragment, null, h('button', null, 'Next step'),
    h(ui.OneMenuMorph, { options, onOpenChange: state => states.push(state), onChoose: () => $('button').focus() })))
  const [next, trigger] = $$('button')
  await click(trigger)
  await click($('[role=menuitem]'))
  assert.equal(document.activeElement, next)
  assert.equal(trigger.getAttribute('aria-expanded'), 'false')
  assert.deepEqual(states, [true, false])
})
test('failed, cancelled and completed operations stop indeterminate motion and expose their outcomes', async () => {
  for (const state of ['error', 'cancelled', 'completed']) {
    await render(h(ui.OneDownloadRing))
    assert.equal($('[role=progressbar]').dataset.animate, 'true')
    await render(h(ui.OneDownloadRing, { state }))
    assert.equal($('[role=progressbar]').dataset.animate, 'false')
    assert.equal($('[role=progressbar]').getAttribute('aria-valuetext'), state)
    assert.equal($('[role=progressbar]').getAttribute('aria-valuenow'), state === 'completed' ? '100' : null)
  }
})
