import type { SpringPreset } from './spring.ts'

export type ComponentCategory = 'action' | 'selection' | 'navigation' | 'input' | 'feedback' | 'disclosure' | 'layout'
export interface CatalogEntry<S extends string = string> {
  readonly id: string
  readonly slug: S
  readonly tagName: `one-${S}`
  readonly name: string
  readonly category: ComponentCategory
  readonly springPreset: SpringPreset
  readonly semanticRole: string
  readonly ariaPattern: string
  readonly reducedMotionBehavior: string
  readonly attributes: readonly string[]
  readonly events: readonly string[]
  readonly webEvents: readonly string[]
}

interface Pattern {
  semanticRole: string
  ariaPattern: string
  attributes: readonly string[]
  events: readonly string[]
  webEvents: readonly string[]
}
const patterns = {
  button: {
    semanticRole: 'button', ariaPattern: 'Named native button. Activate with Enter or Space.',
    attributes: ['label', 'disabled'], events: ['click'],
    webEvents: ['one-action'],
  },
  toggle: {
    semanticRole: 'switch', ariaPattern: 'Named switch with aria-checked. Toggle with Space.',
    attributes: ['label', 'checked', 'disabled'], events: ['change'],
    webEvents: ['one-toggle', 'one-change'],
  },
  pressed: {
    semanticRole: 'button', ariaPattern: 'Named toggle button with aria-pressed and a stable label.',
    attributes: ['label', 'pressed', 'disabled'], events: ['change'],
    webEvents: ['one-toggle', 'one-change'],
  },
  slider: {
    semanticRole: 'slider', ariaPattern: 'Named range with min, max and current value. Arrow keys step and Home/End select endpoints.',
    attributes: ['label', 'min', 'max', 'step', 'value', 'disabled'], events: ['input', 'change'],
    webEvents: ['one-change'],
  },
  actions: {
    semanticRole: 'group', ariaPattern: 'Label the decision group and each native action button. Preserve normal button navigation and activation.',
    attributes: ['label', 'options', 'disabled'], events: ['click'],
    webEvents: ['one-action'],
  },
  choice: {
    semanticRole: 'radiogroup', ariaPattern: 'Named radio group with one checked option and arrow-key selection.',
    attributes: ['label', 'value', 'disabled'], events: ['change'],
    webEvents: ['one-select', 'one-change'],
  },
  tabs: {
    semanticRole: 'tablist', ariaPattern: 'Roving tabs with aria-selected, arrow keys and associated tabpanels.',
    attributes: ['label', 'value', 'orientation'], events: ['change'],
    webEvents: ['one-select', 'one-change'],
  },
  progress: {
    semanticRole: 'progressbar', ariaPattern: 'Named progress indicator with min, max and current value. Omit the value for indeterminate progress.',
    attributes: ['label', 'value', 'max'], events: [],
    webEvents: ['one-complete'],
  },
  status: {
    semanticRole: 'status', ariaPattern: 'Expose the final text in a polite atomic status region. Hide intermediate animation frames.',
    attributes: ['label', 'value'], events: [],
    webEvents: [],
  },
  menu: {
    semanticRole: 'button', ariaPattern: 'Menu button with aria-haspopup and aria-expanded. Arrow keys navigate menuitems and Escape restores focus.',
    attributes: ['label', 'open', 'disabled'], events: ['toggle', 'change'],
    webEvents: ['one-toggle', 'one-select', 'one-action'],
  },
  search: {
    semanticRole: 'searchbox', ariaPattern: 'Named native search input. Preserve typing, selection and keyboard submission.',
    attributes: ['label', 'value', 'placeholder', 'disabled'], events: ['input', 'change'],
    webEvents: ['one-change', 'one-action'],
  },
  checks: {
    semanticRole: 'group', ariaPattern: 'Named group of labelled native checkboxes. Space toggles the focused item.',
    attributes: ['label', 'disabled'], events: ['change'],
    webEvents: ['one-change'],
  },
  field: {
    semanticRole: 'textbox', ariaPattern: 'Native input with a persistent label and associated description or error.',
    attributes: ['label', 'value', 'name', 'disabled', 'required'], events: ['input', 'change'],
    webEvents: ['one-change'],
  },
  dialog: {
    semanticRole: 'dialog', ariaPattern: 'Named modal with initial focus, contained tab navigation, Escape dismissal and opener focus restoration.',
    attributes: ['label', 'open'], events: ['cancel', 'close'],
    webEvents: ['one-toggle'],
  },
  popover: {
    semanticRole: 'group', ariaPattern: 'Named disclosure with an associated invoker, expanded state, light dismissal and focus restoration.',
    attributes: ['label', 'open'], events: ['beforetoggle', 'toggle'],
    webEvents: ['one-toggle'],
  },
  badge: {
    semanticRole: 'text', ariaPattern: 'Expose badge text in the accessible name or description of the associated item.',
    attributes: ['label', 'variant'], events: [],
    webEvents: [],
  },
} as const satisfies Record<string, Pattern>

type Spec<S extends string = string> = readonly [slug: S, name: string, category: ComponentCategory, spring: SpringPreset,
  pattern: keyof typeof patterns, reducedMotion: string]

const moments = [
  ['bars-fade', 'Bars Fade', 'feedback', 'gentle', 'progress', 'Show a static progress indicator and its accessible label.'],
  ['bloom-toggle', 'Bloom Toggle', 'selection', 'tactile', 'toggle', 'Swap the checked marker instantly.'],
  ['snap-grid', 'Snap Grid', 'layout', 'detent', 'choice', 'Place the selection on its final grid cell.'],
  ['card-fan', 'Card Fan', 'selection', 'gentle', 'choice', 'Keep cards stationary and mark the selected card.'],
  ['gooey-tab-bar', 'Gooey Tab Bar', 'navigation', 'elastic', 'tabs', 'Move the active tab marker immediately.'],
  ['blocks-scale', 'Blocks Scale', 'feedback', 'snappy', 'progress', 'Show the current block count without scaling.'],
  ['stretch-toggle', 'Stretch Toggle', 'selection', 'elastic', 'toggle', 'Set the final thumb position on change.'],
  ['merge-drops', 'Merge Drops', 'feedback', 'elastic', 'status', 'Present the merged state and its text immediately.'],
  ['paper-plane', 'Paper Plane', 'action', 'snappy', 'button', 'Show the send result without flight.'],
  ['detent-dial', 'Detent Dial', 'input', 'detent', 'slider', 'Set the indicated detent directly.'],
  ['domino-row', 'Domino Row', 'feedback', 'tactile', 'progress', 'Set all completed segments at once.'],
  ['pebble-rating', 'Pebble Rating', 'input', 'tactile', 'choice', 'Mark the selected rating immediately.'],
  ['jelly-pad', 'Jelly Pad', 'action', 'elastic', 'button', 'Use a static pressed state.'],
  ['swipe-confirm', 'Swipe Confirm', 'action', 'detent', 'button', 'Commit immediately on activation and display confirmation.'],
  ['bookmark', 'Bookmark', 'selection', 'snappy', 'pressed', 'Swap the saved marker immediately.'],
  ['depth-stack', 'Depth Stack', 'layout', 'gentle', 'choice', 'Show the selected item without depth travel.'],
  ['menu-morph', 'Menu Morph', 'disclosure', 'snappy', 'menu', 'Switch the icon and menu visibility instantly.'],
  ['elastic-string', 'Elastic String', 'input', 'elastic', 'slider', 'Update the value with a stationary track.'],
  ['ripple-pad', 'Ripple Pad', 'action', 'tactile', 'button', 'Indicate activation without an expanding ripple.'],
  ['worm-dots', 'Worm Dots', 'navigation', 'elastic', 'tabs', 'Mark the current page without stretching.'],
  ['download-ring', 'Download Ring', 'feedback', 'gentle', 'progress', 'Update the ring to the current value immediately.'],
  ['leaf-tabs', 'Leaf Tabs', 'navigation', 'tactile', 'tabs', 'Show the chosen tab and panel immediately.'],
  ['bell-toggle', 'Bell Toggle', 'selection', 'tactile', 'toggle', 'Use a stationary notification-state icon.'],
  ['ink-switch', 'Ink Switch', 'selection', 'gentle', 'toggle', 'Show the checked state without spreading ink.'],
  ['rocker-switch', 'Rocker Switch', 'selection', 'detent', 'toggle', 'Set the labelled switch state immediately.'],
  ['scrub-wave', 'Scrub Wave', 'input', 'detent', 'slider', 'Update the playhead and time directly.'],
  ['squash-play', 'Squash Play', 'action', 'tactile', 'pressed', 'Switch playback state without scaling.'],
  ['rubber-search', 'Rubber Search', 'input', 'elastic', 'search', 'Keep the search field fixed while editing.'],
  ['odometer', 'Odometer', 'feedback', 'snappy', 'status', 'Display and expose the final number once.'],
  ['tide-progress', 'Tide Progress', 'feedback', 'gentle', 'progress', 'Show the current fill level without waves.'],
  ['eclipse-half', 'Eclipse Half', 'selection', 'gentle', 'toggle', 'Show the chosen appearance immediately.'],
  ['magnet-grid', 'Magnet Grid', 'selection', 'tactile', 'choice', 'Keep items fixed and show the current selection.'],
  ['checklist', 'Checklist', 'selection', 'snappy', 'checks', 'Set checkbox markers immediately.'],
  ['flip-coin', 'Flip Coin', 'action', 'elastic', 'button', 'Expose the chosen face immediately.'],
  ['radial-menu', 'Radial Menu', 'disclosure', 'snappy', 'menu', 'Show all menu items in their final positions.'],
  ['dot-revolve', 'Dot Revolve', 'feedback', 'gentle', 'progress', 'Use a stationary indicator while the operation is pending.'],
] as const satisfies readonly Spec[]

const controls = [
  ['button', 'Button', 'action', 'snappy', 'button', 'Activate without travel.'],
  ['field', 'Field', 'input', 'gentle', 'field', 'Show the value, validation and focus state directly.'],
  ['dialog', 'Dialog', 'disclosure', 'gentle', 'dialog', 'Open and close instantly with normal focus management.'],
  ['popover', 'Popover', 'disclosure', 'snappy', 'popover', 'Show or hide the content immediately.'],
  ['choice-group', 'Choice Group', 'action', 'tactile', 'actions', 'Present the result of the chosen action immediately.'],
  ['badge', 'Badge', 'feedback', 'gentle', 'badge', 'Show the final label directly.'],
  ['tabs', 'Tabs', 'navigation', 'snappy', 'tabs', 'Replace the active panel and marker immediately.'],
  ['switch', 'Switch', 'selection', 'tactile', 'toggle', 'Set the thumb and checked state immediately.'],
] as const satisfies readonly Spec[]

export type MomentSlug = (typeof moments)[number][0]
export type ControlSlug = (typeof controls)[number][0]

const customWebEvents: Partial<Record<MomentSlug, readonly string[]>> = {
  'paper-plane': ['one-send', 'one-action'],
  'swipe-confirm': ['one-confirm', 'one-action'],
  odometer: ['one-change'],
}

function catalogEntry<S extends string>(spec: Spec<S>, id: string): CatalogEntry<S> {
  const [slug, name, category, springPreset, pattern, reducedMotionBehavior] = spec
  const webEvents = customWebEvents[slug as MomentSlug] ?? patterns[pattern].webEvents
  return Object.freeze({ id, slug, tagName: `one-${slug}`, name, category, springPreset, ...patterns[pattern], webEvents, reducedMotionBehavior } as const)
}

export const ONE_MOMENTS: readonly CatalogEntry<MomentSlug>[] = Object.freeze(
  moments.map((spec, index) => catalogEntry(spec, String(index + 1).padStart(2, '0'))),
)
export const ONE_CONTROLS: readonly CatalogEntry<ControlSlug>[] = Object.freeze(
  controls.map(spec => catalogEntry(spec, spec[0])),
)

const byQuery = new Map<string, (typeof ONE_MOMENTS)[number]>()
for (const item of ONE_MOMENTS) {
  for (const key of [item.id, String(Number(item.id)), item.slug, item.name.toLowerCase(), item.tagName]) byQuery.set(key, item)
}

/** Look up a moment by ID, slug, tag name or case-insensitive display name. */
export function findMoment(query: string | number) {
  return byQuery.get(String(query).trim().toLowerCase())
}
