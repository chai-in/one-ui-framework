# One UI v1.0 — Apple Platforms (iOS, macOS, watchOS SwiftUI + HIG)

One UI on Apple platforms is **100% native SwiftUI** (plus UIKit/AppKit bridges only where platform APIs require them, such as camera previews). Never ship a web-wrapper look or transplant CSS breakpoints/ARIA attributes into SwiftUI.

## 1. Native Chrome vs. App Content Boundary

- **OS-owned chrome retains Apple geometry, materials, and semantics:** `NavigationStack`, `TabView`, `Form`, `List`, `Menu`, `DatePicker`, `Toggle`, `Alert`, `ConfirmationDialog`, `Sheet`, `Toolbar`, system status bar, and `SF Symbols`. Do not force One UI hex fills into system alerts or replace native navigation bars.
- **App content uses One UI semantic tokens:** Generated `OneColor`, `OneTypography`, `OneSpace`, `OneRadius`, `OneLayout`, and `OneMotion` from `OneDesignTokens.generated.swift` (plus optional `Design.xcassets` named colors).
- **Extend native `Button` via `ButtonStyle`:** Never replace `Button` with `.onTapGesture` on a `Text`/`RoundedRectangle`—native `Button` preserves VoiceOver traits, Switch Control, keyboard activation, press cancellation, and haptic/platform feel.

## 2. Action Roles & Border Policy in SwiftUI

- Map the four action roles cleanly via the reference [OneButtonStyle](../assets/OneControls.swift):
  - `.action` (Oat `#DFD49A` / `#000000`)
  - `.accept` (Evergreen `#3F7057` / `#FFFFFF`)
  - `.decline` (Soft red `#D99090` / `#000000`)
  - `.destructive` (Muted red `#AD4648` / `#FFFFFF`) — ALWAYS also attach SwiftUI `Button(role: .destructive)` so system confirmations and assistive technologies receive native destructive semantics.
  - `.neutral` (Light `#FFFFFF`/`#000000`, Dark `#191919`/`#FFFFFF` with `1pt borderStrong` edge, `2pt borderHighContrast` under Increase Contrast).
- **Borderless filled-action default:** Filled `.action`, `.accept`, `.decline`, and `.destructive` buttons omit decorative borders in both appearances (owner-approved refinement). Retain essential boundaries on editable `TextField`/`SecureField`/`TextEditor` (`1pt borderControl`, strengthening to `2pt borderHighContrast` when `@Environment(\.colorSchemeContrast) == .increased`).
- **Focus ring:** On keyboard/focusable custom controls, draw a `2pt` ring (`3pt` when `colorSchemeContrast == .increased`) outside a `2pt` separating gap (`OneColor.focus` / `OneColor.focusGap`), without clipping.
- **Never dim via `.opacity(0.5)`:** Use opaque `OneColor.disabledFill` and `OneColor.disabledText` when `!isEnabled`. During loading, keep the role fill, label meaning, and full width, display a foreground-tinted `ProgressView`, and guard duplicate taps without dimming the parent `Form`.

## 3. Typography, Dynamic Type & Accessibility Environments

Read and honor these SwiftUI environment values across all Apple targets:

| Environment | One UI Requirement |
| --- | --- |
| `\.dynamicTypeSize` | Always use `Font.custom("InterVariable", size: ..., relativeTo: ...)` (never fixed `.system(size:)`). Wrap/stack controls vertically at accessibility sizes; never shrink text (`minimumScaleFactor`) to cram an overfull layout. |
| `\.legibilityWeight` | Allow Bold Text to strengthen weights without clipping or truncating labels. Keep light editorial headings only where legible. |
| `\.colorSchemeContrast` | Under `.increased`: editable field borders become `2pt` `borderHighContrast` (black light / white dark); custom focus rings thicken to `3pt`. |
| `\.accessibilityDifferentiateWithoutColor` | Labels, checkmarks, and distinct SF Symbols always carry decision/status meaning without relying on hue (critical because Evergreen vs. Muted red is `1.02:1` luminance). |
| `\.accessibilityReduceTransparency` | Render app content and chart annotations on opaque One UI surfaces (`surface`, `surfaceRaised`) rather than unverified blur/photo backdrops. |
| `\.accessibilityReduceMotion` | Pass `reduceMotion` into `OneMotion.standard(reducedMotion:)`; disable programmatic scroll/page animations, stop ambient pulses/metronomes, keep all state visible. |

- Use `.monospacedDigit()` on all numbers, timestamps, timers, and sensor readouts.
- Measure custom touch targets `>= 44 × 44 pt` with `>= 8 pt` separation between adjacent custom actions.
- Cap reading prose width at `40em` (`OneLayout.readingMaxWidth = 640pt` at default 16pt body) on wide iPad/macOS screens; let Dynamic Type wrap naturally.

## 4. iOS Ergonomics
- Status bar appearance follows active light/dark `colorScheme`—never force light status text onto a light canvas.
- Preserve recoverable drafts across navigation/backgrounding; block accidental swipe-to-dismiss on sheets when a draft save fails.
- For narrow toolbars (e.g., person/account badges), prioritize readable name text, omit decorative chevrons at accessibility text sizes, and expose the full identity in `.accessibilityLabel`.
- Keep OTP/verification code fields compatible with `.textContentType(.oneTimeCode)` and paste/autofill. Sensitive recovery codes require deliberate reveal, never auto-copy to clipboard, and hide on background/dismissal.

## 5. watchOS Ergonomics (Distilled from CS20D Health v0.2)
- **Focused vertical task pages, never an all-features scrolling home:** Organize top-level domains as horizontal native categories (e.g., Heart / Workouts / Sensors) with vertical `TabView(.verticalPage)` task pages navigated via Digital Crown or vertical swipe.
- **Glanceable default, accessible fallback:** Default pages stay concise and glanceable. At large accessibility text sizes, drop only optional decorative sparklines first and allow page-local scrolling within that single task page—never shrink required metrics or collapse back into one long home screen.
- **Full-width primary actions:** Main Watch actions span available width with `>= 44pt` height and wrapping labels.
- **Always On & Privacy:** Apply `.privacySensitive()` to private health/account values. When `@Environment(\.isLuminanceReduced)` is true or a task is paused/inactive, stop pulse animations and reduce timer update cadence.
- **Explicit workout/task endings:** Keep `End` as a dedicated destination (or explicit confirmation) with clear `Accept` (Save), `Destructive` (Discard), and `Neutral` (Keep going / Cancel) choices—no silent auto-save or ambiguous close X.
- **VoiceOver discipline:** Spell out units ("beats per minute", not raw "BPM" if ambiguous), never continuously announce ticking timers or every periodic heart-rate sample, and announce meaningful state transitions once.

## 6. macOS Ergonomics
- Support pointer hover tonal states (`actionHover`, `acceptHover`, `declineHover`, `destructiveHover`, `neutralHover`) via `.onHover`.
- Support keyboard navigation, standard shortcuts (`Cmd+F` search in active reading views, `Esc` one-layer dismissal, Return never bound to destructive action).
- Use `NavigationSplitView` with collapsible inspector/detail panes; never require a third pane to complete a primary task.
- Opt-in compact density (`36pt` controls, `40pt` rows) is allowed on pointer-driven macOS views only when adjacent spacing and target separation remain clear.
