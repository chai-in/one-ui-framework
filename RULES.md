## One UI v1.0

Copy into `AGENTS.md`, `GEMINI.md`, or `CLAUDE.md`.

Apply UI feedback locally. Check open `design-feedback` issues before sharing
scrubbed, reusable fixes on `chai-in/one-ui-framework` via `report_feedback.py`.

- **ONE-01** Bind color, type, spacing, radii and motion to semantic tokens from `one.tokens.json` (web `--one-*`).
- **ONE-02** Oat `action` stands alone. Evergreen `accept` confirms, Soft Red `decline` refuses without loss, Muted Red `destructive` deletes or discards, and `neutral` cancels or navigates back. Pair Yes/No, Save/Discard or Delete/Cancel. Never default Return to destruction.
- **ONE-03** Keep status and category tokens independent of actions. Map category meanings once per domain.
- **ONE-04** Use neutral canvases, quiet surfaces and thin rules. Keep base surfaces shadow-free.
- **ONE-05** Fill actions without borders by default. Retain field and neutral edges, 1px normally and 2px in high contrast.
- **ONE-06** Give each decision a distinct label and non-color cue.
- **ONE-07** Cover default, hover, pressed, focus-visible, selected, loading, disabled, error, empty/unavailable/partial/offline, cancelled/completed.
- **ONE-08** Use opaque disabled tokens. While loading, retain role, label and width, and guard repeat activation. Never dim controls with opacity.
- **ONE-09** Check unrounded WCAG 2.2 AA ratios on every surface. Text `>= 4.5:1`, essential UI, icons and focus `>= 3:1`.
- **ONE-10** Use native controls and accessible widget patterns. Support keyboard input and visible names.
- **ONE-11** Preserve native focus. Custom focus needs an unclipped full-perimeter 2px ring, 2px gap and 3px ring in high contrast.
- **ONE-12** Use local Inter Variable, editorial weights 300–500, tabular figures and 45–72ch lines. Touch inputs start at 16px.
- **ONE-13** Space on a 4px grid. Give touch targets at least 44×44px (44pt on Apple) and adjacent custom actions an 8px gap.
- **ONE-14** Utility motion takes 150–200ms, maximum 300ms. Transition explicit properties and honor system reduced motion.
- **ONE-15** Prefer Baseline CSS, container queries, subgrid and native overlays. Feature-detect newer primitives.
- **ONE-16** Meet Core Web Vitals at the 75th percentile (LCP <= 2.5s, INP <= 200ms, CLS <= 0.1).
- **ONE-17** Use flat fills. Omit decorative gradients, glows and fake glass.
- **ONE-18** State the outcome and next action. Remove filler copy, fake badges and decorative numbering.
- **ONE-19** Preserve the reading anchor by record ID and offset within 1px/pt. Escape closes one layer and restores its opener's focus.
- **ONE-20** Scope async results to owner and generation. Drop stale results, retain loaded data and retry only safe reads automatically.
- **ONE-21** Use native semantics, text scaling and assistive input on Apple, Android Compose and Flutter. Honor system contrast and motion settings.
- **ONE-22** On watchOS, support Crown navigation, large type and Always On privacy.
- **ONE-23** On macOS, support keyboard shortcuts, pointer precision and collapsible inspectors.
- **ONE-24** Report observed checks by tier (token math, static audit, rendered inspection, assistive/device testing).
- **ONE-25** Animate only GPU-composited `transform`, `opacity`, `clip-path` or SVG geometry. Verify compositing on target devices.
- **ONE-26** Springs must interrupt and retarget from current position and velocity.
- **ONE-27** Give each kinetic effect a function (e.g. selection, progress, confirmation).
- **ONE-28** Reduced motion settles instantly with identical actions, values, focus and announcements.

Set `ONE_SKILL` to the skill directory and add `one-ui` to PATH.

```sh
one-ui add bloom-toggle
python3 "$ONE_SKILL/scripts/verify_tokens.py"
python3 "$ONE_SKILL/scripts/audit_ui.py" .
```
