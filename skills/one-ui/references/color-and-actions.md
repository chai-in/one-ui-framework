# One UI v1.0 — Color Roles, Action Grammar & Contrast Contract

Use semantic role names at every feature call site. Palette names (`Oat`, `Evergreen`, `Soft red`, `Muted red`, `Blue`, `Lavender`, `Green`) stay strictly inside token definitions and generators.

## 1. Neutral Surfaces, Text, Boundaries & Focus

| Semantic role | Light hex | Dark hex | OKLCH (Light / Dark) | Purpose |
| --- | --- | --- | --- | --- |
| `canvas` | `#ffffff` | `#000000` | `L=1.000` / `L=0.000` | Page or screen ground |
| `surface` | `#ffffff` | `#191919` | `L=1.000` / `L=0.213` | Primary panel, card, dialog |
| `surfaceSubtle` | `#f4f4f4` | `#191919` | `L=0.967` / `L=0.213` | Supporting secondary region |
| `surfaceRaised` | `#eaeaea` | `#212121` | `L=0.937` / `L=0.248` | Inset field or raised neutral region |
| `textPrimary` | `#000000` | `#ffffff` | `21.00:1` on canvas | Body copy, headings, required labels |
| `textSecondary` | `#595959` | `#c8c8c8` | `>= 5.82:1` all surfaces | Metadata, help text, timestamps |
| `textMuted` / `placeholder` | `#595959` | `#959595` | `>= 5.38:1` all surfaces | Supporting text; placeholder never replaces label |
| `borderSubtle` | `#dedede` | `#323232` | Decorative only | Hairline dividers and quiet structure |
| `borderControl` | `#828282` | `#828282` | `>= 3.19:1` all surfaces | Essential editable field & control edges |
| `borderStrong` | `#595959` | `#959595` | `>= 5.38:1` all surfaces | Neutral secondary actions & optional action edge |
| `borderHighContrast` | `#000000` | `#ffffff` | `>= 16.10:1` all surfaces | 2px Increase Contrast / `prefers-contrast: more` |
| `selected` / `onSelected` | `#fbf5ce` / `#000000` | `#464029` / `#ffffff` | `19.05:1` / `10.37:1` | Non-action selection + check/marker + ARIA/native trait |
| `focus` / `focusGap` | `#000000` / `#ffffff` | `#dfd49a` / `#000000` | `>= 10.75:1` all surfaces | Full 2px ring outside 2px gap (3px in Increase Contrast) |
| `disabledFill` / `disabledText` | `#eaeaea` / `#595959` | `#212121` / `#b8b8b8` | `5.82:1` / `8.12:1` | Opaque inactive semantics + adjacent reason; no opacity dimming |

## 2. Four Semantic Action Roles (Theme-Invariant Fills)

Keep identical fills and foregrounds in both light and dark themes. Adapt only borders (when enabled) and focus rings by theme.

| Semantic role | Default | Hover | Pressed | Foreground | Min text contrast |
| --- | --- | --- | --- | --- | --- |
| `action` (Oat) | `#DFD49A` | `#E7DFAF` | `#CFC184` | `#000000` | `11.61:1` (default `14.02:1`) |
| `accept` (Evergreen) | `#3F7057` | `#4A7A62` | `#345E49` | `#FFFFFF` | `4.94:1` (default `5.73:1`) |
| `decline` (Soft red) | `#D99090` | `#E1A4A4` | `#CB7F7F` | `#000000` | `6.88:1` (default `8.34:1`) |
| `destructive` (Muted red) | `#AD4648` | `#B94F51` | `#983D40` | `#FFFFFF` | `4.88:1` (default `5.61:1`) |

Neutral secondary custom actions:
- **Light:** `#FFFFFF` default / `#F4F4F4` hover / `#EAEAEA` pressed on `#000000` text (`>= 17.46:1`), with `1px borderStrong` edge so the hit area separates cleanly from matching white surfaces.
- **Dark:** `#191919` default / `#212121` hover / `#323232` pressed on `#FFFFFF` text (`>= 12.82:1`), with `1px borderStrong` edge.

## 3. Choice-Group Grammar (Strict)

| Situation | Required roles | Forbidden |
| --- | --- | --- |
| Standalone invitation, hero CTA, "Open history", informational notification action | `action` (Oat) + optional `neutral` supporting actions | Do not turn plain navigation green just because it is enabled |
| Ordinary Yes / No decision (no data loss) | `accept` (Evergreen) + `decline` (Soft red) | Do not add Oat to this group; do not use Destructive for a harmless No |
| Commit vs. discard work (Save / Discard) | `accept` (Evergreen) + `destructive` (Muted red) + optional `neutral` Cancel/Keep editing | Do not add Oat to this group |
| Deletion confirmation (Delete / Keep or Cancel) | `destructive` (Muted red) + `neutral` Keep/Cancel | Destructive is never default Return; do not add Oat |
| Generic navigation exit (Back, Close, Cancel, Done) | `neutral` (or native platform chrome) | Do not color generic Cancel soft red or destructive |

**Critical non-color rule:** `accept` (`#3F7057`) and `destructive` (`#AD4648`) have only **1.02:1** luminance separation. Never rely on color or position alone: use concrete verb+object labels ("Save measurement", "Discard draft") and distinct icons (check vs. trash/xmark).

## 4. Filled-Action Border Policy

- **Default (`borderless-filled`):** Promoted from Chai's owner-approved CS20D Health refinement. Filled custom action buttons (`action`, `accept`, `decline`, `destructive`) omit decorative outer borders in both themes.
- **Always retained:**
  1. Essential editable-field boundaries (`1px borderControl`, strengthening to `2px borderHighContrast` under Increase Contrast).
  2. Neutral secondary action borders (`1px borderStrong`, `2px borderHighContrast` under Increase Contrast) whenever the button fill matches or blends into its host surface.
  3. Full `2px` perimeter focus ring outside a `2px` separating gap (`3px` under Increase Contrast).
- **Opt-in (`bordered`):** Consumers that want explicit strokes on filled custom buttons can set `data-one-action-border="bordered"` (web) or `bordered: true` (SwiftUI) to enable `1px borderStrong` (`>= 5.38:1` on all six neutral surfaces) / `2px borderHighContrast`.

## 5. Independent Status & Category Namespaces

### Status roles (never conflate with actions)

| Status | Light text / fill | Dark text / fill | Required non-color cue |
| --- | --- | --- | --- |
| `success` | `#166534` / `#f0fdf4` (`6.81:1`) | `#86efac` / `#143322` (`9.80:1`) | Check icon + concrete completed result |
| `warning` | `#854d0e` / `#fffbea` (`6.60:1`) | `#fde68a` / `#332b12` (`11.28:1`) | Warning icon + explicit condition/action |
| `danger` | `#b91c1c` / `#fff1f2` (`5.89:1`) | `#ff6666` / `#3b1717` (`5.56:1`) | Error label + problem + recovery action |
| `info` | `#1d4ed8` / `#eff6ff` (`6.16:1`) | `#93c5fd` / `#17283b` (`8.30:1`) | Inline explanatory status |

- App-owned **informational notifications** use `action` (Oat) for accent/action with black text/icon and neutral readable body copy.
- Waiting, queued, partial, and unavailable states often belong in neutral text rather than forcing a status color.

### Category fills (with `#000000` foreground)
- `categoryBlue` (`#5ab8ff`, `9.73:1`), `categoryLavender` (`#9d8aff`, `7.51:1`), `categoryGreen` (`#30b588`, `8.09:1`).
- Map each category once per product inside the adapter/generator (e.g., `dataMeasurement`, `dataProduct`, `dataPhoto`). Never use category green as `accept`, and never use raw action fills as text/link colors on neutral backgrounds (`#DFD49A` text on `#FFFFFF` fails contrast).

## Theme presets

The tables describe the default palette. Set `data-one-preset` to `default`, `obsidian-studio`, `paper-editorial`, or `high-contrast`. Each JSON preset overrides named roles under `color.light` and `color.dark`. The verifier checks the resulting palettes against the same thresholds as the canonical palette.
