// SPDX-License-Identifier: AGPL-3.0-only
import { ONE_TAG_MAP } from '../packages/web/dist/one-ui-web.bundle.js'
import { contrastRatio } from '../packages/core/dist/contrast.js'
import { computeSettleDurationMs, evaluateSpring, SPRING_PRESETS } from '../packages/core/dist/spring.js'

const byId = id => document.getElementById(id)
const moments = Object.values(ONE_TAG_MAP)
  .map(component => component.entry)
  .filter(entry => entry && /^\d{2}$/.test(entry.id))
  .sort((a, b) => Number(a.id) - Number(b.id))

const settleTimes = Object.fromEntries(Object.entries(SPRING_PRESETS)
  .map(([name, spring]) => [name, computeSettleDurationMs(spring)]))
const chartDuration = Math.ceil(Math.max(...Object.values(settleTimes)) / 100) * 100
const springPreset = byId('study-preset')
byId('chart-duration').textContent = chartDuration + ' ms'

function drawSpring() {
  const spring = SPRING_PRESETS[springPreset.value]
  const sample = ms => evaluateSpring(ms / 1000, spring).position
  const points = Array.from({ length: 121 }, (_, i) => {
    const fraction = i / 120
    return [1 + fraction * 318, 115 - sample(fraction * chartDuration) * 80].join(',')
  })
  const damping = spring.damping / (2 * spring.mass)
  const dampedFrequency = Math.sqrt(Math.max(0, spring.stiffness / spring.mass - damping ** 2))
  // The first positive maximum is the largest overshoot for a unit step from rest.
  const overshoot = dampedFrequency > 0 ? Math.exp(-Math.PI * damping / dampedFrequency) : 0
  byId('curve').setAttribute('points', points.join(' '))
  byId('settle').textContent = Math.round(settleTimes[springPreset.value]) + ' ms'
  byId('overshoot').textContent = (overshoot * 100).toFixed(1) + '%'

  const times = Array.from({ length: 5 }, (_, i) => i * chartDuration / 4)
  byId('chart-data').replaceChildren(...times.map(time => {
    const row = document.createElement('tr')
    for (const value of [time, (sample(time) * 100).toFixed(1)]) {
      const cell = row.insertCell()
      cell.toggleAttribute('data-one-numeric', true)
      cell.textContent = value
    }
    return row
  }))
}
drawSpring()
springPreset.addEventListener('change', drawSpring)

// Group by what visitors can try. Catalog categories also describe component use.
function category(entry) {
  if (entry.semanticRole === 'progressbar') return 'Progress'
  if (entry.semanticRole === 'switch' || entry.attributes.includes('pressed')) return 'Toggles'
  if (entry.category === 'disclosure' || entry.category === 'navigation') return 'Navigation'
  if (entry.category === 'action') return 'Actions'
  if (entry.category === 'feedback') return 'Feedback'
  return 'Controls'
}

const labels = {
  'bars-fade': 'Loading', 'bloom-toggle': 'Bloom', 'blocks-scale': 'Buffer',
  'stretch-toggle': 'Enable', 'merge-drops': 'Separated', 'paper-plane': 'Send',
  'detent-dial': 'Level', 'domino-row': 'Queue', 'jelly-pad': 'Press',
  'swipe-confirm': 'Confirm', bookmark: 'Save', 'menu-morph': 'Menu',
  'elastic-string': 'Tension', 'ripple-pad': 'Tap', 'download-ring': 'Download',
  'bell-toggle': 'Alerts', 'ink-switch': 'Ink', 'rocker-switch': 'Power',
  'scrub-wave': 'Position', 'squash-play': 'Play', 'rubber-search': 'Search',
  odometer: 'Count', 'tide-progress': 'Transfer', 'eclipse-half': 'Night',
  'flip-coin': 'Flip', 'radial-menu': 'Tools', 'dot-revolve': 'Sync',
}

function makeDemo(entry) {
  const host = document.createElement(entry.tagName)
  host.setAttribute('label', labels[entry.slug] ?? entry.name)
  if (entry.semanticRole === 'slider') host.setAttribute('value', '40')
  if (entry.slug === 'odometer') host.setAttribute('value', '99')
  if (entry.slug === 'checklist') host.setAttribute('options', 'Edit,Review,Ship')
  if (entry.semanticRole === 'progressbar') host.setAttribute('value', entry.slug === 'dot-revolve' ? '0' : '40')
  return host
}

function addDriver(stage, entry, host) {
  if (entry.slug === 'dot-revolve' || entry.slug === 'merge-drops') {
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'one-btn'
    button.dataset.oneRole = 'neutral'
    const merging = entry.slug === 'merge-drops'
    if (merging) {
      button.textContent = 'Merge'
      button.addEventListener('click', () => {
        const active = host.hasAttribute('value')
        if (active) host.removeAttribute('value')
        else host.setAttribute('value', 'Merged')
        button.textContent = active ? 'Merge' : 'Separate'
      })
    } else {
      button.textContent = 'Start sync'
      button.addEventListener('click', () => {
        const running = !host.hasAttribute('value')
        if (running) host.setAttribute('value', '100')
        else host.removeAttribute('value')
        button.textContent = running ? 'Start sync' : 'Complete sync'
      })
    }
    stage.append(button)
  } else if (entry.semanticRole === 'progressbar') {
    const label = document.createElement('label')
    label.textContent = 'Progress'
    const slider = document.createElement('input')
    slider.type = 'range'
    slider.value = host.value
    slider.setAttribute('aria-label', entry.name + ' progress')
    slider.addEventListener('input', () => { host.value = slider.value })
    label.append(slider)
    stage.append(label)
  }
}

const grid = byId('moment-grid')
const search = byId('search')
const categoryFilter = byId('category-filter')
for (const name of Array.from(new Set(moments.map(category))).sort()) {
  categoryFilter.add(new Option(name, name))
}
for (const entry of moments) {
  const tile = byId('tile-template').content.firstElementChild.cloneNode(true)
  const host = makeDemo(entry)
  const stage = tile.querySelector('.stage')
  tile.dataset.category = category(entry)
  tile.dataset.search = [entry.id, entry.name, entry.slug, entry.springPreset, tile.dataset.category].join(' ').toLowerCase()
  tile.querySelector('h3').textContent = entry.name
  tile.querySelector('.caption').textContent = entry.springPreset[0].toUpperCase() + entry.springPreset.slice(1) + ' spring'
  stage.append(host)
  addDriver(stage, entry, host)
  const code = tile.querySelector('.code-button')
  code.setAttribute('aria-label', 'View code for ' + entry.name)
  code.addEventListener('click', () => openInspector(entry, code))
  grid.append(tile)
}

function filterGrid() {
  const query = search.value.trim().toLowerCase().split(/\s+/)
  let count = 0
  for (const tile of grid.children) {
    const included = !categoryFilter.value || categoryFilter.value === tile.dataset.category
    tile.hidden = !(included && query.every(term => tile.dataset.search.includes(term)))
    if (!tile.hidden) count++
  }
  const resultCount = byId('result-count')
  const result = count + ' of ' + moments.length + ' moments'
  if (resultCount.textContent !== result) resultCount.textContent = result
  byId('empty').hidden = count > 0
  grid.hidden = count === 0
}
categoryFilter.addEventListener('change', filterGrid)
search.addEventListener('input', filterGrid)
byId('reset-filters').addEventListener('click', () => {
  search.value = ''
  categoryFilter.value = ''
  filterGrid()
  search.focus()
})
filterGrid()

const draftTitle = byId('draft-name')
const draftEditor = byId('draft-editor')
const draftEmpty = byId('draft-empty')
const deleteDialog = byId('delete-confirmation')
let savedTitle = draftTitle.value
function draftStatus(status, activity, announce = true) {
  byId('draft-status').setAttribute('label', status)
  byId('draft-activity').textContent = activity
  byId('draft-outcome').textContent = announce ? activity : ''
}
function updatePreview() {
  byId('draft-preview').textContent = byId('draft-switch').checked
    ? draftTitle.value || 'Untitled draft'
    : 'Preview title hidden.'
}
function showDraft(exists) {
  draftEditor.hidden = !exists
  draftEmpty.hidden = exists
  const next = exists ? draftTitle : byId('draft-create')
  next.focus()
}
function invitationStatus(result) {
  byId('invitation-actions').hidden = Boolean(result)
  byId('invitation-reset').hidden = !result
  byId('invitation-outcome').textContent = result
  const next = result ? byId('invitation-reset') : byId('invitation-accept')
  next.focus()
}
byId('controls').addEventListener('one-action', event => {
  switch (event.detail.value) {
    case 'created':
      savedTitle = draftTitle.value = ''
      draftStatus('New draft', 'Draft created.')
      showDraft(true)
      break
    case 'saved':
      if (!draftTitle.value.trim()) {
        draftTitle.setAttribute('error', 'Enter a title to save the draft.')
        draftTitle.focus()
        return
      }
      savedTitle = draftTitle.value
      draftStatus('Saved', 'Changes saved.')
      break
    case 'discarded':
      draftTitle.removeAttribute('error')
      draftTitle.value = savedTitle
      draftStatus(savedTitle ? 'Saved' : 'New draft', 'Changes discarded.')
      break
    case 'confirm-delete':
      deleteDialog.returnValue = ''
      deleteDialog.showModal()
      break
    case 'accepted':
      invitationStatus('Invitation accepted.')
      break
    case 'declined':
      invitationStatus('Invitation declined.')
      break
  }
  updatePreview()
})
deleteDialog.addEventListener('close', () => {
  if (deleteDialog.returnValue !== 'delete') {
    byId('draft-delete').focus()
    return
  }
  savedTitle = draftTitle.value = ''
  draftTitle.removeAttribute('error')
  draftStatus('Deleted', 'Draft deleted.')
  updatePreview()
  showDraft(false)
})
byId('invitation-reset').addEventListener('click', () => invitationStatus(''))
draftTitle.addEventListener('one-change', () => {
  draftTitle.removeAttribute('error')
  draftStatus(draftTitle.value === savedTitle && savedTitle ? 'Saved' : 'Editing', 'Draft title edited.', false)
  updatePreview()
})
byId('draft-switch').addEventListener('one-change', updatePreview)
for (const name of ['one-action', 'one-change', 'one-select', 'one-send', 'one-confirm', 'one-complete', 'one-toggle']) {
  grid.addEventListener(name, event => {
    const { name: component, value } = event.detail
    byId('event').textContent = event.type + ' · ' + component + ' · ' + JSON.stringify(value)
  })
}

const inspector = byId('inspector')
const format = byId('format')
const snippet = byId('snippet')
const copyStatus = byId('copy-status')
let inspection
let revision = 0
const setup = {
  html: 'Place the One UI web bundle alongside the HTML file.',
  react: 'Use the @one-ui/react package in a React project.',
  swift: 'Add the OneUI Swift package to the target.',
}

function snippets(entry) {
  const html = makeDemo(entry)
  const component = 'One' + entry.name.replaceAll(' ', '')
  const swiftCase = entry.slug.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
  const props = ['label=' + JSON.stringify(html.getAttribute('label'))]
  if (html.hasAttribute('value')) {
    const prop = entry.semanticRole === 'slider' ? 'defaultValue' : 'value'
    props.push(prop + '={' + Number(html.value) + '}')
  }
  if (html.hasAttribute('options')) {
    const options = html.getAttribute('options').split(',').map(label => ({ value: label, label }))
    props.push('options={' + JSON.stringify(options) + '}')
  }
  return {
    html: '<script type="module" src="./one-ui-web.bundle.js"></script>\n\n' + html.outerHTML,
    react: `import { ${component} } from '@one-ui/react'\nimport '@one-ui/react/styles.css'\n\nexport default function Example() {\n  return <${component} ${props.join(' ')} />\n}`,
    swift: `import SwiftUI\nimport OneUI\n\nstruct Example: View {\n    var body: some View {\n        OneMomentView(id: .${swiftCase})\n    }\n}`,
  }
}
function showSnippet() {
  revision++
  snippet.textContent = inspection.code[format.value]
  byId('snippet-setup').textContent = setup[format.value]
  copyStatus.textContent = ''
}
function openInspector(entry, opener) {
  inspection = { opener, code: snippets(entry) }
  byId('snippet-title').textContent = entry.name
  byId('snippet-pattern').textContent = entry.ariaPattern
  showSnippet()
  inspector.showModal()
}
format.addEventListener('change', showSnippet)
inspector.addEventListener('close', () => {
  revision++
  inspection.opener.focus()
})
byId('copy').addEventListener('click', async () => {
  const request = ++revision
  try {
    await navigator.clipboard.writeText(snippet.textContent)
    if (inspector.open && revision === request) copyStatus.textContent = 'Code copied.'
  } catch {
    if (!inspector.open || revision !== request) return
    snippet.parentElement.focus()
    const range = document.createRange()
    range.selectNodeContents(snippet)
    const selection = document.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
    copyStatus.textContent = 'Code selected. Use your device’s Copy command.'
  }
})

const sample = byId('color-sample')
const foreground = byId('foreground-color')
const background = byId('background-color')
const testPair = byId('test-pair')
const pairs = {
  'action-label': ['on-action', 'action'],
  'action-canvas': ['action', 'canvas'],
  'body-canvas': ['text-primary', 'canvas'],
}
const custom = new Set()
function updateContrast() {
  sample.style.color = foreground.value
  sample.style.backgroundColor = background.value
  byId('foreground-hex').textContent = foreground.value.toUpperCase()
  byId('background-hex').textContent = background.value.toUpperCase()
  const ratio = contrastRatio(foreground.value, background.value)
  byId('ratio').textContent = (Math.floor(ratio * 1000) / 1000).toFixed(3) + ':1'
  byId('text-result').textContent = 'Normal text · ' + (ratio >= 4.5 ? 'Pass' : 'Fail') + ' (4.5:1)'
  byId('ui-result').textContent = 'Essential UI · ' + (ratio >= 3 ? 'Pass' : 'Fail') + ' (3:1)'
}
const colorContext = document.createElement('canvas').getContext('2d')
function presetColors() {
  // Applying the token first resolves light-dark() in the active scheme.
  const [textToken, surfaceToken] = pairs[testPair.value]
  if (!custom.has(foreground)) {
    sample.style.color = 'var(--one-color-' + textToken + ')'
    colorContext.fillStyle = getComputedStyle(sample).color
    foreground.value = colorContext.fillStyle
  }
  if (!custom.has(background)) {
    sample.style.backgroundColor = 'var(--one-color-' + surfaceToken + ')'
    colorContext.fillStyle = getComputedStyle(sample).backgroundColor
    background.value = colorContext.fillStyle
  }
  updateContrast()
}
function restoreColors() {
  custom.clear()
  presetColors()
}
for (const input of [foreground, background]) {
  input.addEventListener('input', () => {
    custom.add(input)
    updateContrast()
  })
}
byId('theme-colors').addEventListener('click', restoreColors)
testPair.addEventListener('change', restoreColors)
byId('preferences').addEventListener('change', event => {
  const { name, value } = event.target
  document.documentElement.setAttribute('data-one-' + name, value)
  if (name === 'theme' || name === 'preset') presetColors()
})
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', presetColors)
presetColors()
