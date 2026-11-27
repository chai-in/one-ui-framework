import { after, afterEach, test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { ONE_CONTROLS, ONE_MOMENTS } from '@one-ui/core'
import { activate, events, key, mount, pointer, window } from './harness.mjs'

await import('@one-ui/web')
afterEach(() => document.body.replaceChildren())
after(() => window.happyDOM.abort())

for (const entry of [...ONE_CONTROLS, ...ONE_MOMENTS]) {
  test(entry.tagName + ' mounts with its catalog semantics', () => {
    const host = mount(entry.tagName, { label: 'Named control' })
    const root = host.shadowRoot
    assert.equal(root.querySelector('.one-widget').dataset.oneComponent, entry.slug)
    if (entry.id !== entry.slug) assert.equal(root.querySelector('.one-widget').dataset.oneMoment, entry.slug)
    const role = entry.semanticRole
    const selector = { text: '.one-badge', button: 'button', textbox: 'input', searchbox: 'input[type=search]', dialog: 'dialog' }
    assert.ok(root.querySelector(selector[role] ?? '[role="' + role + '"]'), entry.slug)
  })
}

for (const entry of ONE_MOMENTS.filter(item => item.semanticRole === 'switch' || item.attributes.includes('pressed'))) {
  test(entry.tagName + ' reflects toggle state and emits exactly one composed change per activation', () => {
    const host = mount(entry.tagName)
    const node = host.shadowRoot.querySelector('button')
    const state = entry.semanticRole === 'switch' ? 'checked' : 'pressed'
    const toggles = events(host, 'one-toggle')
    const changes = events(document.body, 'one-change')
    activate(node, ' ')
    assert.equal(node.getAttribute('aria-' + state), 'true')
    assert.equal(host.hasAttribute(state), true)
    assert.deepEqual(changes[0].detail, { name: entry.slug, value: true, checked: true })
    assert.ok(changes[0].composed && changes[0].bubbles)
    activate(node)
    host.disabled = true
    activate(node)
    assert.equal(changes.length, 2)
    assert.equal(toggles.length, 2)
    assert.equal(node.getAttribute('aria-' + state), 'false')
  })
}

for (const entry of [...ONE_MOMENTS, ...ONE_CONTROLS].filter(item => ['radiogroup', 'tablist'].includes(item.semanticRole))) {
  test(entry.tagName + ' roves focus and selection, preserving associated panels', () => {
    const host = mount(entry.tagName, { options: 'First,Second,Third' })
    const items = [...host.shadowRoot.querySelectorAll('button')]
    const received = events(host, 'one-select')
    key(items[0], 'ArrowRight')
    assert.equal(host.value, 'Second')
    assert.equal(host.shadowRoot.activeElement, items[1])
    key(items[1], 'End')
    assert.equal(host.value, 'Third')
    assert.deepEqual(items.map(item => item.tabIndex), [-1, -1, 0])
    assert.equal(received[1].detail.index, 2)
    assert.equal(items[2].getAttribute(entry.semanticRole === 'tablist' ? 'aria-selected' : 'aria-checked'), 'true')
    if (entry.semanticRole === 'tablist') {
      const panel = host.shadowRoot.getElementById(items[2].getAttribute('aria-controls'))
      assert.equal(panel.hidden, false)
      assert.equal(panel.getAttribute('aria-labelledby'), items[2].id)
      assert.equal(host.shadowRoot.querySelector('[role=tabpanel]').hidden, true)
    }
    key(items[2], 'Home')
    assert.equal(host.value, 'First')
  })
}

test('tablists reserve the cross-axis arrows and follow horizontal reading direction', () => {
  const host = mount('one-tabs', { options: 'First,Second,Third' })
  const items = [...host.shadowRoot.querySelectorAll('[role=tab]')]
  const selected = events(host, 'one-select')
  items[0].focus()
  assert.equal(key(items[0], 'ArrowDown').defaultPrevented, false)
  assert.equal(host.shadowRoot.activeElement, items[0])
  for (const item of items) item.style.direction = 'rtl'
  assert.equal(key(items[0], 'ArrowRight').defaultPrevented, true)
  assert.equal(host.shadowRoot.activeElement, items[2])
  host.setAttribute('orientation', 'vertical')
  assert.equal(key(items[2], 'ArrowLeft').defaultPrevented, false)
  assert.equal(key(items[2], 'ArrowDown').defaultPrevented, true)
  assert.equal(host.shadowRoot.activeElement, items[0])
  assert.deepEqual(selected.map(event => event.detail.value), ['Third', 'First'])
})

test('universal wrapper resolves names, ID and slug, and replaces obsolete controls', () => {
  const host = mount('one-moment', { name: '02' })
  activate(host.shadowRoot.querySelector('button'))
  assert.ok(host.checked)
  host.setAttribute('name', 'Pebble Rating')
  assert.equal(host.shadowRoot.querySelectorAll('[role=radio]').length, 5)
  host.setAttribute('name', 'rubber-search')
  assert.ok(host.shadowRoot.querySelector('input'))
  host.setAttribute('name', 'missing')
  assert.equal(host.shadowRoot.querySelector('.one-widget'), null)
})

test('busy button preserves its native target, label and semantic role and guards duplicate activation', () => {
  const host = mount('one-button', { label: 'Approve invoice', 'data-one-role': 'accept' })
  const node = host.shadowRoot.querySelector('button')
  const actions = events(host, 'one-action')
  host.setAttribute('loading', '')
  activate(node)
  assert.equal(actions.length, 0)
  assert.equal(node.getAttribute('aria-busy'), 'true')
  assert.equal(node.dataset.oneRole, 'accept')
  host.removeAttribute('loading')
  activate(node)
  assert.equal(actions.length, 1)
  assert.equal(node, host.shadowRoot.querySelector('button'))
  assert.equal(node.getAttribute('aria-label'), 'Approve invoice')
})

test('choice-group reports the selected action and locks its buttons as a unit', () => {
  const host = mount('one-choice-group')
  const items = host.shadowRoot.querySelectorAll('button')
  const actions = events(host, 'one-action')
  activate(items[1])
  assert.equal(actions[0].detail.value, 'Decline')
  host.disabled = true
  activate(items[0])
  assert.equal(actions.length, 1)
})

test('choice-group uses neutral custom actions unless their labels specify a semantic role', () => {
  for (const [attributes, labels, roles] of [
    [{}, ['Accept', 'Decline'], ['accept', 'decline']],
    [{ options: 'Delete,Cancel' }, ['Delete', 'Cancel'], ['neutral', 'neutral']],
    [{ options: 'Delete:destructive,Cancel:neutral' }, ['Delete', 'Cancel'], ['destructive', 'neutral']],
  ]) {
    const host = mount('one-choice-group', attributes)
    const items = [...host.shadowRoot.querySelectorAll('button')]
    assert.deepEqual(items.map(item => item.dataset.oneRole), roles)
    assert.deepEqual(items.map(item => item.textContent), labels)
    const actions = events(host, 'one-action')
    activate(items[0])
    assert.equal(actions[0].detail.value, labels[0])
  }
})

test('field keeps its native input and edits when an associated error appears', () => {
  const host = mount('one-field', { name: 'title', label: 'Title', description: 'Article title' })
  const input = host.shadowRoot.querySelector('input')
  const changes = events(host, 'one-change')
  input.value = 'Draft'
  input.dispatchEvent(new window.Event('input', { bubbles: true }))
  host.setAttribute('error', 'Choose a longer title')
  assert.equal(host.value, 'Draft')
  assert.equal(input, host.shadowRoot.querySelector('input'))
  assert.equal(changes[0].detail.value, 'Draft')
  assert.equal(input.getAttribute('aria-invalid'), 'true')
  assert.equal(host.shadowRoot.getElementById(input.getAttribute('aria-describedby')).textContent, 'Choose a longer title')
})

test('rubber search clears on Escape and submits the current query on Enter', () => {
  const host = mount('one-rubber-search', { value: 'phrase' })
  const input = host.shadowRoot.querySelector('input')
  const actions = events(host, 'one-action')
  key(input, 'Enter')
  assert.equal(actions[0].detail.value, 'phrase')
  for (const key of ['Escape', 'Enter']) {
    input.dispatchEvent(new window.KeyboardEvent('keydown', { key, isComposing: true, bubbles: true, cancelable: true }))
  }
  assert.equal(actions.length, 1)
  assert.equal(host.value, 'phrase')
  key(input, 'Escape')
  assert.equal(host.value, '')
  assert.equal(input.value, '')
})

for (const name of ['dialog', 'popover']) {
  test(name + ' toggles with its invoker and restores focus to the opener', () => {
    const host = mount('one-' + name, { label: 'Details' })
    const [trigger, close] = host.shadowRoot.querySelectorAll('button')
    const previous = document.createElement('button')
    document.body.append(previous)
    const toggles = events(host, 'one-toggle')
    // A pointing-device click does not focus a button on every browser/platform.
    previous.focus(); trigger.click()
    assert.equal(host.open, true)
    assert.equal(trigger.getAttribute('aria-expanded'), 'true')
    close.focus(); activate(close)
    assert.equal(host.open, false)
    assert.equal(host.shadowRoot.activeElement, trigger)
    assert.deepEqual(toggles.map(e => e.detail.value), [true, false])
  })
}

test('radial entrance selectors animate only the pointer-transparent face of each fixed target', () => {
  const host = mount('one-radial-menu')
  const trigger = host.shadowRoot.querySelector('button')
  key(trigger, 'ArrowDown')
  const items = [...host.shadowRoot.querySelectorAll('[role=menuitem]')]
  assert.equal(host.shadowRoot.activeElement, items[0])
  const css = readFileSync(new URL(import.meta.resolve('@one-ui/web/one-moments.css')), 'utf8')
  const entrances = [...css.matchAll(/([^{}]+)\{[^{}]*animation(?:-name)?:\s*one-radial-(?:open|expand)\b/g)]
  assert.equal(entrances.length, 2)
  for (const item of items) {
    assert.ok(item.style.getPropertyValue('--one-menu-x') && item.style.getPropertyValue('--one-menu-y'))
    for (const [, selector] of entrances) {
      assert.equal(item.matches(selector.trim()), false)
      assert.equal(item.firstElementChild.matches(selector.trim()), true)
    }
  }
  assert.match(css, /\.one-radial-face\s*\{[^{}]*pointer-events:\s*none/)
  assert.match(css, /\.one-radial button\s*\{[^{}]*position:\s*absolute[^{}]*transform:[^{}]*--one-menu-x[^{}]*--one-menu-y/)
  key(items[0], 'Escape')
  assert.equal(host.shadowRoot.activeElement, trigger)
})

for (const name of ['menu-morph', 'radial-menu']) {
  test(name + ' supports opening, navigation, selection and Escape focus return', () => {
    const host = mount('one-' + name)
    const root = host.shadowRoot
    const trigger = root.querySelector('button')
    const items = root.querySelectorAll('[role=menuitem]')
    key(trigger, 'ArrowDown')
    assert.equal(root.activeElement, items[0])
    key(items[0], 'ArrowDown')
    assert.equal(root.activeElement, items[1])
    assert.equal(key(items[1], 'ArrowRight').defaultPrevented, false)
    assert.equal(root.activeElement, items[1])
    key(items[1], 'Escape')
    assert.equal(root.activeElement, trigger)
    assert.equal(trigger.getAttribute('aria-expanded'), 'false')
    key(trigger, 'ArrowUp')
    activate(items[2])
    assert.equal(host.value, 'Archive')
    assert.equal(host.open, false)
  })
}

test('swipe cancel, subthreshold drag, completed drag and keyboard confirmation are distinct', () => {
  const host = mount('one-swipe-confirm')
  const target = host.shadowRoot.querySelector('button')
  target.getBoundingClientRect = () => ({ width: 100 })
  target.setPointerCapture = () => {}
  const confirms = events(host, 'one-confirm')
  function drag(end, type = 'pointerup') {
    pointer(target, 'pointerdown', 0)
    pointer(target, 'pointermove', end)
    pointer(target, type, end)
    target.dispatchEvent(new window.MouseEvent('click', { detail: 1, bubbles: true }))
  }
  drag(85, 'pointercancel'); drag(45)
  assert.equal(confirms.length, 0)
  drag(85)
  assert.equal(confirms.length, 1)
  assert.equal(key(target, 'ArrowRight').defaultPrevented, false)
  assert.equal(key(target, 'End').defaultPrevented, false)
  assert.equal(confirms.length, 1)
  activate(target, ' ')
  activate(target, 'Enter')
  assert.equal(confirms.length, 3)
})

test('action controls send their named outcomes once per activation', () => {
  for (const [slug, event] of [['paper-plane', 'one-send'], ['flip-coin', 'one-action'], ['jelly-pad', 'one-action'], ['ripple-pad', 'one-action']]) {
    const host = mount('one-' + slug)
    const received = events(host, event)
    activate(host.shadowRoot.querySelector('button'))
    assert.equal(received.length, 1)
    if (slug === 'flip-coin') assert.ok(['Heads','Tails'].includes(received[0].detail.value))
  }
})

for (const slug of ['detent-dial', 'elastic-string', 'scrub-wave']) {
  test(slug + ' reflects native range inputs and keeps range semantics intact', () => {
    const host = mount('one-' + slug, { min: '-10', max: '10', step: '2', value: '-2' })
    const slider = host.shadowRoot.querySelector('input')
    const changes = events(host, 'one-change')
    assert.deepEqual([slider.type, slider.min, slider.max, slider.step], ['range', '-10', '10', '2'])
    // Native ArrowRight updates the range value, then dispatches input.
    slider.value = '0'
    slider.dispatchEvent(new window.Event('input', { bubbles: true }))
    assert.equal(host.value, '0')
    assert.equal(changes[0].detail.value, 0)
  })
}

test('odometer announces final integers once and supports arrow and step controls', () => {
  const host = mount('one-odometer', { value: '99' })
  const root = host.shadowRoot, status = root.querySelector('[role=status]')
  const [down, up] = root.querySelectorAll('button')
  key(up, 'ArrowUp')
  assert.equal(host.value, '100')
  assert.equal(root.querySelectorAll('.one-digit-reel').length, 3)
  assert.equal(status.textContent, 'Odometer 100')
  activate(down)
  assert.equal(host.value, '99')
})

test('checklist keeps independent checked values and reports which checkbox changed', () => {
  const host = mount('one-checklist', { options: 'Read,Review,Send' })
  const inputs = host.shadowRoot.querySelectorAll('input')
  const changes = events(host, 'one-change')
  activate(inputs[1], ' '); activate(inputs[2], ' ')
  assert.equal(host.value, 'Review,Send')
  assert.deepEqual(changes[0].detail, { name: 'checklist', value: 'Review', index: 1, checked: true })
})

test('an indeterminate download completes at maximum for its event, progressbar and ring', () => {
  const host = mount('one-download-ring', { max: '100' })
  const meter = host.shadowRoot.querySelector('[role=progressbar]')
  const completed = events(host, 'one-complete')
  assert.ok(meter.hasAttribute('data-indeterminate'))
  host.setAttribute('data-one-state', 'completed')
  host.setAttribute('label', 'Downloaded')
  assert.deepEqual(completed.map(event => event.detail.value), [100])
  assert.equal(meter.getAttribute('aria-valuenow'), '100')
  assert.equal(meter.hasAttribute('data-indeterminate'), false)
  assert.equal(meter.closest('.one-widget').style.getPropertyValue('--one-position'), '1')
})

for (const entry of ONE_MOMENTS.filter(item => item.semanticRole === 'progressbar')) {
  test(entry.tagName + ' stops pending feedback and reports a completion transition exactly once', () => {
    const host = mount(entry.tagName, { max: '10' })
    const meter = host.shadowRoot.querySelector('[role=progressbar]')
    const completes = events(host, 'one-complete')
    assert.equal(meter.hasAttribute('aria-valuenow'), false)
    assert.equal(meter.hasAttribute('data-indeterminate'), true)
    host.setAttribute('data-one-state', 'cancelled')
    assert.equal(meter.hasAttribute('data-indeterminate'), false)
    host.removeAttribute('data-one-state')
    host.value = '8'; host.value = '10'; host.setAttribute('label', 'Done')
    assert.equal(meter.getAttribute('aria-valuenow'), '10')
    assert.equal(completes.length, 1)
    assert.equal(meter.hasAttribute('data-indeterminate'), false)
  })
}

test('an in-flight spring retargets and snaps immediately when an ancestor requests reduced motion', async ({ mock }) => {
  let frame, now = 0
  mock.method(window.performance, 'now', () => now)
  mock.method(window, 'requestAnimationFrame', next => { frame = next; return 1 })
  mock.method(window, 'cancelAnimationFrame', () => { frame = undefined })
  const parent = document.createElement('div')
  parent.dataset.oneMotion = 'tactile'
  document.body.append(parent)
  const host = document.createElement('one-bloom-toggle')
  parent.append(host)
  const surface = host.shadowRoot.querySelector('.one-widget')
  const button = surface.querySelector('button')
  const position = () => Number(surface.style.getPropertyValue('--one-position'))
  activate(button)
  assert.equal(position(), 0)
  frame(now += 35)
  assert.ok(position() > 0 && position() < 1)
  const live = position()
  activate(button)
  assert.equal(position(), live)
  parent.dataset.oneMotion = 'reduced'
  await window.happyDOM.whenAsyncComplete()
  assert.equal(surface.dataset.oneMotion, 'reduced')
  assert.equal(frame, undefined)
  assert.equal(position(), 0)
  activate(button)
  assert.equal(position(), 1)
})

test('a live system reduced-motion preference overrides an explicit tactile profile', () => {
  const query = window.matchMedia
  const media = new window.EventTarget()
  media.matches = false
  window.matchMedia = () => media
  try {
    const host = mount('one-bookmark', { 'data-one-motion': 'tactile' })
    const surface = host.shadowRoot.querySelector('.one-widget')
    activate(surface.querySelector('button'))
    assert.equal(surface.style.getPropertyValue('--one-position'), '0')
    media.matches = true
    media.dispatchEvent(new window.Event('change'))
    assert.equal(surface.dataset.oneMotion, 'reduced')
    assert.equal(surface.style.getPropertyValue('--one-position'), '1')
    activate(surface.querySelector('button'))
    assert.equal(surface.style.getPropertyValue('--one-position'), '0')
  } finally { window.matchMedia = query }
})

test('dialog native dismissal reconciles open state and retains draft content', () => {
  const host = mount('one-dialog')
  const draft = document.createElement('textarea')
  draft.value = 'Unfinished notes'
  host.append(draft)
  const dialog = host.shadowRoot.querySelector('dialog')
  const trigger = host.shadowRoot.querySelector('button')
  trigger.focus(); activate(trigger)
  dialog.close()
  dialog.dispatchEvent(new window.Event('close'))
  assert.equal(host.open, false)
  assert.equal(host.shadowRoot.activeElement, trigger)
  assert.equal(host.firstChild, draft)
  assert.equal(draft.value, 'Unfinished notes')
})

test('core switch shares the same checked state through properties, attributes and native activation', () => {
  const host = mount('one-switch')
  const node = host.shadowRoot.querySelector('[role=switch]')
  host.checked = true
  assert.equal(node.getAttribute('aria-checked'), 'true')
  activate(node, ' ')
  assert.equal(host.checked, false)
  host.disabled = true
  activate(node)
  assert.equal(host.checked, false)
})

test('choice group honors roles attribute and updates when roles change', () => {
  const host = mount('one-choice-group', { options: 'Delete,Cancel', roles: 'destructive,neutral' })
  const roles = () => [...host.shadowRoot.querySelectorAll('button')].map(el => el.dataset.oneRole)
  assert.deepEqual(roles(), ['destructive', 'neutral'])
  host.setAttribute('roles', 'accept,decline')
  assert.deepEqual(roles(), ['accept', 'decline'])
})
