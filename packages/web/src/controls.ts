import { rubberBand } from '@one-ui/core'
import { artwork } from './artwork.js'
import type { Context, View } from './contracts.js'
import { button, element, options, slot } from './dom.js'

export function field(ctx: Context): View {
  const { host, root, entry } = ctx
  const search = entry.slug === 'rubber-search'
  const label = element('label', 'one-field-label')
  const caption = element('span')
  const input = element('input', 'one-field one-focusable')
  const help = element('span')
  help.id = 'hint'
  help.setAttribute('aria-live', 'polite')
  const icon = search ? artwork(entry.slug) : null
  label.append(caption)
  if (icon) label.append(icon)
  label.append(input)
  root.classList.add('one-field-wrap')
  root.append(label, help)
  let editing = false
  function changed() {
    if (ctx.locked) return
    editing = true
    host.setAttribute('value', input.value)
    editing = false
    ctx.emit('one-change', input.value)
  }
  input.addEventListener('input', changed)
  input.addEventListener('focus', () => { if (search) ctx.motion.target(1) })
  input.addEventListener('blur', () => { if (search) ctx.motion.target(0) })
  input.addEventListener('keydown', event => {
    if (!search || ctx.locked || event.defaultPrevented || event.isComposing) return
    if (event.key === 'Escape' && input.value) {
      event.preventDefault(); event.stopPropagation(); input.value = ''; changed()
    }
    if (event.key === 'Enter') ctx.emit('one-action', input.value)
  })
  if (icon) ctx.motion.sample(p => icon.style.setProperty('--one-stretch', String(1 + rubberBand(p, .35))))
  return { update() {
    caption.textContent = ctx.label
    const type = search ? 'search' : (host.getAttribute('type') || 'text')
    if (input.type !== type) input.type = type
    input.name = host.getAttribute('name') ?? ''
    input.placeholder = host.getAttribute('placeholder') ?? ''
    input.disabled = ctx.locked
    input.required = host.hasAttribute('required')
    const value = host.getAttribute('value') ?? ''
    if (!editing && input.value !== value) input.value = value
    const error = host.getAttribute('error')
    const description = error || host.getAttribute('description') || ''
    if (help.textContent !== description) help.textContent = description
    help.dataset.oneState = error ? 'error' : 'description'
    help.hidden = !help.textContent
    if (help.textContent) input.setAttribute('aria-describedby', help.id)
    else input.removeAttribute('aria-describedby')
    input.setAttribute('aria-invalid', String(Boolean(error) || host.getAttribute('aria-invalid') === 'true'))
    input.setCustomValidity(error ?? '')
  } }
}

export function badge(ctx: Context): View {
  const content = slot()
  const badge = element('span', 'one-badge')
  badge.append(content)
  ctx.root.append(badge)
  return { update() {
    content.textContent = ctx.label
    badge.dataset.status = ctx.host.getAttribute('variant') ?? ''
    badge.classList.toggle('one-status', Boolean(badge.dataset.status))
  } }
}

export function choices(ctx: Context): View {
  const { host, root } = ctx
  const group = element('fieldset', 'one-choice-group')
  group.setAttribute('role', 'group')
  const content = slot()
  const labels = options(host, ['Accept:accept', 'Decline:decline'])
  const validRole = /^(action|accept|decline|destructive|neutral)$/
  const roles = (host.getAttribute('roles') ?? '').split(',').map(part => part.trim())
  for (const [index, option] of labels.entries()) {
    const match = /^(.+):\s*(action|accept|decline|destructive|neutral)$/.exec(option)
    const name = match ? match[1].trimEnd() : option
    const explicitRole = validRole.test(roles[index] ?? '') ? roles[index] : undefined
    const item = button('one-btn')
    item.dataset.oneRole = match?.[2] ?? explicitRole ?? 'neutral'
    item.textContent = name
    item.addEventListener('click', () => {
      if (!ctx.locked) { host.setAttribute('value', name); ctx.emit('one-action', name, { index }) }
    })
    content.append(item)
  }
  group.append(content)
  root.append(group)
  group.addEventListener('click', event => {
    if (ctx.locked) { event.preventDefault(); event.stopImmediatePropagation(); return }
    const target = event.composedPath().find(el => el instanceof HTMLElement && el.localName === 'button' && host.contains(el))
    if (target instanceof HTMLButtonElement) {
      const value = target.value || target.textContent?.trim() || ''
      host.setAttribute('value', value); ctx.emit('one-action', value)
    }
  }, true)
  return { update() {
    group.disabled = ctx.locked
    group.setAttribute('aria-label', ctx.label)
    group.setAttribute('aria-disabled', String(ctx.locked))
    content.toggleAttribute('inert', ctx.locked)
  } }
}

export function disclosure(ctx: Context): View {
  const { host, root, entry } = ctx
  const modal = entry.slug === 'dialog'
  const trigger = button('one-btn')
  const triggerText = slot('trigger')
  trigger.append(triggerText)
  const panel = modal ? element('dialog', 'one-dialog') : element('div', 'one-popover')
  if (!modal) { panel.setAttribute('popover', 'auto'); panel.setAttribute('role', 'group') }
  panel.id = 'disclosure'
  trigger.setAttribute('aria-controls', panel.id)
  if (modal) trigger.setAttribute('aria-haspopup', 'dialog')
  const heading = element('h2', 'one-section-title')
  heading.id = 'title'
  panel.setAttribute('aria-labelledby', heading.id)
  const body = element('div', 'one-panel-body')
  const close = button('one-btn')
  close.dataset.oneRole = 'neutral'
  close.textContent = 'Close'
  body.append(heading, slot(), close)
  panel.append(body)
  root.append(trigger, panel)
  const nativePopover = !modal && typeof panel.showPopover === 'function'
  if (!modal && !nativePopover) panel.hidden = true
  let shown = false
  let opener: HTMLElement | null = null
  function restore() {
    if (opener?.isConnected) opener.focus({ preventScroll: true })
    opener = null
  }
  const setOpen = (open: boolean) => {
    if (host.hasAttribute('open') === open) return
    host.toggleAttribute('open', open)
    ctx.emit('one-toggle', open)
  }
  trigger.addEventListener('click', () => {
    if (ctx.locked) return
    if (!shown) trigger.focus({ preventScroll: true })
    setOpen(!shown)
  })
  close.addEventListener('click', () => setOpen(false))
  panel.addEventListener('close', () => {
    if (modal && !(panel as HTMLDialogElement).open) setOpen(false)
  })
  panel.addEventListener('toggle', event => {
    if (nativePopover && (event as ToggleEvent).newState === 'closed' && !panel.matches(':popover-open')) setOpen(false)
  })
  // Older engines keep the same disclosure controls and light-dismiss behavior.
  function outside(event: Event) {
    if (shown && !event.composedPath().includes(host)) setOpen(false)
  }
  if (!modal && !nativePopover) {
    host.ownerDocument.addEventListener('pointerdown', outside)
    root.addEventListener('keydown', event => {
      if (shown && event.key === 'Escape' && !event.defaultPrevented && !event.isComposing) {
        event.preventDefault(); event.stopPropagation(); setOpen(false)
      }
    })
  }
  function activeElement(): HTMLElement | null {
    let node = host.ownerDocument.activeElement
    while (node?.shadowRoot?.activeElement) node = node.shadowRoot.activeElement
    return node as HTMLElement | null
  }
  return { update() {
    trigger.disabled = ctx.locked
    triggerText.textContent = host.getAttribute('trigger-label') || ctx.label
    heading.textContent = ctx.label
    const open = host.hasAttribute('open')
    trigger.setAttribute('aria-expanded', String(open))
    if (shown === open) return
    shown = open
    if (open) opener = activeElement() ?? trigger
    if (modal) {
      const dialog = panel as HTMLDialogElement
      if (open && !dialog.open) dialog.showModal()
      else if (!open && dialog.open) dialog.close()
    } else if (!nativePopover) panel.hidden = !open
    else if (open) {
      // PopoverOptions.source is newer than the TypeScript 5.9 DOM declarations.
      const show: (options: { source: HTMLElement }) => void = panel.showPopover.bind(panel)
      show({ source: trigger })
    }
    else if (panel.matches(':popover-open')) panel.hidePopover()
    if (!open) restore()
  }, dispose() { host.ownerDocument.removeEventListener('pointerdown', outside) } }
}
