import { ONE_CONTROLS, ONE_MOMENTS, findMoment } from '@one-ui/core'
import type { CatalogEntry } from '@one-ui/core'

const entries: readonly CatalogEntry[] = [...ONE_CONTROLS, ...ONE_MOMENTS]

export function lookup(query: string): CatalogEntry {
  const key = query.trim().toLowerCase()
  const entry = findMoment(key) ?? ONE_CONTROLS.find(e => [e.slug, e.tagName, e.name.toLowerCase()].includes(key))
  if (!entry) throw new Error(`Unknown component "${query}". Run one-ui list to see available components.`)
  return entry
}

export function select(names: string[]) {
  const selected = new Set<CatalogEntry>()
  for (const name of names) {
    const key = name.toLowerCase()
    const group = key === 'all' ? entries : entries.filter(e => e.category === key)
    for (const entry of group.length ? group : [lookup(name)]) selected.add(entry)
  }
  return [...selected]
}

export function list(type: string, category?: string, search = '') {
  const filter = (items: readonly CatalogEntry[]) => items
    .filter(e => (!category || e.category === category.toLowerCase()) &&
      [e.id, e.tagName, e.name, e.category].some(s => s.toLowerCase().includes(search.toLowerCase())))
    .map(({ id, slug, name, category }) => ({ id, slug, name, category }))
  return {
    controls: filter(type === 'moments' ? [] : ONE_CONTROLS),
    moments: filter(type === 'controls' ? [] : ONE_MOMENTS),
  }
}

export const componentName = (entry: CatalogEntry) => 'One' + entry.slug.split('-')
  .map(s => s[0].toUpperCase() + s.slice(1)).join('')

export function htmlElement(entry: CatalogEntry) {
  const label = entry.slug === 'paper-plane' ? 'Send' : entry.slug === 'swipe-confirm' ? 'Confirm' : entry.name
  return `<${entry.tagName} label="${label}"></${entry.tagName}>`
}

const swiftExamples: Record<string, string> = {
  'paper-plane': 'OnePaperPlaneButton("Send") { /* Send the message */ }',
  'swipe-confirm': 'OneSwipeConfirm("Confirm", confirmed: $confirmed) { /* Confirm the request */ }',
  button: 'Button("Continue") { /* Continue */ }.buttonStyle(OneButtonStyle(role: .action))',
  field: 'TextField("Name", text: $name).oneField()',
  dialog: 'Button("Show details") { presented = true }.sheet(isPresented: $presented) { Text("Details") }',
  popover: 'Button("Show options") { presented = true }.popover(isPresented: $presented) { Text("Options") }',
  'choice-group': 'OneChoiceGroup("Decision", options: ["Save", "Cancel"], selection: $selection)',
  badge: 'OneBadge("New")',
  tabs: 'TabView { Text("Overview").tabItem { Label("Overview", systemImage: "house") } }',
  switch: 'Toggle("Notifications", isOn: $enabled)',
}
const state: Record<string, string> = {
  'choice-group': '@State private var selection = 0',
  'swipe-confirm': '@State private var confirmed = false',
  field: '@State private var name = ""',
  dialog: '@State private var presented = false',
  popover: '@State private var presented = false',
  switch: '@State private var enabled = false',
}

const reactProps: Record<string, string> = {
  'choice-group': 'label="Decision" options={[{ value: "save", label: "Save", variant: "accept" }, { value: "cancel", label: "Cancel", variant: "neutral" }]}',
  tabs: 'label="Sections" options={[{ value: "overview", label: "Overview", panel: "Overview" }, { value: "activity", label: "Activity", panel: "Activity" }]}',
  'merge-drops': 'label="Sync" value="Merged"',
  odometer: 'label="Completed" value={42}',
  'paper-plane': 'label="Send"',
  'swipe-confirm': 'label="Confirm"',
  dialog: 'label="Details" trigger="Show details"',
}

function reactAttributes(entry: CatalogEntry) {
  if (reactProps[entry.slug]) return reactProps[entry.slug]
  let props = `label="${entry.name}"`
  if (entry.semanticRole === 'tablist') return reactProps.tabs
  if (entry.semanticRole === 'radiogroup' || ['checklist', 'menu-morph', 'radial-menu'].includes(entry.slug)) {
    props += ' options={[{ value: "first", label: "First" }, { value: "second", label: "Second" }]}'
  }
  return props
}

export function inspect(entry: CatalogEntry) {
  const symbol = componentName(entry)
  const suffix = symbol.slice(3)
  const swiftID = suffix[0].toLowerCase() + suffix.slice(1)
  const view = swiftExamples[entry.slug] ?? `OneMomentView(id: .${swiftID})`
  return {
    ...entry,
    snippets: {
      html: `<!-- With the local files from one-ui add ${entry.slug} -->\n<link rel="stylesheet" href="../../styles/one-ui.css">\n<script type="module" src="./one-ui-web.bundle.js"></script>\n${htmlElement(entry)}`,
      react: `import '@one-ui/react/styles.css'\nimport { ${symbol} } from '@one-ui/react'\n\nexport default function Example() {\n  return <${symbol} ${reactAttributes(entry)} />\n}`,
      swift: `import SwiftUI\nimport OneUI\n\nstruct Example: View {\n${state[entry.slug] ? '    ' + state[entry.slug] + '\n' : ''}    var body: some View {\n        ${view}\n    }\n}`,
    },
  }
}
