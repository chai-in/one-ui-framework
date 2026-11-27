# One UI v1.0 — Modern Web Platform, CSS Baseline & Core Web Vitals

This reference synthesizes One UI's aesthetic and accessibility contract with Google Chrome / web.dev Baseline web standards, Tailwind CSS v4, and accessible headless component architecture.

## 1. Modern CSS Baseline Primitives (Prefer Native Over JS Shims)

### Cascade Layers & `light-dark()` Theming
Use `platforms/web/one-tokens.css` (generated from `one.tokens.json`):
- Declare `@layer one.tokens, one.base, one.components, one.utilities;` so token specificity is predictable.
- Use `color-scheme: light dark;` with `light-dark(<light>, <dark>)` so system preference works out of the box and `[data-one-theme="light"|"dark"]` overrides cleanly with one property (`color-scheme`).
- Exact sRGB hex tokens guarantee WCAG 2.2 luminance compliance; OKLCH coordinates are documented alongside tokens for perceptual tinting and wide-gamut checks (never alter a verified semantic pair without recalculating contrast).

### Container Queries (`@container`) & Subgrid
- Prefer **component-level responsiveness** (`container-type: inline-size`) over brittle viewport media queries for reusable cards, sidebars, toolbars, and action groups.
- Stack choice groups automatically when their container narrows below readable button width (`@container (inline-size < 22rem)`).
- Use `grid-template-rows: subgrid` when sibling cards in a row must align headers, figures, and footer actions without manual fixed heights.

### State-Driven Styling with `:has()`
- Style parent field wrappers on invalid/focus states (`:has(:user-invalid)`, `:has(:focus-visible)`) and adjust layouts based on slot presence without redundant React/DOM state booleans.

### Native Top-Layer Primitives: `<dialog>`, Popover API, Invoker Commands & Anchor Positioning
- **Modal dialogs:** Use native `<dialog>` with `showModal()` (or a headless primitive wrapping top-layer semantics) for built-in inertness, backdrop, and Escape handling. Always honor One UI's one-layer-per-Escape stack (`ONE-19`).
- **Non-modal popovers & hints:** Use the native `popover` attribute (`popover="auto"` for light-dismiss menus/pickers, `popover="hint"` for non-modal supplementary tooltips when supported, with graceful fallback) to eliminate z-index wars.
- **Invoker Commands (`commandfor` / `command`):** Prefer declarative `<button commandfor="history-dialog" command="show-modal">` where Baseline support covers the target browsers, keeping progressive enhancement handlers where broader browser support is required.
- **CSS Anchor Positioning:** Use `anchor-name`, `position-anchor`, and `position-try-fallbacks: flip-block, flip-inline` (plus `@container anchored()` for directional caret flips) to position popovers/tooltips without JS ResizeObserver/FloatingUI loops, falling back cleanly when unsupported.

### View Transitions (Reduced-Motion Gated)
- Wrap state transitions (`document.startViewTransition`) or MPA routes (`@view-transition { navigation: auto; }`) ONLY when `prefers-reduced-motion: no-preference` is active.
- Keep utility view-transition durations `<= 200ms` with `var(--one-ease)`. Never slide or conceal reading text during routine updates.

### Modern Layout & Typography Polish
- Use logical properties everywhere (`inline-size`, `block-size`, `padding-inline`, `margin-block`, `inset-inline-start`) so RTL (`dir="rtl"`) works without duplicated stylesheets.
- Apply `text-wrap: balance` to short headings (`display`, `pageTitle`, `section`) and `text-wrap: pretty` to reading paragraphs (`max-inline-size: 72ch`).
- Use `scrollbar-gutter: stable` on primary scrolling panes to prevent horizontal layout jumps when content grows.
- Use `content-visibility: auto; contain-intrinsic-size: auto 64px;` on long read-only lists/histories when not breaking anchor measurement (`ONE-19`).
- Use `font-variant-numeric: tabular-nums` on timestamps, counters, table columns, and sensor measurements.

## 2. Core Web Vitals Budget (Design-Time Enforcement)

| Metric | Target (p75) | Mandatory One UI Engineering Rules |
| --- | --- | --- |
| **LCP** (Loading) | `<= 2.5s` | Bundle local Inter Variable (no runtime Google Fonts round-trip); preload primary WOFF2 (`as="font" crossorigin`); never set `loading="lazy"` on LCP hero media; set `fetchpriority="high"` on LCP image. |
| **INP** (Interactivity) | `<= 200ms` | Never block the main thread > 50ms on click/input; show immediate button loading state without layout shift; yield heavy list/filter work (`scheduler.yield()` / chunking); avoid `transition-all` layout recalculations. |
| **CLS** (Stability) | `<= 0.1` | Declare `width`/`height` or `aspect-ratio` on all media/charts; reserve space for async status banners or render in top-layer overlays; retain exact button width during loading; use metric-matched fallback font descriptors (`size-adjust`) or `font-display: swap/optional`. |

## 3. Tailwind CSS v4 Architecture

Tailwind v4 is **CSS-first** (no `tailwind.config.js`). Import One UI's generated tokens and `@theme inline` bridge:

```css
@import "tailwindcss";
@import "./one-tokens.css";
@import "./one-tailwind-v4.css";
```

- Style components using `bg-one-action text-one-on-action hover:bg-one-action-hover active:bg-one-action-active`, `bg-one-surface text-one-text-primary`, `border-one-border-control`, etc.
- Always pair every fill utility with its matching foreground token (`bg-one-accept text-one-on-accept`).
- Never use `disabled:opacity-50`. Use `disabled:bg-one-disabled-fill disabled:text-one-disabled-text disabled:cursor-not-allowed`.
- Never use arbitrary pixel spacing off the 4px grid (`mt-[13px]`) or unmapped palette utilities (`bg-indigo-500`).

## 4. Semantic HTML, ARIA Rule #1 & Headless Primitives

1. **Rule #1 of ARIA:** Never recreate native elements with `<div>` + `role`. Use `<button type="button">`, `<a href>`, `<label for>`, `<fieldset>`/`<legend>`, `<table>`/`<th scope>`, `<main>`, `<nav>`, `<header>`.
2. **Headless primitives for complex widgets:** Never hand-roll focus traps, roving tabindex, typeahead, or combobox/select/menu/tabs/dialog keyboard contracts. Use:
   - **React:** React Aria Components or Radix UI Primitives (or Base UI)
   - **SolidJS (e.g. OpenBot):** Kobalte (`@kobalte/core`)
   - **Plain HTML/MPA:** Native `<dialog>`, `[popover]`, `<details>`/`<summary>`, `<select>`
3. **Never strip accessibility props** when styling headless primitives. Bind styles to real state attributes (`[data-selected]`, `[data-focus-visible]`, `[data-disabled]`, `[aria-busy="true"]`, `[aria-invalid="true"]`).
4. **Progressive enhancement:** Core forms, links, and reading views must expose readable content and semantic actions even before heavy client hydration completes.
5. **RTL & mixed direction:** Sync `dir` and `lang` on `<html>` and every portal root; wrap code/paths/URLs/numbers in `dir="ltr"` and isolate user-supplied names with `<bdi>`.

For standalone semantic buttons, fields, dialogs, and focus rings, import the reference primitives after the generated tokens. [Web primitives](../assets/one-primitives.css)

For a searchable collection, put the query, filters and count in a `.one-toolbar`. Apply `.one-collection` to the list and tune `--one-collection-min` to the content. For exact comparisons, use a native `.one-table` with scoped headers, a caption and `data-one-numeric` on numeric headings and values. A wide table can scroll inside a named, keyboard-focusable `.one-table-region`. [Layout stylesheet](../assets/one-layout.css)
