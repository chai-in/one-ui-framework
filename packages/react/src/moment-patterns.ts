'use client'

import * as React from 'react'
import { computeFanTransform, computeMagneticOffset, computeOdometerDigits, computeSwipeProgress, rubberBand, snapToDetent } from '@one-ui/core'
import type { CatalogEntry, MomentSlug } from '@one-ui/core'
import { OneTabs } from './controls.ts'
import { useOneSpring, useOneTheme, useReducedMotion } from './hooks.ts'
import { classes, h, navigate, useValue } from './shared.ts'
import type { OneOption } from './shared.ts'

type Spec = CatalogEntry<MomentSlug>
type Pattern<P> = P & { spec: Spec }
export interface MomentBaseProps {
  label?: string
  className?: string
  id?: string
  style?: React.CSSProperties
}
type Interactive = MomentBaseProps & { disabled?: boolean }

function numberedOptions(count: number): OneOption[] {
  return Array.from({ length: count }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))
}
const pages = numberedOptions(3)
const cells = numberedOptions(4)
const ratings = numberedOptions(5)
const menuActions = ['Edit', 'Share', 'Archive'].map(label => ({ label, value: label.toLowerCase() }))
const compass = ['1 / 2', '1 / 3', '2 / 3', '3 / 3', '3 / 2', '3 / 1', '2 / 1', '1 / 1']

const calm = { stiffness: 1600, damping: 80, mass: 1 }
function usePosition(spec: Spec, target: number) {
  const mode = useOneTheme().motion
  return useOneSpring(target, mode === 'calm' ? calm : spec.springPreset)
}
function root(spec: Spec, props: MomentBaseProps, position: number) {
  return { id: props.id, className: classes('one-moment', spec.tagName, props.className),
    'data-one-moment': spec.slug,
    style: { '--one-position': position, ...props.style } as React.CSSProperties }
}
function mark(child?: React.ReactNode, style?: React.CSSProperties) {
  return h('span', { 'aria-hidden': true, className: 'one-mark', style }, child)
}

export interface ToggleMomentProps extends Interactive {
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
}
export interface PressedMomentProps extends Interactive {
  pressed?: boolean
  defaultPressed?: boolean
  onPressedChange?: (pressed: boolean) => void
}
function Binary({ spec, props, value, change, pressed }: { spec: Spec; props: Interactive; value: boolean; change: (v: boolean) => void; pressed?: boolean }) {
  const position = usePosition(spec, Number(value))
  const icons: Partial<Record<MomentSlug, string>> = { 'eclipse-half': '◐',
    'squash-play': value ? 'Ⅱ' : '▶', 'rocker-switch': value ? 'Ⅰ' : '○' }
  return h('button', { ...root(spec, props, position), type: 'button', disabled: props.disabled,
    role: pressed ? undefined : 'switch', 'aria-checked': pressed ? undefined : value,
    'aria-pressed': pressed ? value : undefined, onClick: () => change(!value) },
    mark(icons[spec.slug] ?? h('i')), props.label ?? spec.name)
}
export function Toggle({ spec, checked, defaultChecked = false, onCheckedChange, ...props }: Pattern<ToggleMomentProps>): React.ReactElement {
  const [value, change] = useValue(checked, defaultChecked, onCheckedChange)
  return h(Binary, { spec, props, value, change })
}
export function Pressed({ spec, pressed, defaultPressed = false, onPressedChange, ...props }: Pattern<PressedMomentProps>): React.ReactElement {
  const [value, change] = useValue(pressed, defaultPressed, onPressedChange)
  return h(Binary, { spec, props, value, change, pressed: true })
}

export interface ActionMomentProps extends Interactive {
  onClick?: React.MouseEventHandler<HTMLButtonElement>
  resultLabel?: string
}
export function Action({ spec, onClick, resultLabel, ...props }: Pattern<ActionMomentProps>): React.ReactElement {
  const [count, setCount] = React.useState(0)
  const [drag, setDrag] = React.useState(0)
  const start = React.useRef<{ id: number; x: number; moved: boolean } | null>(null)
  const suppressClick = React.useRef(false)
  const swipe = spec.slug === 'swipe-confirm'
  const coin = spec.slug === 'flip-coin'
  const position = usePosition(spec, swipe ? drag || Number(count > 0) : count)
  const progress = swipe ? position : position - Math.floor(position)
  const arc = Math.sin(progress * Math.PI)
  const transforms: Record<string, string> = {
    'paper-plane': 'translate(' + arc * 55 + '%, ' + arc * -50 + '%) rotate(' + arc * -16 + 'deg)',
    'jelly-pad': 'scale(' + (1 + arc * .22) + ', ' + (1 - arc * .22) + ')',
    'ripple-pad': 'scale(' + (1 + arc * .65) + ')',
    'flip-coin': 'rotateY(' + position * 180 + 'deg)',
    'swipe-confirm': 'translateX(' + position * 35 + '%)',
  }
  const glyphs: Record<string, string> = { 'paper-plane': '➤', 'jelly-pad': '▣', 'ripple-pad': '◎',
    'flip-coin': count % 2 ? '●' : '○', 'swipe-confirm': count ? '✓' : '→' }
  const label = props.label ?? spec.name
  const outcome = count ? resultLabel ?? (coin ? count % 2 ? 'Tails' : 'Heads' : swipe ? 'Confirmed' : spec.slug === 'paper-plane' ? 'Send requested' : '') : ''
  return h('span', { className: 'one-action-result' },
    h('button', { ...root(spec, props, position), type: 'button', disabled: props.disabled,
      onClick(event: React.MouseEvent<HTMLButtonElement>) {
        if (suppressClick.current && event.detail !== 0) { suppressClick.current = false; return }
        onClick?.(event)
        if (event.defaultPrevented) return
        if (coin) {
          const face = Math.random() < .5 ? 0 : 1
          setCount(n => 2 * (Math.floor(n / 2) + 1) + face)
        } else setCount(n => n + 1)
      },
      onPointerDown(event: React.PointerEvent<HTMLButtonElement>) {
        if (!swipe || props.disabled || start.current || !event.isPrimary || event.button !== 0) return
        start.current = { id: event.pointerId, x: event.clientX, moved: false }
        suppressClick.current = false
        event.currentTarget.setPointerCapture(event.pointerId)
      },
      onPointerMove(event: React.PointerEvent<HTMLButtonElement>) {
        if (start.current?.id !== event.pointerId) return
        const distance = event.clientX - start.current.x
        start.current.moved ||= Math.abs(distance) > 4
        setDrag(computeSwipeProgress(distance, event.currentTarget.clientWidth).progress)
      },
      onPointerUp(event: React.PointerEvent<HTMLButtonElement>) {
        if (start.current?.id !== event.pointerId) return
        const delta = event.clientX - start.current.x
        suppressClick.current = (start.current.moved || Math.abs(delta) > 4) && !computeSwipeProgress(delta, event.currentTarget.clientWidth).confirmed
        start.current = null
        setDrag(0)
      },
      onPointerCancel(event: React.PointerEvent<HTMLButtonElement>) {
        cancelSwipe(event.pointerId)
      },
      onLostPointerCapture(event: React.PointerEvent<HTMLButtonElement>) {
        cancelSwipe(event.pointerId)
      },
    }, mark(glyphs[spec.slug], { transform: transforms[spec.slug] }), label),
    h('span', { role: 'status', 'aria-atomic': true }, outcome))

  function cancelSwipe(pointerId: number) {
    if (start.current?.id !== pointerId) return
    start.current = null
    suppressClick.current = true
    setDrag(0)
  }
}

export interface OptionMomentProps extends Interactive {
  options?: readonly OneOption[]
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}
export interface TabMomentProps extends OptionMomentProps { orientation?: 'horizontal' | 'vertical' }
export function Tabs({ spec, options = pages, value, defaultValue, onValueChange, orientation, ...props }: Pattern<TabMomentProps>): React.ReactElement {
  const [selected, change] = useValue(value, defaultValue ?? options.find(o => !o.disabled)?.value ?? '', onValueChange)
  const index = Math.max(0, options.findIndex(option => option.value === selected && !option.disabled))
  const position = usePosition(spec, index)
  const decorated = options.map((option, i) => {
    const weight = Math.max(0, 1 - Math.abs(i - position))
    const transform = spec.slug === 'leaf-tabs' ? 'rotate(' + -35 * weight + 'deg)'
      : 'scale(' + (.6 + weight) + ', ' + (.65 + .35 * weight) + ')'
    return { ...option, label: h(React.Fragment, null, mark(h('i'), { transform }), option.label) }
  })
  return h('div', root(spec, props, position), h(OneTabs, { label: props.label ?? spec.name, options: decorated, disabled: props.disabled,
    value: selected, onValueChange: change, orientation }))
}

function MagnetMark({ spec, x, y }: { spec: Spec; x: number; y: number }) {
  const left = usePosition(spec, x)
  const top = usePosition(spec, y)
  return mark(h('i'), { transform: 'translate(' + left + 'px,' + top + 'px)' })
}

function choiceTransform(spec: Spec, index: number, size: number, position: number) {
  const weight = Math.max(0, 1 - Math.abs(position - index))
  switch (spec.slug) {
    case 'card-fan': {
      const fan = computeFanTransform(index, size, 28, 6)
      return 'translateY(' + fan.translateY * (1 + weight) + 'px) rotate(' + fan.rotateDeg * (1 - weight) + 'deg)'
    }
    case 'depth-stack': return 'scale(' + (.8 + weight * .2) + ')'
    case 'snap-grid': return 'translateY(' + weight * -20 + '%)'
    case 'pebble-rating': return 'scale(' + (index <= position ? 1.2 : .85) + ')'
  }
}

export function Choice({ spec, options: supplied, value, defaultValue, onValueChange, ...props }: Pattern<OptionMomentProps>): React.ReactElement {
  const uid = React.useId()
  const options = supplied ?? (spec.slug === 'pebble-rating' ? ratings : spec.slug.endsWith('-grid') ? cells : pages)
  const first = options.find(o => !o.disabled)?.value
  const [selection, change] = useValue(value, defaultValue ?? first ?? '', onValueChange)
  const selected = options.some(o => o.value === selection && !o.disabled) ? selection : first
  const index = options.findIndex(o => o.value === selected)
  const position = usePosition(spec, index)
  const reduced = useReducedMotion()
  const [magnet, setMagnet] = React.useState({ index: -1, x: 0, y: 0 })
  return h('fieldset', { ...root(spec, props, position), role: 'radiogroup', 'aria-labelledby': uid + '-label', disabled: props.disabled },
    h('legend', { id: uid + '-label' }, props.label ?? spec.name), h('div', { className: 'one-options' }, options.map((option, i) => {
      const visual = spec.slug === 'magnet-grid'
        ? h(MagnetMark, { spec, x: !reduced && magnet.index === i ? magnet.x : 0, y: !reduced && magnet.index === i ? magnet.y : 0 })
        : mark(h('i'), { transform: reduced ? undefined : choiceTransform(spec, i, options.length, position) })
      return h('label', { key: option.value, 'data-selected': option.value === selected,
        onPointerMove(event: React.PointerEvent<HTMLLabelElement>) {
          if (spec.slug !== 'magnet-grid' || reduced || props.disabled || option.disabled) return
          const rect = event.currentTarget.getBoundingClientRect()
          const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
          setMagnet({ index: i, ...computeMagneticOffset(center, { x: event.clientX, y: event.clientY }, Math.max(rect.width, rect.height), .35) })
        }, onPointerLeave: spec.slug === 'magnet-grid' ? () => setMagnet({ index: -1, x: 0, y: 0 }) : undefined },
        h('input', { type: 'radio', name: uid, value: option.value, checked: selected === option.value, disabled: option.disabled,
          onChange: () => change(option.value) }), visual, option.label)
    })))
}

export interface RangeMomentProps extends Interactive {
  min?: number
  max?: number
  step?: number
  value?: number
  defaultValue?: number
  onValueChange?: (value: number) => void
  valueText?: (value: number) => string
}
export function Range({ spec, min = 0, max = 100, step = 1, value, defaultValue = min, onValueChange, valueText, ...props }: Pattern<RangeMomentProps>): React.ReactElement {
  const [raw, change] = useValue(value, defaultValue, onValueChange)
  const lastDetent = Math.floor((max - min) / step + Number.EPSILON * 8)
  const current = Number.isSafeInteger(lastDetent) && lastDetent >= 0 && step > 0
    ? snapToDetent(raw, lastDetent + 1, min, min + step * lastDetent)
    : Math.max(min, Math.min(max, raw))
  const position = usePosition(spec, max > min ? (current - min) / (max - min) : 0)
  const transform = spec.slug === 'detent-dial' ? 'rotate(' + (position * 270 - 135) + 'deg)'
    : spec.slug === 'elastic-string' ? 'scaleX(' + (1 + rubberBand(position, .5)) + ')' : 'translateX(' + position * 80 + '%)'
  return h('label', root(spec, props, position), props.label ?? spec.name,
    mark(spec.slug === 'detent-dial' ? '↑' : spec.slug === 'elastic-string' ? '⌁' : '∿', { transform }),
    h('input', { type: 'range', 'aria-label': props.label ?? spec.name, min, max, step, disabled: props.disabled, value: current,
      'aria-valuetext': valueText?.(current), onChange: (e: React.ChangeEvent<HTMLInputElement>) => change(e.currentTarget.valueAsNumber) }),
    h('span', { 'aria-hidden': true }, valueText?.(current) ?? current))
}

export interface ProgressMomentProps extends MomentBaseProps {
  value?: number
  max?: number
  valueText?: string
  state?: 'pending' | 'partial' | 'completed' | 'cancelled' | 'error' | 'empty' | 'offline' | 'unavailable'
}
export function Progress({ spec, max = 100, value, valueText, state, ...props }: Pattern<ProgressMomentProps>): React.ReactElement {
  const limit = Number.isFinite(max) && max > 0 ? max : 100
  const terminal = state && state !== 'pending' && state !== 'partial' ? state : undefined
  const current = state === 'completed' ? limit : value === undefined || !Number.isFinite(value) ? undefined : Math.max(0, Math.min(limit, value))
  const position = usePosition(spec, (current ?? 0) / limit)
  const reduced = useReducedMotion()
  const pending = current === undefined && !terminal
  let visual: React.ReactNode
  if (spec.slug === 'download-ring') {
    visual = h('svg', { viewBox: '0 0 24 24' }, h('circle', { cx: 12, cy: 12, r: 10, pathLength: 1,
      strokeDasharray: (pending ? .25 : Math.max(0, Math.min(1, position))) + ' 1' }))
  } else if (spec.slug === 'tide-progress') {
    const level = pending ? .4 : Math.max(0, Math.min(1, position))
    visual = h('svg', { viewBox: '0 0 40 20' }, h('path', {
      d: reduced ? 'M0 0H40V24H0Z' : 'M0 0Q5 -2 10 0T20 0T30 0T40 0V24H0Z',
      transform: 'translate(0 ' + (1 - level) * 24 + ')',
    }))
  } else {
    visual = Array.from({ length: 5 }, (_, i) => {
      const fill = pending ? .5 : Math.max(0, Math.min(1, 5 * position - i))
      const transform = spec.slug === 'domino-row' ? 'rotate(' + fill * 50 + 'deg)' : spec.slug === 'dot-revolve'
        ? 'rotate(' + i * 72 + 'deg) translateY(-85%) scale(' + (.5 + fill * .5) + ')'
        : 'scale' + (spec.slug === 'bars-fade' ? 'Y' : '') + '(' + (.4 + fill * .6) + ')'
      return h('i', { key: i, style: { transform, opacity: spec.slug === 'bars-fade' ? .35 + .65 * fill : undefined }, 'data-filled': fill >= .5 })
    })
  }
  return h('div', { ...root(spec, props, position), role: 'progressbar', 'aria-label': props.label ?? spec.name,
    'aria-valuemin': 0, 'aria-valuemax': limit, 'aria-valuenow': current, 'aria-valuetext': valueText ?? terminal,
    'data-pending': pending, 'data-animate': pending && !reduced }, mark(visual), props.label ?? spec.name,
    (terminal || current !== undefined) && h('span', { 'aria-hidden': true }, valueText ?? terminal ?? Math.round(current! / limit * 100) + '%'))
}

export interface OdometerProps extends MomentBaseProps { /** A safe integer in caller units. */ value?: number }
export function Odometer({ spec, value = 0, ...props }: Pattern<OdometerProps>): React.ReactElement {
  const position = usePosition(spec, value)
  // Work in magnitude digits so the sign never travels through a digit wheel.
  const display = Math.max(Number.MIN_SAFE_INTEGER, Math.min(Number.MAX_SAFE_INTEGER, Math.trunc(position)))
  const digits = computeOdometerDigits(display, value)
  const magnitude = Math.abs(position)
  return h('div', { ...root(spec, props, position), role: 'status', 'aria-live': 'polite', 'aria-atomic': true },
    h('span', { className: 'one-sr-only' }, (props.label ?? spec.name) + ' ' + value),
    mark(h(React.Fragment, null, display < 0 ? '−' : '', digits.map(digit => {
      if (digit.from === null) return null
      const unit = 10 ** digit.place
      const fraction = Math.max(0, magnitude % unit - unit + 1)
      const carry = digit.place === 0 ? magnitude % 1 : fraction
      return h('span', { key: digit.place, className: 'one-wheel' },
        h('i', { style: { transform: 'translateY(' + -carry + 'em)' } }, digit.from,
          carry > 0 && h('span', null, (digit.from + 1) % 10)))
    }))))
}

export interface MergeDropsProps extends MomentBaseProps { value?: string; merged?: boolean }
export function MergeDrops({ spec, value = '', merged = Boolean(value), ...props }: Pattern<MergeDropsProps>): React.ReactElement {
  const position = usePosition(spec, Number(merged))
  return h('div', { ...root(spec, props, position), role: 'status', 'aria-live': 'polite', 'aria-atomic': true },
    mark(h(React.Fragment, null, h('i'), h('i'))), props.label ? props.label + (value ? ' ' : '') : value ? '' : spec.name, value)
}

export interface SearchMomentProps extends Interactive {
  value?: string
  defaultValue?: string
  placeholder?: string
  onValueChange?: (value: string) => void
  onSubmit?: (query: string) => void
}
export function Search({ spec, value, defaultValue = '', onValueChange, onSubmit, placeholder, ...props }: Pattern<SearchMomentProps>): React.ReactElement {
  const [query, change] = useValue(value, defaultValue, onValueChange)
  const [focused, focus] = React.useState(false)
  const position = usePosition(spec, Number(focused))
  return h('label', root(spec, props, position), props.label ?? spec.name,
    mark('⌕', { transform: 'scale(' + (1 + rubberBand(position, .2)) + ')' }),
    h('input', { type: 'search', value: query, disabled: props.disabled, placeholder, onFocus: () => focus(true), onBlur: () => focus(false),
      onChange: (event: React.ChangeEvent<HTMLInputElement>) => change(event.currentTarget.value),
      onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.defaultPrevented || event.nativeEvent.isComposing) return
        if (event.key === 'Escape' && query) {
          event.preventDefault()
          event.stopPropagation()
          change('')
        } else if (onSubmit && event.key === 'Enter') {
          event.preventDefault()
          onSubmit(query)
        }
      } }))
}

export interface ChecklistProps extends Interactive {
  options?: readonly OneOption[]
  value?: readonly string[]
  defaultValue?: readonly string[]
  onValueChange?: (values: readonly string[]) => void
}
export function Checklist({ spec, options = pages, value, defaultValue = [], onValueChange, ...props }: Pattern<ChecklistProps>): React.ReactElement {
  const [checked, change] = useValue(value, defaultValue, onValueChange)
  const position = usePosition(spec, options.length ? checked.length / options.length : 0)
  return h('fieldset', { ...root(spec, props, position), disabled: props.disabled },
    h('legend', null, props.label ?? spec.name), mark(h('i', { style: { transform: 'scaleX(' + position + ')' } })),
    options.map(option => h('label', { key: option.value }, h('input', { type: 'checkbox', value: option.value, disabled: option.disabled,
      checked: checked.includes(option.value), onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        change(event.currentTarget.checked ? [...checked, option.value] : checked.filter(key => key !== option.value)) }), option.label)))
}

export interface MenuMomentProps extends Interactive {
  options?: readonly OneOption[]
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onChoose?: (value: string) => void
}
export function Menu({ spec, options = menuActions, open, defaultOpen = false, onOpenChange, onChoose, ...props }: Pattern<MenuMomentProps>): React.ReactElement {
  const [shown, change] = useValue(open, defaultOpen, onOpenChange)
  const canOpen = !props.disabled && options.some(option => !option.disabled)
  const expanded = shown && canOpen
  const uid = React.useId()
  const container = React.useRef<HTMLDivElement>(null)
  const trigger = React.useRef<HTMLButtonElement>(null)
  const menu = React.useRef<HTMLDivElement>(null)
  const last = React.useRef(false)
  const requestedClose = React.useRef(false)
  const dismissing = React.useRef(false)
  const radial = spec.slug === 'radial-menu' && options.length <= compass.length
  const position = usePosition(spec, Number(expanded))
  const dismiss = React.useCallback((restoreFocus: boolean, onDismiss?: () => void) => {
    if (dismissing.current) return
    dismissing.current = true
    try {
      if (restoreFocus) trigger.current?.focus({ preventScroll: true })
      change(false)
      onDismiss?.()
    } finally {
      dismissing.current = false
    }
  }, [change])
  React.useEffect(() => {
    if (canOpen || !shown) requestedClose.current = false
    else if (!requestedClose.current) {
      requestedClose.current = true
      change(false)
    }
  }, [canOpen, shown, change])
  React.useEffect(() => {
    if (!expanded) return
    focusItem(last.current)
    last.current = false
  }, [expanded])
  React.useEffect(() => {
    const scope = container.current
    if (!expanded || !scope) return
    const outside = (event: PointerEvent) => { if (!event.composedPath().includes(scope)) dismiss(false) }
    scope.ownerDocument.addEventListener('pointerdown', outside)
    return () => scope.ownerDocument.removeEventListener('pointerdown', outside)
  }, [expanded, dismiss])
  function focusItem(atEnd: boolean) {
    const available = menu.current?.querySelectorAll<HTMLButtonElement>('button:enabled')
    available?.[atEnd ? available.length - 1 : 0]?.focus()
  }
  return h('div', { ...root(spec, props, position), ref: container,
    onBlur(event: React.FocusEvent<HTMLDivElement>) {
      if (expanded && !event.currentTarget.contains(event.relatedTarget)) dismiss(false)
    },
    onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
      if (expanded && event.key === 'Escape' && !event.defaultPrevented && !event.nativeEvent.isComposing) {
        event.preventDefault()
        event.stopPropagation()
        dismiss(true)
      }
    } },
    h('button', { type: 'button', ref: trigger, disabled: props.disabled, 'aria-disabled': !canOpen || undefined,
      'aria-haspopup': 'menu', 'aria-expanded': expanded, 'aria-controls': uid,
      onClick: () => { if (expanded) dismiss(true); else if (canOpen) change(true) },
      onKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
        if (!canOpen || event.defaultPrevented || event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
        event.preventDefault()
        const atEnd = event.key === 'ArrowUp'
        if (expanded) focusItem(atEnd)
        else { last.current = atEnd; change(true) }
      } }, mark(spec.slug === 'radial-menu' ? '⊕' : expanded ? '×' : '☰', { transform: 'rotate(' + position * 45 + 'deg)' }), props.label ?? spec.name),
    h('div', { ref: menu, id: uid, role: 'menu', hidden: !expanded, 'data-radial': radial, 'aria-label': props.label ?? spec.name,
      onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
        const buttons = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button:enabled'))
        const item = (event.target as Element).closest('button')
        const index = item && buttons.includes(item) ? navigate(event, buttons.indexOf(item), buttons.length, true) : undefined
        if (index !== undefined) { event.preventDefault(); buttons[index].focus() }
      } }, options.map((option, i) => h('button', { key: option.value, type: 'button', role: 'menuitem', tabIndex: -1,
        style: radial ? { gridArea: compass[Math.floor(i * compass.length / options.length)] } : undefined, disabled: props.disabled || option.disabled,
        onClick: () => { if (expanded) dismiss(true, () => onChoose?.(option.value)) } }, spec.slug === 'radial-menu' && mark('•', {
          transform: 'rotate(' + i / options.length * 360 + 'deg) translateX(' + position * 40 + '%)' }), option.label))))
}
