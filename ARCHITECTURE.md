# One UI v1.0 architecture

One UI has two contracts. The design tokens assign meaning to color, spacing, type, density and motion. The component catalog gives each interaction a stable identity and describes its input, semantic state and reduced-motion behavior. Renderers implement these contracts using the controls, event delivery and accessibility APIs of their platform. [Tokens](tokens/one.tokens.json) · [Catalog](skills/one-ui/assets/catalog.json)

## Tokens and generation

`tokens/one.tokens.json` uses schema version 3. It defines paired light and dark semantic palettes, action and status roles, typography, a 4 px spacing grid, control sizes, focus geometry, timing and physical spring parameters. A standalone invitation uses `action`. A save/discard decision uses `accept` and `destructive`. An ordinary refusal uses `decline`. Each decision also needs a visible name or distinct symbol. [Rules ONE-01 through ONE-13](RULES.md)

The four theme files are sparse palette overrides. The verifier merges each with the canonical colors and computes WCAG luminance ratios for the resulting solid-color pairs. A value below its threshold fails even if its displayed, rounded ratio reaches the threshold. The generator runs the checks before emitting its bindings. [Theme inputs](tokens/themes/) · [Generator](skills/one-ui/scripts/generate_tokens.py) · [Verifier](skills/one-ui/scripts/verify_tokens.py)

| Consumer | Generated binding | Where platform behavior lives |
| --- | --- | --- |
| Web | Layered CSS custom properties, Tailwind v4 `@theme inline` bridge and compatibility aliases | Primitive and moment styles, Web Components |
| SwiftUI | Dynamic colors and token namespaces, including `OneTokens.Springs` | SwiftUI views, styles, environment values and the native spring adapter |
| Compose | Kotlin palettes, dimensions and spring specs | Material 3 composables, semantics and composition locals |
| Flutter | Dart palettes, dimensions and spring descriptions | Material widgets, semantics and an inherited motion profile |
| JavaScript | The core workspace snapshots the base and preset palettes in `theme-data.ts` | Theme resolution, contrast reporting and DOM application in core |

After editing a token or preset, run these commands from the root to update all platform bindings, synchronize the skill assets and refresh the core palette. The generator also supports `--out-xcassets` and domain-specific category aliases for Apple projects.

```sh
python3 skills/one-ui/scripts/generate_tokens.py \
  --tokens tokens/one.tokens.json --themes-dir tokens/themes \
  --out-web platforms/web \
  --out-swift platforms/apple/Sources/OneUI/OneDesignTokens.generated.swift \
  --out-android platforms/android/OneDesignTokens.generated.kt \
  --out-flutter platforms/flutter/one_design_tokens.g.dart \
  --sync-skill-asset skills/one-ui/assets/one.tokens.json
npm run sync:theme --workspace=@one-ui/core
npm run verify:tokens
```

In core, `createOneTheme()` merges the preset, shared overrides and per-scheme overrides in that order. It returns palettes, CSS variables, a stylesheet and a report for the requested scheme or both system schemes. Applications can inspect failures before calling `applyOneTheme()`. Both the JavaScript report and the Python CSV identify the color pairs they evaluated. [Theme API](packages/core/src/theme.ts)

## Spring and gesture engine

The solver models displacement from the target as a damped harmonic oscillator, `m x″ + c x′ + k x = 0`. The inputs are mass, damping, stiffness, initial position and velocity. Sampling the analytical solution yields position and velocity at an elapsed time for underdamped, critically damped and overdamped motion. `evaluateSpring` uses seconds. The stateful driver advances by a frame delta in milliseconds. [Solver and driver](packages/core/src/spring.ts)

Retargeting changes the destination while retaining the current position and velocity. A second input can reverse a moving control without restarting it at rest. `computeSettleDurationMs` finds when a unit step stays within tolerance. `springToCssLinear` samples a finite trajectory into a CSS `linear()` timing function. The Python generator also derives CSS curves from the spring tokens. [Python spring functions](skills/one-ui/scripts/spring_physics.py)

`snappy`, `tactile`, `elastic`, `gentle` and `detent` are spring presets. `calm`, `tactile` and `reduced` are presentation modes. For example, Swipe Confirm selects the detent spring in tactile mode. The input layer decides when to confirm a swipe. The renderer moves the visual towards its new target. Reduced motion settles immediately and preserves the confirmation event. The core also supplies rubber-banding, snapping, magnetic offsets, fan transforms and odometer digit calculations. [Gesture math](packages/core/src/physics.ts)

## Catalog and rendering layers

The core exports `ONE_CONTROLS` and `ONE_MOMENTS`. Controls use their slug as their ID. Moments use the numbered IDs `01`–`36`. Each record includes a slug, tag, name, category, preset, semantic role, input attributes, events and reduced-motion description. The skill JSON exposes the same data to agents without a JavaScript runtime. [Core catalog](packages/core/src/catalog.ts)

| Layer | Entry point | Responsibility |
| --- | --- | --- |
| Web | `@one-ui/web` or its standalone ESM bundle | Registers 44 catalog tags plus the generic `one-moment` element. Uses native controls inside shadow roots and dispatches composed, bubbling custom events. [Web package](packages/web/) |
| React | `@one-ui/react` and `@one-ui/react/styles.css` | Renders React elements directly, with named components, a slug registry, accessible input patterns, scoped `OneProvider` and spring hooks. [React package](packages/react/) |
| Apple | SwiftPM product `OneUI` | Exposes the 36-case `OneMomentID`, interactive `OneMomentView(id:)`, standalone views, control styles and bindings. Platform sheets, popovers, tabs and toggles retain SwiftUI semantics. [Swift sources](platforms/apple/Sources/OneUI/) |
| Android | Kotlin source in package `one.ui` | Carries 36 `OneMomentId` records, shared controls and selected Material 3 composables such as `OneSwipeConfirm`. [Compose sources](platforms/android/) |
| Flutter | Dart source under `platforms/flutter` | Carries 36 `OneMomentId` records, shared controls and selected Material widgets such as `OnePaperPlaneButton`. [Flutter sources](platforms/flutter/) |

The cross-platform contract for **36 moments** covers identity, category, preset and the reduced-motion outcome. The **eight base controls** share a catalog across core, the skill, Web and React. Native control APIs follow their platform. For example, the CLI’s Swift dialog snippet uses a system sheet. Compose and Flutter publish their widget implementations as source alongside the complete moment metadata.

## CLI and agent installation

The npm workspace order reflects the build dependencies. Core emits types and ESM first. Web depends on core and builds the standalone browser bundle. React depends on core and declares React and React DOM as peers. The CLI bundles the Web artifact, token bindings, rules, notices and Python tools into its distribution so a consumer can initialize a project from the installed package. [Package manifests](package.json) · [CLI asset packaging](packages/cli/scripts/bundle-assets.mjs)

Use `one-ui list` to discover entries, `inspect` for snippets and event details, and `add` to generate a web example, React entry point or CSS skin. `init` selects the platform and can inject the rules into a project instruction file. `theme` validates a custom palette, `doctor` inspects an installation and `verify` and `audit` invoke the packaged Python checks. CLI commands support `--json` for automation. [CLI](packages/cli/)

The agent reads the small project rules first, then the installed `SKILL.md` reference map. Detailed guidance on color, web layout, Apple controls, kinetic gestures, accessible states and reading anchors is loaded as needed. The installer copies or links the self-contained skill into a repository or supported agent directory. The installed copy carries tokens, themes, catalog and Python scripts. [Installer](scripts/install.py) · [Skill reference map](skills/one-ui/SKILL.md)

## Verification and evidence

| Tier | What it establishes | How to obtain it |
| --- | --- | --- |
| 1 · Token arithmetic | Schema, canonical asset sync and unrounded sRGB contrast on named solid surfaces | `npm run verify:tokens` regenerates the per-pair CSV. |
| 2 · Static audit | Findings for the source patterns the auditor recognizes | `npm run audit` scans the configured Web, Swift and React paths. |
| 3 · Rendered inspection | Visible layout, focus geometry, motion, interruption and zoom in a particular artifact | Exercise the states in a named browser or simulator at recorded sizes and settings. |
| 4 · Assistive and device testing | Actual announcements, navigation, input and target behavior | Exercise the task with the intended assistive technology and device, recording the outcome. |

`npm run check:all` also compiles and typechecks the workspaces, runs their tests, checks the cross-platform catalog, enforces integration budgets and runs SwiftPM tests. Package tests cover DOM and server rendering, physics and CLI installation paths. Native catalog comparisons inspect source records. The macOS Swift tests also host the catalog views and check layout size. Android and Flutter compilation is outside this root command. The showcase provides a surface for manual inspection. [Integration tests](tests/integration.test.mjs) · [Swift tests](platforms/apple/Tests/OneUITests/OneUITests.swift) · [Showcase](showcase/index.html)
