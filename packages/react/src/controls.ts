'use client'

import * as React from 'react'
import { activeElementInScope, classes, h, navigate, useValue } from './shared.ts'
import type { OneOption } from './shared.ts'

export type OneAction = 'action' | 'accept' | 'decline' | 'destructive' | 'neutral'
export interface OneButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: OneAction
  label?: string
  loading?: boolean
}
export const OneButton = React.forwardRef<HTMLButtonElement, OneButtonProps>(function OneButton({
  variant = 'action', label, loading, disabled, className, children, onClick, type = 'button', ...props
}, ref) {
  return h('button', { ...props, ref, type, disabled, className: classes('one-button', className),
    'data-one-variant': variant, 'aria-busy': loading || undefined,
    'aria-disabled': loading || props['aria-disabled'], onClick(event: React.MouseEvent<HTMLButtonElement>) {
      if (loading || props['aria-disabled'] === true || props['aria-disabled'] === 'true') {
        event.preventDefault()
        return
      }
      onClick?.(event)
    },
  }, children ?? label)
})

export interface OneChoiceGroupProps {
  label: string
  options: readonly (OneOption & { variant: OneAction })[]
  onChoose?: (value: string) => void
  disabled?: boolean
  className?: string
}
export function OneChoiceGroup({ label, options, disabled, onChoose, className }: OneChoiceGroupProps): React.ReactElement {
  return h('div', { role: 'group', 'aria-label': label, className: classes('one-choice-group', className) },
    options.map(option => h(OneButton, { key: option.value, disabled: disabled || option.disabled,
      variant: option.variant, onClick: () => onChoose?.(option.value) }, option.label)))
}

export interface OneFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: React.ReactNode
  error?: React.ReactNode
}
export const OneField = React.forwardRef<HTMLInputElement, OneFieldProps>(function OneField({
  label, description, error, className, id, ...props
}, ref) {
  const uid = React.useId()
  const field = id ?? uid
  const described = [props['aria-describedby'], description && field + '-hint', error && field + '-error'].filter(Boolean).join(' ')
  return h('div', { className: 'one-field' }, h('label', { htmlFor: field }, label),
    h('input', { ...props, id: field, ref, className: classes('one-input', className),
      'aria-describedby': described || undefined, 'aria-invalid': error ? true : props['aria-invalid'] }),
    description && h('small', { id: field + '-hint' }, description),
    error && h('small', { id: field + '-error', className: 'one-field-error' }, error))
})

export interface OneBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'category-blue' | 'category-green' | 'category-lavender'
  label?: string
}
export function OneBadge({ variant = 'neutral', label, className, children, ...props }: OneBadgeProps): React.ReactElement {
  return h('span', { ...props, className: classes('one-badge', className), 'data-one-variant': variant }, children ?? label)
}

export interface OneSwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'defaultChecked'> {
  label: string
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}
export const OneSwitch = React.forwardRef<HTMLButtonElement, OneSwitchProps>(function OneSwitch({
  label, checked, defaultChecked = false, onCheckedChange, onClick, className, children, ...props
}, ref) {
  const [value, change] = useValue(checked, defaultChecked, onCheckedChange)
  return h('button', { ...props, ref, type: 'button', role: 'switch', 'aria-checked': value,
    className: classes('one-switch', className), onClick(event: React.MouseEvent<HTMLButtonElement>) {
      onClick?.(event)
      if (!event.defaultPrevented && props['aria-disabled'] !== true && props['aria-disabled'] !== 'true') change(!value)
    } }, children ?? h('span', { className: 'one-switch-track', 'aria-hidden': true }, h('i')), label)
})

export interface OneTabsProps {
  label: string
  options: readonly OneOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  orientation?: 'horizontal' | 'vertical'
  className?: string
  disabled?: boolean
  style?: React.CSSProperties
}
export function OneTabs({ label, options, value, defaultValue, onValueChange, orientation = 'horizontal', className, disabled, style }: OneTabsProps): React.ReactElement {
  const uid = React.useId()
  const enabled = options.filter(option => !option.disabled)
  const [selection, change] = useValue(value, defaultValue ?? enabled[0]?.value, onValueChange)
  const active = enabled.find(option => option.value === selection)?.value ?? enabled[0]?.value
  const buttons = React.useRef(new Map<string, HTMLButtonElement>())
  const focused = React.useRef<string | undefined>(undefined)
  React.useEffect(() => {
    const previous = focused.current
    if (previous === undefined || (!disabled && enabled.some(option => option.value === previous))) return
    focused.current = undefined
    if (disabled || active === undefined) return
    const target = buttons.current.get(active)
    if (!target) return
    const current = activeElementInScope(target)
    if (!current || current === target.ownerDocument.body || current === buttons.current.get(previous)) {
      target.focus({ preventScroll: true })
    }
  })
  return h('div', { className: classes('one-tabs', className), style },
    h('div', { role: 'tablist', 'aria-label': label, 'aria-orientation': orientation }, options.map(option => {
      const id = uid + '-' + encodeURIComponent(option.value)
      return h('button', { key: option.value, id: id + '-tab', type: 'button', role: 'tab', disabled: disabled || option.disabled,
        ref: (el: HTMLButtonElement | null) => { if (el) buttons.current.set(option.value, el); else buttons.current.delete(option.value) },
        tabIndex: option.value === active ? 0 : -1, 'aria-selected': option.value === active, 'aria-controls': id + '-panel',
        onFocus: () => { focused.current = option.value },
        onBlur(event: React.FocusEvent<HTMLButtonElement>) {
          if (event.relatedTarget) focused.current = undefined
        },
        onClick: () => change(option.value), onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
          const next = navigate(event, enabled.indexOf(option), enabled.length, orientation === 'vertical')
          if (next === undefined) return
          event.preventDefault()
          const key = enabled[next].value
          buttons.current.get(key)?.focus()
          change(key)
        },
      }, option.label)
    })),
    options.map(option => {
      const id = uid + '-' + encodeURIComponent(option.value)
      return h('div', { key: option.value, role: 'tabpanel', id: id + '-panel', 'aria-labelledby': id + '-tab',
        hidden: option.value !== active, tabIndex: 0 }, option.panel)
    }))
}

export interface OneOverlayProps {
  label: string
  trigger?: React.ReactNode
  children?: React.ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
  closeLabel?: string
}
export function OneDialog({ label, trigger, children, open, defaultOpen = false, onOpenChange, closeLabel = 'Close', className }: OneOverlayProps): React.ReactElement {
  const [shown, change] = useValue(open, defaultOpen, onOpenChange)
  const id = React.useId()
  const dialog = React.useRef<HTMLDialogElement>(null)
  React.useEffect(() => {
    const el = dialog.current
    if (!el || !shown) return
    const opener = activeElementInScope(el) as HTMLElement | null
    el.showModal()
    return () => {
      el.close()
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [shown])
  return h(React.Fragment, null,
    trigger !== undefined && h(OneButton, { 'aria-haspopup': 'dialog', 'aria-controls': id, onClick(event) {
      event.currentTarget.focus({ preventScroll: true })
      change(true)
    } }, trigger),
    h('dialog', { ref: dialog, id, 'aria-labelledby': id + '-label', className: classes('one-dialog', className),
      onCancel(event: React.SyntheticEvent<HTMLDialogElement>) { event.preventDefault(); change(false) },
      onClose() { if (shown && !dialog.current?.open) change(false) },
    }, h('h2', { id: id + '-label' }, label), h(OneButton, { variant: 'neutral', onClick: () => change(false) }, closeLabel), children))
}

/** Scoped non-modal disclosure. Only the foremost open layer handles dismissal. */
export function OnePopover({ label, trigger, children, open, defaultOpen = false, onOpenChange, className }: OneOverlayProps): React.ReactElement {
  const [shown, change] = useValue(open, defaultOpen, onOpenChange)
  const id = React.useId()
  const invoker = React.useRef<HTMLButtonElement>(null)
  const panel = React.useRef<HTMLDivElement>(null)
  const request = React.useRef(change)
  React.useEffect(() => { request.current = change }, [change])
  React.useEffect(() => {
    const el = panel.current
    if (!el || !shown) return
    const doc = el.ownerDocument
    // Treat an open child disclosure as the top layer, including for outside clicks.
    function top() {
      const visible = layers.get(doc)?.filter(layer => !composedClosest(layer, '[hidden], dialog:not([open])'))
      return visible?.at(-1) === el
    }
    const blockedByModal = (event: Event) => {
      // A slotted target can be inside a native dialog in another shadow root.
      const modal = event.composedPath().find(node => (node as Element).matches?.('dialog[open]'))
      return modal !== undefined && modal !== composedClosest(el, 'dialog[open]')
    }
    function dismiss(event: KeyboardEvent) {
      if (event.key === 'Escape' && !event.defaultPrevented && !event.isComposing && top() && !blockedByModal(event)) {
        event.preventDefault()
        request.current(false)
        invoker.current?.focus()
      }
    }
    function outside(event: PointerEvent) {
      const path = event.composedPath()
      if (top() && !blockedByModal(event) && !path.includes(el!) && !path.includes(invoker.current!)) {
        request.current(false)
        if (el!.contains(doc.activeElement)) invoker.current?.focus()
      }
    }
    const stack = layers.get(doc) ?? []
    const child = stack.findIndex(layer => el.contains(layer))
    if (child < 0) stack.push(el)
    else stack.splice(child, 0, el)
    layers.set(doc, stack)
    doc.addEventListener('keydown', dismiss)
    doc.addEventListener('pointerdown', outside)
    return () => {
      stack.splice(stack.indexOf(el), 1)
      doc.removeEventListener('keydown', dismiss)
      doc.removeEventListener('pointerdown', outside)
    }
  }, [shown])
  return h('div', { className: classes('one-popover', className) },
    h(OneButton, { ref: invoker, 'aria-expanded': shown, 'aria-controls': id, onClick: () => change(!shown) }, trigger ?? label),
    h('div', { id, ref: panel, hidden: !shown, role: 'group', 'aria-label': label, className: 'one-popover-panel' }, children))
}
const layers = new WeakMap<Document, HTMLElement[]>()

function composedClosest(node: Node, selector: string): Element | undefined {
  for (let next: Node | null = node; next; next = (next as Element).assignedSlot ?? next.parentNode ?? (next as ShadowRoot).host ?? null) {
    if ((next as Element).matches?.(selector)) return next as Element
  }
}
