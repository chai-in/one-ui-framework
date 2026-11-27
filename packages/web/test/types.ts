import { ONE_TAG_MAP, registerOneUI, type OneElement, type OneEventDetail } from '@one-ui/web'

const host: OneElement = document.createElement('one-bloom-toggle')
host.checked = true
host.addEventListener('one-toggle', event => {
  const detail: OneEventDetail<boolean> = event.detail
  return detail.value
})
document.createElement('one-download-ring').addEventListener('one-complete', event => {
  return event.detail.value.toFixed(0)
})
const ctor: CustomElementConstructor = ONE_TAG_MAP['one-detent-dial']
registerOneUI(customElements)
void ctor
