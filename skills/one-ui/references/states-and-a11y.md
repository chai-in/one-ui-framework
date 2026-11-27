# One UI v1.0 — Complete State Matrix, Accessibility & Acceptance Honesty

Every interactive control and async surface must expose truthful, independent state dimensions. "Loading" is never a shortcut for "disabled", an empty page is not an empty history, and a sent request is not proof of completion.

## 1. The 10-State Contract

| State | Visual & Behavioral Rule | Accessible Outcome |
| --- | --- | --- |
| **1. Default** | Exact semantic fill/foreground; explicit verb + object label; borderless filled actions (or opt-in bordered); `1px` field/neutral borders. | Native role; accessible name matches or includes visible label. |
| **2. Hover** | Specified tonal fill on pointer hosts (`actionHover`, etc.). No critical info exists *only* on hover. | Full parity for touch, keyboard, and assistive input. |
| **3. Pressed** | Specified tonal active fill (`actionActive`, etc.). Activation fires on release/up so users can cancel by moving off. | Single intentional activation; no hold/swipe-only requirement. |
| **4. Focus-visible** | Full `2px` ring outside `2px` gap (`3px` Increase Contrast), independent of action hue, never clipped or obscured. Native focus where OS owns it. | Predictable tab/rotor order; no trap, focus theft, or destructive default Return. |
| **5. Selected / Toggled** | Exposed native/ARIA selected state + visible check/marker + `selected`/`onSelected` fill for non-action selection. Never overwrite Accept/Decline/Destructive with yellow selection tint. | Distinct from keyboard focus; announced without relying on color; no double-toggle from nested card clicks. |
| **6. Loading** | Retain semantic role, label meaning, and exact control width (zero CLS); use foreground-colored spinner; guard duplicate activation; keep a separate reachable Cancel for cancellable tasks. | Single concise busy state/announcement; never dim parent form or imply success. |
| **7. Disabled** | Opaque `disabledFill`/`disabledText` (`>= 5.82:1` light, `>= 8.12:1` dark), inactive semantics, and adjacent plain-text reason when the user needs to know why. Never whole-control opacity. | Non-activatable; adjacent explanatory text and dismiss/cancel remain readable and active. |
| **8. Error** | Persistent inline problem + recovery action with status icon (`dangerText`/`dangerFill`), programmatically linked (`aria-describedby` / native field error). Preserve all user edits and previously loaded data. | Discoverable and announced once; never color-only validation; never transient-toast-only for important failures. |
| **9. Empty / Unavailable / Partial / Offline** | Distinguish first-use empty, no-search-match, partial/limited permissions, and offline states truthfully. Retain prior cached/loaded data and offer explicit retry or recovery. | No fake zeros, no false denial/success, no loss of recoverable drafts. |
| **10. Cancelled / Completed** | Report the actual outcome and next action. Scope every pending promise/task to an owner/generation token so closing or switching views drops stale results. | Retries repeat safe reads only; never silently replay writes or destructive actions. |

## 2. Core Component-Family Keyboard Contracts

- **Button / Link:** Buttons act (`Enter` + `Space`); links navigate (`Enter`). Icon-only buttons always carry an accessible name (`aria-label` / `.accessibilityLabel`).
- **Input / Textarea / OTP:** Persistent visible `<label>` (never placeholder-only), `>= 16px` on touch inputs, linked help/error text, preserve edits on validation failure, OTP supports paste + autofill without leaking secrets.
- **Select / Dropdown / Combobox:** Selected value separate from open/focus state; arrows/Home/End/typeahead; `Escape` closes only the listbox/menu and restores focus to trigger; portal inherits theme & `dir`.
- **Checkbox / Radio / Switch / Selection Cards:** `Space` toggles; radio groups use arrow keys; card label and control share one click target with zero double-toggle.
- **Tabs vs. Segmented Control:** Use tabs for panels (one tab stop in tablist + arrow keys); use segmented control/radiogroup for selecting a value. Selected != focused.
- **Table vs. Data Grid:** Real `<th>` headers, sort state (`aria-sort`), and native table semantics for read-only tables; grid keyboard contract only for editable grids. Charts include accessible text/table alternatives with real units and time ranges.
- **Dialog / Drawer / Preview:** Explicit title, description, initial focus, modal focus containment, draft preservation on close, one-layer-per-Escape dismissal stack (`ONE-19`), exact focus restoration to opener.
- **File Upload:** Distinct states (selected, uploading, processing, complete, failed, cancelled) with keyboard picker alternative to drag-and-drop and per-file named retry/remove.
- **Notifications / Alerts:** Never steal focus, never cover focused controls, never auto-dismiss essential errors or require timed responses; avoid duplicate `aria-live` announcements.

## 3. The 10 Measurable Acceptance Checks

Every production release must track these 10 checks honestly:

1. **Contrast (`4.5:1` text / `3:1` UI/focus):** Verified in light, dark, and Increase Contrast across every actual surface, overlay, and state using unrounded WCAG 2.2 ratios.
2. **Names, semantics & associations:** Accessibility tree confirms native roles, visible-matching names, field/help/error links, units, and hidden decorative icons.
3. **Keyboard, focus & alternate input:** Complete all tasks via keyboard (and VoiceOver / Voice Control / Switch Control on Apple); modal containment, no obscured focus, exact focus return, no destructive default Return.
4. **320px / 200% zoom / Dynamic Type & localization:** No horizontal page overflow for ordinary prose/actions at `320px` and `200%` zoom (or small phone + accessibility Dynamic Type + Bold Text + translated text expansion + RTL); code/tables scroll in labeled subregions.
5. **Target size & spacing:** `>= 44×44` coarse-pointer targets with `>= 8px`/`8pt` separation between adjacent custom actions; explicit button alternatives to swipe/drag/long-press/chart gestures.
6. **Reading anchors & updates:** Prepend/append/resize while reading older items preserves surviving visible record ID and offset within `1px`/`1pt` and preserves loaded DOM/model identity.
7. **One-layer dismissal & recoverable work:** `listbox/menu -> preview -> dialog/sheet -> workspace` pops one layer per Escape/Back, restores exact opener focus, resets only transient preview state on reopen, and guards unsaved draft loss.
8. **Truthful async, offline, error & scope safety:** Injected permission/network/offline/cancel/timing failures retain prior data/edits, serialize conflicting writes, and drop stale out-of-scope results.
9. **Motion & sensory access:** Reduced Motion, Reduce Transparency, Differentiate Without Color, and color filters retain all meaning and actions; no audio-only or haptic-only state; Watch Always On privacy holds.
10. **Screen-reader output & announcements:** Logical reading/heading order, concise one-shot announcements for meaningful changes, zero continuous timer/BPM/full-list spam, and no private data leaked in notification previews.

## 4. Verification Tiers (Never Conflate)

Always report verification results with these four explicit tiers:
1. **Token Arithmetic:** [`verify_tokens.py`](../scripts/verify_tokens.py) confirms solid-color sRGB WCAG 2.2 luminance math.
2. **Static Code Audit:** [`audit_ui.py`](../scripts/audit_ui.py) and source review check token binding, native primitives, and known anti-patterns.
3. **Rendered Visual & Layout Check:** Live browser/simulator inspection at `320px`/`1440px`, light/dark, `200%` zoom, focus rings, and reduced motion.
4. **Assistive & Physical Device Acceptance:** Real screen reader (VoiceOver/NVDA), keyboard/Switch Control, Increase Contrast, RTL, and physical Watch/phone checks.

Passing Tier 1 or Tier 2 **never** checks off Tier 3 or Tier 4.
