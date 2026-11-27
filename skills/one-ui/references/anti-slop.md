# One UI v1.0 — Anti-Slop & Visual Craft Guardrails

AI-generated interfaces fail when they default to loud marketing templates, redundant copy, decorative chrome, and fake polish. One UI interfaces are quiet, legible tools built to be **used, not admired for filler**.

Choose the screen structure from the work people do. Align shared attributes in rows for comparison. Give visual items consistent previews when the image helps people recognize them. Use space and alignment to group controls with their values. Keep a draft or selection when the layout changes, and keep the reason for an empty result near its recovery action. [Fluent layout](https://fluent2.microsoft.design/layout) · [Android adaptive layouts](https://developer.android.com/develop/adaptive-apps/guides/canonical-layouts) · [Carbon empty states](https://www.carbondesignsystem.com/building-blocks/core/patterns/empty-states)

## 1. Interface Copy (Cut First, Write Little)

- **No eyebrow label spam:** Delete tiny ALL-CAPS letter-spaced tags or dot-pills above headings (`"FEATURES"`, `"● WORKSPACE"`). The heading already names the section.
- **No decorative numbering:** Cut `"01 // Overview"`, `"02 // Metrics"` unless the sequence is a real user-followed workflow (checkout steps, ordered setup).
- **No subtitle reflex:** Cut reflexive taglines under every heading or menu item (`"Analytics — Understand your data better"`). Keep a subtitle only when it adds a concrete fact the heading does not state.
- **No botsplaining or cutesy errors:** Delete `"Click the button below to get started"` and `"This chart shows weight over time"`. Never write `"Oops!"`, `"Whoops!"`, or exclamation-mark error banners. State what happened and the concrete recovery step in 1–2 plain sentences.
- **No leaked design notes:** Cut `"(updates in real time)"`, `"(powered by AI)"`, or implementation explanations from production UI copy.
- **No chained metadata strings:** Avoid `"12 items · Updated 2m ago · Synced · v2.1"`. Show the one fact the user acts on; drop the rest or place it where relevant.
- **No redundant field labeling:** Keep one persistent visible label per field. Cut placeholders that repeat the label (format examples like `name@company.com` or real constraints like `At least 12 characters` stay).
- **Keep headings crisp:** App screen headings, card titles, and labels stay concise (`<= 5` words where natural), sentence case, never all-caps body copy.

## 2. Decorative Chrome & Fake State

- **Real-state test:** A badge (`LIVE`, `NEW`, `Beta`, `Synced`) or status dot may exist **only** if bound to live, real application data/state. Static decorative pills and pulsing dots (`animate-pulse` on green dots) are forbidden.
- **No icon-in-a-tinted-box feature cards:** Do not wrap generic decorative pictographs inside pastel rounded squares above every card or navigation item. Icons stay when they are the control itself (with accessible name), carry distinct semantic meaning (status/action cue), or form a consistent action-menu column (edit/copy/delete).
- **No nested card soup:** Do not put rounded bordered cards inside rounded bordered cards inside rounded panels. Use calm whitespace and hairline `borderSubtle` rules when a subgroup has no independent surface role.

## 3. Surface, Color & Typography Discipline

- **No hue-to-hue gradients or glows:** Never apply purple/blue/neon gradients (`bg-gradient-to-r`, `bg-clip-text`), colored drop shadows (`shadow-indigo-500/40`), or blurred floating color blobs behind content. One UI uses flat opaque semantic fills on pure neutral surfaces.
- **No extra-heavy weights:** Never use `800`/`900` (`font-extrabold`, `font-black`, `.heavy`, `.black`). One UI's signature hierarchy relies on light-to-medium Inter Variable (`300` display, `400` title/section/reading, `500` heading/control) plus clear spacing and contrast.
- **No off-grid spacing:** Never invent arbitrary gaps like `13px`, `11px`, or `7px`. Snap to the 4px spacing scale (`0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64`).
- **No unrequested dark-mode neon or global yellow tint:** Dark mode is calm neutral `#000000` / `#191919` / `#212121` with Oat reserved for standalone actions and focus rings—never bathe the whole app in yellow or glowing borders.

## 4. Charts & Data Visualization

- **Name the data, not the chart type:** `"Monthly weight"` instead of `"Line chart of monthly weight"`. Use a finding title only for static reports, never for live data that can go stale.
- **Keep instructions that carry information.** Remove captions that merely name a visible encoding. Explain unusual units, gaps, sampling limits or an interaction essential to retrieving a value.
- **Match labels to the decision.** Use shape for trend, printed values for exact decisions, and a dated data alternative. Remove repeated values when they add no information. Redundant cues can help distinguish series without hue.
- **Faintest scaffolding:** Remove heavy plot frames, dense dark gridlines, 3D effects, drop shadows, and glowing series strokes. Data first, labels second, hairline gridlines faintest.
- **Label near the data.** Place labels by their marks when they fit at the narrowest supported size. Use an accessible key or table when labels would overlap or obscure the data.
- **Accessible alternatives:** Every chart exposes title, units, time span, sample limitations (e.g., intermittent samples vs. continuous), and an equivalent dated text/table route.

## 5. Motion Discipline

- **No marketing scroll choreography in working apps:** No parallax, pinned scroll chapters, wheel hijacking, forced scroll-snap in transcripts, ambient shimmer/waveforms, or `650ms` staggered reveals.
- **No `transition-all` or bouncy springs:** Transition only explicit visual properties (`background-color`, `border-color`, `color`, `opacity`) within `150ms–200ms` (`<= 300ms` max) using `cubic-bezier(.3, .06, .06, .79)`.
- **Text available immediately:** Never hide readable copy behind entrance animations.
