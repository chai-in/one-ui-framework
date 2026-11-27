import { Window } from 'happy-dom'

export const window = new Window()
for (const key of ['document', 'HTMLElement', 'HTMLButtonElement', 'CustomEvent', 'customElements']) {
  globalThis[key] = window[key]
}

export function mount(tag, attributes = {}) {
  const host = document.createElement(tag)
  for (const [key, value] of Object.entries(attributes)) host.setAttribute(key, value)
  document.body.append(host)
  return host
}

export function key(node, key) {
  const event = new window.KeyboardEvent('keydown', { key, bubbles: true, composed: true, cancelable: true })
  node.dispatchEvent(event)
  return event
}

// Synthetic key events do not have a user agent default action. Model only the
// native input/button behavior, leaving all custom navigation to the component.
export function activate(node, pressed = 'Enter') {
  const event = key(node, pressed)
  if (!event.defaultPrevented && !node.disabled &&
      (node.localName === 'button' || node.type === 'checkbox')) node.click()
}
export function pointer(node, type, x) {
  node.dispatchEvent(new window.PointerEvent(type, { pointerId: 1, clientX: x, button: 0, bubbles: true }))
}
export function events(node, name) {
  const received = []
  node.addEventListener(name, event => received.push(event))
  return received
}
