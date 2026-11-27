import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement as h } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { JSDOM } from 'jsdom'
import { ONE_CONTROLS, ONE_MOMENTS } from '@one-ui/core'
import * as ui from '@one-ui/react'

const options = [{ value: 'one', label: 'First', panel: 'Panel one', variant: 'accept' },
  { value: 'two', label: 'Second', panel: 'Panel two', variant: 'neutral' }]
const symbol = spec => 'One' + spec.name.replaceAll(' ', '')
const render = element => JSDOM.fragment(renderToStaticMarkup(element))

test('exports exactly the catalog controls, named moments, registry, provider and hooks', () => {
  const expected = [...ONE_CONTROLS, ...ONE_MOMENTS].map(symbol)
  assert.equal(ONE_CONTROLS.length, 8)
  assert.equal(ONE_MOMENTS.length, 36)
  assert.deepEqual(Object.keys(ui).sort(), [...expected, 'ONE_REACT_MOMENTS', 'OneMoment', 'OneProvider', 'useOneTheme', 'useOneSpring', 'useReducedMotion'].sort())
  assert.deepEqual(Object.keys(ui.ONE_REACT_MOMENTS), ONE_MOMENTS.map(entry => entry.slug))
  for (const entry of ONE_MOMENTS) assert.equal(ui[symbol(entry)], ui.ONE_REACT_MOMENTS[entry.slug])
})

const selectors = { button: 'button', switch: '[role=switch]', radiogroup: '[role=radiogroup]',
  tablist: '[role=tablist]', progressbar: '[role=progressbar]', status: '[role=status]',
  slider: 'input[type=range]', searchbox: 'input[type=search]', group: 'fieldset',
  textbox: 'input', dialog: 'dialog', text: 'span' }
for (const spec of ONE_MOMENTS) {
  test(spec.name + ' renders identical named and polymorphic markup during SSR', () => {
    const props = { label: 'Example' }
    if (['radiogroup', 'tablist', 'group'].includes(spec.semanticRole) || spec.attributes.includes('open')) props.options = options
    if (spec.slug === 'odometer') props.value = 10
    if (spec.slug === 'merge-drops') props.value = 'Merged'
    const markup = renderToStaticMarkup(h(ui[symbol(spec)], props))
    assert.equal(markup, renderToStaticMarkup(h(ui.OneMoment, { name: spec.slug, ...props })))
    const dom = JSDOM.fragment(markup)
    assert.ok(dom.querySelector('[data-one-moment="' + spec.slug + '"]'))
    const control = dom.querySelector(selectors[spec.semanticRole])
    assert.ok(control)
    if (spec.semanticRole === 'progressbar') {
      assert.equal(control.hasAttribute('aria-valuenow'), false)
      assert.equal(control.getAttribute('aria-label'), 'Example')
      assert.equal(control.tabIndex, -1)
    } else if (spec.semanticRole === 'status') {
      assert.equal(control.getAttribute('aria-atomic'), 'true')
      assert.equal(control.getAttribute('aria-live'), 'polite')
    } else if (spec.semanticRole === 'tablist') {
      const active = control.querySelector('[role=tab][aria-selected=true]')
      const panel = dom.getElementById(active.getAttribute('aria-controls'))
      assert.equal(panel.hidden, false)
      assert.equal(panel.getAttribute('aria-labelledby'), active.id)
    } else if (spec.semanticRole === 'radiogroup') {
      assert.equal(control.querySelectorAll('input:checked').length, 1)
      assert.equal(control.querySelectorAll('input[type=radio]').length, 2)
    } else if (spec.semanticRole === 'switch') assert.equal(control.getAttribute('aria-checked'), 'false')
    else if (spec.attributes.includes('pressed')) assert.equal(control.getAttribute('aria-pressed'), 'false')
    else if (spec.attributes.includes('open')) assert.equal(control.getAttribute('aria-haspopup'), 'menu')
  })
}

for (const spec of ONE_CONTROLS) {
  test(spec.name + ' core control renders its native accessible structure on the server', () => {
    const props = { label: 'Example' }
    if (['tabs', 'choice-group'].includes(spec.slug)) props.options = options
    const dom = render(h(ui[symbol(spec)], props))
    const selector = spec.slug === 'choice-group' || spec.slug === 'popover' ? '[role=group]' : selectors[spec.semanticRole]
    const el = dom.querySelector(selector)
    assert.ok(el)
    if (spec.slug === 'field') assert.equal(dom.querySelector('label').htmlFor, el.id)
    if (spec.slug === 'dialog') assert.equal(dom.getElementById(el.getAttribute('aria-labelledby')).textContent, 'Example')
    if (spec.slug === 'popover') assert.equal(dom.querySelector('button').getAttribute('aria-controls'), el.id)
    if (spec.slug === 'choice-group') assert.deepEqual([...el.children].map(e => [e.type, e.textContent]),
      [['button', 'First'], ['button', 'Second']])
  })
}

test('scoped theme and motion hooks have server snapshots and retain custom colors', () => {
  assert.equal(typeof window, 'undefined')
  function Probe() {
    const { theme, preset, density } = ui.useOneTheme()
    return h('output', null, [theme, preset, density, ui.useReducedMotion(), ui.useOneSpring(12)].join(' '))
  }
  assert.equal(render(h(Probe)).textContent, 'system default comfortable false 12')
  const dom = render(h(ui.OneProvider, { theme: 'dark', motion: 'reduced', preset: 'obsidian-studio',
    density: 'compact', actionBorder: 'bordered', tokens: { overlay: '#010203' } }, h(Probe)))
  assert.equal(dom.textContent, 'dark obsidian-studio compact true 12')
  assert.equal(dom.firstChild.dataset.oneActionBorder, 'bordered')
  assert.equal(dom.firstChild.style.getPropertyValue('--one-color-overlay'), '#010203')
})

test('field combines caller descriptions, persistent label, error and hint IDs', () => {
  const dom = render(h(ui.OneField, { id: 'name', label: 'Name', description: 'Full name', error: 'Enter a name',
    'aria-describedby': 'external', required: true }))
  const input = dom.querySelector('input')
  assert.equal(input.getAttribute('aria-describedby'), 'external name-hint name-error')
  assert.equal(input.getAttribute('aria-invalid'), 'true')
  assert.equal(input.required, true)
  assert.equal(dom.getElementById('name-error').textContent, 'Enter a name')
})

test('all CLI-style moment examples render with just a label, including input groups', () => {
  for (const spec of ONE_MOMENTS) {
    const node = render(h(ui.OneMoment, { name: spec.slug, label: 'Preview' }))
    assert.ok(node.querySelector('[data-one-moment="' + spec.slug + '"]'))
  }
})
