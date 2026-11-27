import { primitives, moments, tokens } from './styles.js'

export function element<K extends keyof HTMLElementTagNameMap>(tag: K, className = '', text = '') {
  const node = document.createElement(tag)
  if (className) node.className = className
  if (text) node.textContent = text
  return node
}

export function button(className: string) {
  const node = element('button', className + ' one-focusable')
  node.type = 'button'
  return node
}

export function slot(name = '') {
  const node = element('slot')
  node.name = name
  return node
}

export function numberAttr(host: Element, name: string, fallback: number) {
  const raw = host.getAttribute(name)
  if (!raw?.trim()) return fallback
  const number = Number(raw)
  return Number.isFinite(number) ? number : fallback
}

export const clamp = (n: number, min = 0, max = 1) => Math.max(min, Math.min(n, max))

export function bounds(host: Element) {
  const min = numberAttr(host, 'min', 0)
  const max = Math.max(min, numberAttr(host, 'max', 100))
  const step = numberAttr(host, 'step', 1)
  return { min, max, step: step > 0 ? step : 1, value: clamp(numberAttr(host, 'value', min), min, max) }
}

export function options(host: Element, fallback: readonly string[]) {
  const items = host.getAttribute('options')?.split(',').map(item => item.trim()).filter(Boolean)
  return items?.length ? items : fallback
}

export function arrowIndex(event: KeyboardEvent, current: number, length: number, columns = 1, axis?: 'horizontal' | 'vertical', direction = 1) {
  if (event.defaultPrevented || event.isComposing || event.altKey || event.ctrlKey || event.metaKey) return null
  if (event.key === 'Home') return 0
  if (event.key === 'End') return length - 1
  const horizontal = event.key === 'ArrowRight' ? direction : event.key === 'ArrowLeft' ? -direction : 0
  const vertical = event.key === 'ArrowDown' ? columns : event.key === 'ArrowUp' ? -columns : 0
  const delta = axis === 'vertical' ? vertical : axis === 'horizontal' ? horizontal : horizontal || vertical
  return delta ? ((current + delta) % length + length) % length : null
}

const sheets = new WeakMap<Document, CSSStyleSheet>()
const tokenDocuments = new WeakSet<Document>()
export function styleRoot(root: ShadowRoot) {
  const doc = root.ownerDocument
  if (!tokenDocuments.has(doc)) {
    const style = doc.createElement('style')
    style.dataset.oneTokens = ''
    style.textContent = tokens
    doc.head.prepend(style)
    tokenDocuments.add(doc)
  }
  if ('adoptedStyleSheets' in root && doc.defaultView?.CSSStyleSheet?.prototype.replaceSync) {
    let sheet = sheets.get(doc)
    if (!sheet) {
      sheet = new doc.defaultView.CSSStyleSheet()
      sheet.replaceSync(primitives + '\n' + moments)
      sheets.set(doc, sheet)
    }
    root.adoptedStyleSheets = [sheet]
  } else {
    const style = doc.createElement('style')
    style.textContent = primitives + '\n' + moments
    root.prepend(style)
  }
}
