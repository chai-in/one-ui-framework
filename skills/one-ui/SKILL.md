---
name: one-ui
description: >-
  Build, adapt, or audit One UI interfaces on the web, Apple platforms, Android Compose,
  and Flutter. Use for semantic action roles, accessible color presets, Kinetic UI
  Moments, interruptible springs, platform token generation, accessibility checks,
  and upstream design feedback.
---

# One UI v1.0 — Agent Design & Verification Skill

One UI is a calm, editorial, agent-first cross-platform design system: neutral white/black canvases, light editorial headings (local Inter Variable), thin rules, semantic action roles, native platform semantics, and verifiable accessibility.

> **Evidence honesty rule:** Mathematical contrast checks, static audits, and successful builds never certify rendered contrast, compositing, keyboard flow, VoiceOver, or physical device behavior. Report each verification tier honestly and separately.

## Quick Reference Map (Progressive Disclosure)

Read only the reference files needed for your current task:

| Need | Read |
| --- | --- |
| Exact hex/OKLCH palette, choice-group grammar, borders, status & categories | [references/color-and-actions.md](references/color-and-actions.md) |
| Chrome/web.dev CSS Baseline, Core Web Vitals, Tailwind v4, React Aria / Radix / Kobalte | [references/web-modern.md](references/web-modern.md) |
| Native iOS, macOS, and watchOS SwiftUI + Apple HIG + Always On / Dynamic Type | [references/apple-swiftui.md](references/apple-swiftui.md) |
| 10-state matrix, keyboard/focus contracts, 10 acceptance checks, WCAG 2.2 AA | [references/states-and-a11y.md](references/states-and-a11y.md) |
| Anti-slop guardrails (copy, decorative chrome, charts, surface, motion) | [references/anti-slop.md](references/anti-slop.md) |
| Append-only logs, chat/history scroll anchors, overlay dismissal stack | [references/reading-and-history.md](references/reading-and-history.md) |
| Machine-readable canonical tokens | [assets/one.tokens.json](assets/one.tokens.json) |
| Kinetic gestures, keyboard patterns and reduced-motion behavior | [references/kinetic-moments.md](references/kinetic-moments.md) |
| Core controls and moment IDs, attributes, events and spring presets | [assets/catalog.json](assets/catalog.json) |
| User design feedback, public issue deduplication, and baseline triage | [references/feedback-loop.md](references/feedback-loop.md) |

## Core laws (ONE-01 to ONE-28)

Cite these stable IDs when auditing or explaining changes:

### Color, Meaning & Surfaces
- **ONE-01 Semantic tokens only.** Use semantic roles (`action`, `accept`, `decline`, `destructive`, `neutral`, `surface`, `textPrimary`, etc.) at every call site; never hardcode raw hex/RGB or arbitrary Tailwind palette classes in feature code.
- **ONE-02 Action choice-group grammar.**
  - **Action (Oat `#DFD49A` / black):** standalone invitations, navigation CTAs, and app-owned informational notification actions *only when no green/red decision belongs in that choice group*.
  - **Accept (Evergreen `#3F7057` / white):** explicit Yes, Accept, Confirm, Save.
  - **Decline (Soft red `#D99090` / black):** ordinary refusal (No, thanks) without data loss.
  - **Destructive (Muted red `#AD4648` / white):** Delete, Discard, irreversible data loss; never the default Return action.
  - **Neutral:** Back, Close, Cancel, supporting actions.
  - Valid groups: `Accept + Decline` (Yes/No); `Accept + Destructive` (Save/Discard); `Destructive + Neutral` (Delete/Cancel). Never inject Oat into a green/red group.
- **ONE-03 Separate status and category namespaces.** Status (`success`, `warning`, `danger`, `info`) and category (`categoryBlue`, `categoryLavender`, `categoryGreen`) are independent of actions. Yellow never means warning by itself. Assign category domain meanings once in the adapter/generator.
- **ONE-04 Calm surfaces and quiet elevation.** Neutral white/black canvas, quiet surfaces, thin rules for structure, no shadow on base surfaces, no nested rounded cards at every level.
- **ONE-05 Filled-action border policy.** Filled custom action boxes omit decorative borders by default (`borderless-filled`), while neutral secondary buttons, essential editable fields (`borderControl` 1px -> `borderHighContrast` 2px under Increase Contrast), and full focus rings remain explicit.
- **ONE-06 Non-color decision cues.** Evergreen and Muted red have only `1.02:1` luminance separation; action names, distinct icons, and semantic roles carry primary meaning in grayscale and under Differentiate Without Color.

### States, Accessibility & Interaction
- **ONE-07 Complete 10-state contract.** Cover default, hover, pressed, focus-visible, selected, loading, disabled, error, empty/unavailable/partial, and cancelled/completed—plus offline recovery and destructive confirmation where applicable.
- **ONE-08 No opacity dimming for states.** Never use whole-control or whole-form opacity (`opacity-50`, `.opacity(0.5)`) to invent disabled or loading states. Use opaque `disabledFill`/`disabledText` for disabled; keep role fill, label meaning, and width during loading with a foreground-colored spinner and repeat-activation guard.
- **ONE-09 Contrast thresholds without rounding up.** All app text (including light editorial headings) targets `>= 4.5:1`; essential UI boundaries, icons, and focus cues target `>= 3:1` against adjacent surfaces. Compare unrounded WCAG 2.2 ratios.
- **ONE-10 Native semantics & ARIA Rule #1.** Use native `<button>`, `<a>`, `<label>`, `<dialog>`, `<form>`, and native SwiftUI controls (`Button`, `Form`, `NavigationStack`, `Alert`, `ConfirmationDialog`). Never use clickable `<div>`/`<span>`. For complex web widgets, use headless accessible primitives (React Aria, Radix UI, Kobalte).
- **ONE-11 Full perimeter focus ring.** Custom focus uses a full `2px` ring outside a `2px` separating gap (`#000000` / `#FFFFFF` light; `#DFD49A` / `#000000` dark; `3px` in Increase Contrast), never clipped or obscured by sticky headers, keyboards, or sheets. Retain native focus where the platform owns it.

### Typography, Layout & Motion
- **ONE-12 Editorial typography & scale.** Local Inter Variable (weights 300–500, max 600; no 800/900 extra-heavy weights), sentence case, tabular numerals (`font-variant-numeric: tabular-nums` / `.monospacedDigit()`) for metrics/timestamps, 45–72ch reading measure (`40em` on Apple), `>= 16px` on editable touch inputs.
- **ONE-13 4px spacing & target minimums.** Snap spacing to the 4px scale (`0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`). Comfortable density (`44px` control/icon target, `48px` row) is default; coarse-pointer targets stay `>= 44x44` with `>= 8px` gap between adjacent custom actions. Use logical properties (`inline`/`block`).
- **ONE-14 Motion ceiling & reduced motion.** Easing `cubic-bezier(.3, .06, .06, .79)`, `150ms` fast / `200ms` standard / `<= 300ms` max utility duration. Never use `transition-all`, ambient shimmer/bounce, or reveal concealment. Honor `prefers-reduced-motion: reduce` and Apple Reduce Motion by removing translation/scroll/ambient motion while keeping state visible.

### Modern Web & Core Web Vitals
- **ONE-15 Modern CSS Baseline first.** Prefer `@container` queries, `:has()`, Subgrid, `light-dark()`, native Popover API + `<dialog>` + Invoker Commands, CSS Anchor Positioning, and reduced-motion-gated View Transitions over heavy JS layout/positioning shims.
- **ONE-16 Core Web Vitals budget.** Maintain `LCP <= 2.5s` (local preloaded Inter Variable, no lazy-loaded hero), `INP <= 200ms` (no long main-thread UI blocks), `CLS <= 0.1` (explicit dimensions/aspect ratios, fixed-width loading buttons, zero-shift banners).

### Anti-Slop & Integrity
- **ONE-17 No decorative gradients, glows, or fake glass.** Flat opaque semantic fills on neutral surfaces; no hue-to-hue button gradients, `bg-clip-text`, colored drop-shadow glows, or unverified translucent backdrops under text.
- **ONE-18 Plain, truthful copy.** No eyebrow pill spam, decorative `01/02/03` numbering, botsplaining subtitles, fake `"LIVE"`/`"NEW"` badges, pulsing decorative dots, or `"Oops!"` error messages. State concrete facts, problems, and next actions.
- **ONE-19 Reading anchor & overlay stack.** Append-only lists preserve a stable loaded boundary and restore the first visible record ID + offset (within 1px/1pt) across structural updates. One Escape dismisses one layer: `listbox/menu -> preview -> dialog/sheet -> workspace`, restoring focus to the exact opener.
- **ONE-20 Stale-result scope guards.** Bind async results to their owner/generation token; closing or switching views rejects late results. Failed reads retain loaded data; retries never silently re-execute writes or destructive actions.

### Apple Native Platforms
- **ONE-21 Native Apple ergonomics.** On iOS, macOS, and watchOS, use native SwiftUI chrome and Dynamic Type (`relativeTo:` scaling, never fixed `.system(size:)` for body/labels), support Bold Text, Increase Contrast, Reduce Transparency, and VoiceOver/Switch Control.
- **ONE-22 watchOS glanceability & privacy.** Use focused vertical task pages (Digital Crown/swipe), never an all-features scrolling home; redact sensitive values with `.privacySensitive()`, slow dimmed timers, and allow page-local scrolling at large accessibility sizes instead of shrinking text.
- **ONE-23 macOS desktop precision.** Support pointer hover, keyboard shortcuts, split-view/inspector collapsing, and opt-in compact density (`36pt`) only where spacing and pointer precision are verified.
- **ONE-24 Honest acceptance reporting.** Distinguish (1) token arithmetic, (2) static code audit, (3) rendered browser/simulator inspection, and (4) assistive/device acceptance. Never claim a higher tier from a lower tier's pass.

### Kinetic motion

- **ONE-25 Composited motion.** Animate transform and opacity on a visual child. Keep geometry, hit targets and focus rings stable.
- **ONE-26 Interruptible motion.** Accept a second input while settling. Retarget from the current position and velocity and keep semantic state independent of animation completion.
- **ONE-27 Purposeful feedback.** Tie motion to selection, a value change, an action, or real progress. Stop repeating indicators when the operation settles.
- **ONE-28 Reduced-motion parity.** Preserve actions, values, focus and announcements. A reduced-motion request settles the state immediately, including a spring already in flight.

## Operational Workflows

### Workflow A: Building or Refactoring UI
1. **Identify target platform(s)** (Web / iOS / macOS / watchOS / Compose / Flutter) and read the matching `references/*.md` file(s).
2. **Sync tokens first.** Ensure the project derives styles from `one.tokens.json` via `scripts/generate_tokens.py` (never duplicate hex codes by hand).
3. **Choose semantic roles & primitives.** Map actions via `ONE-02`, select native HTML / headless primitives (`ONE-10`) or native SwiftUI controls (`ONE-21`), and plan all 10 states (`ONE-07`).
4. **Implement cleanly.** Apply the relevant laws through `ONE-28`: logical properties, container queries / Dynamic Type, reduced motion, no slop.
5. **Run automated checks** (see Verification Protocol below) and fix all errors before finishing.

### Workflow B: Auditing Existing UI
1. Run the static auditor:
   ```bash
   python3 <skill_dir>/scripts/audit_ui.py <target_path>
   ```
2. Read the affected source files and evaluate semantic rules static regexes cannot judge (`ONE-02` choice groups, `ONE-06` non-color cues, `ONE-07` missing states, `ONE-18` copy/chart slop, `ONE-19`/`ONE-20` scroll anchors & stale scopes).
3. If tokens exist in the repo, verify their contrast arithmetic:
   ```bash
   python3 <skill_dir>/scripts/verify_tokens.py --tokens <path_to_tokens_json>
   ```
4. Report findings concisely as `file:line  ONE-xx  issue -> fix`, grouped by verification tier (`Static / Arithmetic / Rendered / Assistive Pending`).

### Workflow C: Capturing Design Feedback Upstream (`chai-in/one-ui-framework`)

1. Apply the user's design feedback or UI fix in the active project.
2. Extract the reusable baseline insight. Scrub the title, context, and proposal for credentials, private project details, and proprietary business information. Follow the [feedback workflow](references/feedback-loop.md).
3. Run `report_feedback.py --search "control or behavior"` and review open matches before publishing. Use `--comment-on` to add evidence to an existing thread, or file a structured issue for a distinct change.
4. Include the upstream issue link or the local draft path when reporting the result.

### Workflow D: Baseline Update Intake (Triage)

1. When updating `chai-in/one-ui-framework`, run `python3 skills/one-ui/scripts/report_feedback.py --list` before planning the update. Filter with `--label baseline-improvement` or an area or platform label.
2. Read the issue and follow-ups, choose the baseline change, and use its acceptance criteria to verify the update. Link the change to the issue and close the thread when the fix ships.

## Verification & Feedback Scripts

Run from the skill folder (`<skill_dir>`) or repo root using Python 3 standard library (zero dependencies):

```bash
# Check canonical and preset color pairs in the installed skill
python3 <skill_dir>/scripts/verify_tokens.py --tokens <skill_dir>/assets/one.tokens.json \
  --themes-dir <skill_dir>/assets/themes

# Generate only the platform files the consuming project needs
python3 <skill_dir>/scripts/generate_tokens.py \
  --out-web ./src/styles --out-swift ./Sources/OneDesignTokens.generated.swift \
  --out-android ./OneDesignTokens.generated.kt --out-flutter ./lib/one_design_tokens.g.dart

# 3. Run static UI audit on changed files or directories
python3 <skill_dir>/scripts/audit_ui.py ./src

# List open feedback for the One UI baseline
python3 <skill_dir>/scripts/report_feedback.py --list
```

`report_feedback.py` also supports `--search`, `--comment-on`, and structured issue creation through `gh`. See the [feedback workflow](references/feedback-loop.md) for examples and local drafts.

When browser preview or device simulator tools are explicitly requested for verification, check: light + dark themes, `320px` + `200%` zoom (or small phone + large Dynamic Type), keyboard focus ring visibility, Escape layer order, and `prefers-reduced-motion`. Always state clearly which checks were actually observed vs. still pending.
