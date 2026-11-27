import type { CatalogEntry, ControlSlug, MomentSlug } from '@one-ui/core'
import type { SurfaceMotion } from './motion.js'

export type OneValue = string | number | boolean
export interface OneEventDetail<V extends OneValue = OneValue> {
  name: ControlSlug | MomentSlug
  value: V
  index?: number
  checked?: boolean
}
export interface OneEventValues {
  'one-change': OneValue
  'one-toggle': boolean
  'one-confirm': boolean
  'one-send': number
  'one-complete': number
  'one-select': string
  'one-action': OneValue
}
export type OneEventName = keyof OneEventValues
export type OneEventMap = { [Name in OneEventName]: CustomEvent<OneEventDetail<OneEventValues[Name]>> }
declare global { interface HTMLElementEventMap extends OneEventMap {} }

export interface Context {
  host: HTMLElement
  root: HTMLElement
  entry: CatalogEntry<ControlSlug | MomentSlug>
  motion: SurfaceMotion
  readonly label: string
  readonly locked: boolean
  emit<Name extends OneEventName>(name: Name, value: OneEventValues[Name], extra?: Pick<OneEventDetail, 'index' | 'checked'>): void
}
export interface View {
  update(attribute?: string): void
  dispose?(): void
}
