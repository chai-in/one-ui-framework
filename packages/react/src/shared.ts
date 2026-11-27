import * as React from 'react'

export const h = React.createElement
export const classes = (...names: (string | undefined)[]) => names.filter(Boolean).join(' ')

export function useValue<T>(controlled: T | undefined, initial: T, onChange?: (next: T) => void): [T, (next: T) => void] {
  const [local, setLocal] = React.useState(initial)
  const change = React.useCallback((next: T) => {
    if (controlled === undefined) setLocal(next)
    onChange?.(next)
  }, [controlled, onChange])
  return [controlled ?? local, change]
}

export interface OneOption {
  value: string
  label: React.ReactNode
  disabled?: boolean
  panel?: React.ReactNode
}

/** Return the next enabled index for a roving tab stop. */
export function navigate(event: React.KeyboardEvent, index: number, size: number, vertical: boolean) {
  if (!size || event.defaultPrevented || event.nativeEvent.isComposing || event.altKey || event.ctrlKey || event.metaKey) return
  const { key } = event
  if (key === 'Home') return 0
  if (key === 'End') return size - 1
  if (vertical && key === 'ArrowDown') return (index + 1) % size
  if (vertical && key === 'ArrowUp') return (index - 1 + size) % size
  if (vertical || (key !== 'ArrowRight' && key !== 'ArrowLeft')) return
  const node = event.currentTarget
  const rtl = node.ownerDocument.defaultView?.getComputedStyle(node).direction === 'rtl'
  const delta = (key === 'ArrowRight') !== rtl ? 1 : -1
  return (index + delta + size) % size
}

export function activeElementInScope(node: HTMLElement) {
  return (node.getRootNode() as Document | ShadowRoot).activeElement
}
