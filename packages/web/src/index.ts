/*! SPDX-License-Identifier: AGPL-3.0-only */
import { findMoment, ONE_CONTROLS, ONE_MOMENTS } from '@one-ui/core'
import type { CatalogEntry, ControlSlug, MomentSlug } from '@one-ui/core'
import { action, range } from './actions.js'
import { badge, choices, disclosure, field } from './controls.js'
import type { Context, View } from './contracts.js'
import { element, styleRoot } from './dom.js'
import { drops, odometer, progress } from './feedback.js'
import { animateSurface } from './motion.js'
import type { SurfaceMotion } from './motion.js'
import { checklist, menu, selection } from './selection.js'

export type { OneEventDetail, OneEventMap, OneEventName, OneEventValues, OneValue } from './contracts.js'

type Entry = CatalogEntry<ControlSlug | MomentSlug>
const NativeElement = (globalThis.HTMLElement ?? class {}) as typeof HTMLElement
const patterns: Record<string, (ctx: Context) => View> = {
  button: action, switch: action, slider: range, progressbar: progress, status: drops,
  tablist: selection, radiogroup: selection, dialog: disclosure, textbox: field,
  searchbox: field, text: badge,
}
function mount(ctx: Context) {
  switch (ctx.entry.slug) {
    case 'popover': return disclosure(ctx)
    case 'choice-group': return choices(ctx)
    case 'checklist': return checklist(ctx)
    case 'odometer': return odometer(ctx)
    case 'radial-menu': case 'menu-morph': return menu(ctx)
    default: return patterns[ctx.entry.semanticRole](ctx)
  }
}

export class OneElement extends NativeElement {
  static entry?: Entry
  static formAssociated = false
  static observedAttributes = [
    'name', 'options', 'roles', 'label', 'value', 'min', 'max', 'step', 'checked', 'pressed',
    'open', 'disabled', 'loading', 'aria-busy', 'aria-invalid', 'data-one-role',
    'data-one-state', 'orientation', 'type', 'required', 'placeholder', 'description',
    'error', 'variant', 'trigger-label',
  ]
  private view?: View
  private motion?: SurfaceMotion
  private internals?: ElementInternals
  private formDisabled = false
  private initial?: { value: string | null; checked: boolean }

  constructor() {
    super()
    if ((this.constructor as typeof OneElement).formAssociated) this.internals = this.attachInternals?.()
  }
  get value() { return this.getAttribute('value') ?? '' }
  set value(value: string) { this.setAttribute('value', String(value)) }
  get checked() { return this.hasAttribute('checked') }
  set checked(value: boolean) { this.toggleAttribute('checked', Boolean(value)) }
  get disabled() { return this.hasAttribute('disabled') }
  set disabled(value: boolean) { this.toggleAttribute('disabled', Boolean(value)) }
  get open() { return this.hasAttribute('open') }
  set open(value: boolean) { this.toggleAttribute('open', Boolean(value)) }

  connectedCallback() {
    this.initial ??= { value: this.getAttribute('value'), checked: this.checked }
    this.render()
  }
  disconnectedCallback() { this.release() }
  private release() {
    this.view?.dispose?.()
    this.motion?.dispose()
    this.view = undefined
  }
  private render() {
    this.release()
    const root = this.shadowRoot ?? this.attachShadow({ mode: 'open', delegatesFocus: true })
    root.replaceChildren()
    styleRoot(root)
    const entry = (this.constructor as typeof OneElement).entry ?? findMoment(this.getAttribute('name') ?? '')
    if (!entry) return
    const surface = element('div', 'one-widget')
    surface.dataset.oneComponent = entry.slug
    if (entry.id !== entry.slug) surface.dataset.oneMoment = entry.slug
    root.append(surface)
    const host = this
    const motion = this.motion = animateSurface(host, surface, entry.springPreset)
    this.view = mount({
      host, root: surface, entry, motion,
      get label() { return host.getAttribute('label') || entry.name },
      get locked() { return host.formDisabled || host.disabled || host.hasAttribute('loading') || host.getAttribute('aria-busy') === 'true' },
      emit(name, value, extra) {
        host.dispatchEvent(new CustomEvent(name, {
          detail: { name: entry.slug, value, ...extra }, bubbles: true, composed: true,
        }))
      },
    })
    this.update()
  }
  private update(attribute?: string) {
    this.view?.update(attribute)
    if (!this.internals?.setFormValue) return
    const isSwitch = (this.constructor as typeof OneElement).entry?.slug === 'switch'
    this.internals.setFormValue(isSwitch ? (this.checked ? this.value || 'on' : null) : this.value)
    const input = this.shadowRoot?.querySelector('input')
    if (input) this.internals.setValidity(input.validity, input.validationMessage, input)
  }
  attributeChangedCallback(attribute: string, old: string | null, next: string | null) {
    if (!this.isConnected || old === next) return
    if (attribute === 'options' || attribute === 'roles' || (attribute === 'name' && !(this.constructor as typeof OneElement).entry)) this.render()
    else this.update(attribute)
  }
  formDisabledCallback(disabled: boolean) { this.formDisabled = disabled; this.update() }
  formResetCallback() {
    if (!this.initial) return
    if (this.initial.value === null) this.removeAttribute('value')
    else this.value = this.initial.value
    this.checked = this.initial.checked
  }
}

type OneTag = `one-${MomentSlug | ControlSlug | 'moment'}`
export const ONE_TAG_MAP: Readonly<Record<OneTag, typeof OneElement>> = Object.freeze(
  Object.fromEntries([
    ...[...ONE_CONTROLS, ...ONE_MOMENTS].map(entry => [
      entry.tagName, class extends OneElement {
        static override entry = entry
        static override formAssociated = entry.slug === 'field' || entry.slug === 'switch'
      },
    ]),
    ['one-moment', class extends OneElement {}],
  ]) as Record<OneTag, typeof OneElement>,
)
declare global {
  interface HTMLElementTagNameMap extends Record<OneTag, OneElement> {}
}

/** Safe to repeat, including with a scoped registry or in a server process. */
export function registerOneUI(registry: CustomElementRegistry | undefined = globalThis.customElements) {
  if (!registry) return
  for (const [tag, ctor] of Object.entries(ONE_TAG_MAP)) if (!registry.get(tag)) registry.define(tag, ctor)
}
registerOneUI()
