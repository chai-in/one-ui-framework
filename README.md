# One UI v1.0.0

One UI combines Asterline’s calm editorial layout and WCAG 2.2 AA color grammar with 36 Kinetic UI Moments. Rules `ONE-01`–`ONE-24` govern what a button means, how a field signals an error, and where focus returns. Rules `ONE-25`–`ONE-28` govern what moves. A spring can change direction mid-flight. A confirmation must still work with the keyboard and with motion turned off. [Design rules](RULES.md)

Use the CSS on its own, register the Web Components in any framework, or use the React and native bindings. The same moment has the same ID and spring preset across platforms. [Architecture](ARCHITECTURE.md) · [Migrate from Asterline](MIGRATION.md)

## Quickstarts

Clone One UI, install the Node workspaces and build their public entry points. Use Node 22.18 or later. The Python tools use the standard library.

```sh
git clone https://github.com/chai-in/one-ui-framework.git
cd one-ui-framework
npm ci
npm run build
```

### AI coding agents

Install the skill into the consuming repository and put the CLI from this checkout on your path. Replace the project path with your own.

```sh
npm rebuild @one-ui/cli
export PATH="$PWD/node_modules/.bin:$PATH"
project=/absolute/path/to/your/project
python3 scripts/install.py --repo "$project"
cd "$project"
one-ui init --inject-rules AGENTS.md
one-ui list --json
one-ui inspect paper-plane --json
```

The rebuild links the CLI executable after compilation in a fresh checkout. The installer places the skill in `.agents/skills/one-ui`. The CLI detects the project platform, writes its configuration and installs the compact rule block. Inspect a moment to get its role, input contract and reduced-motion behavior. [Agent Skill](skills/one-ui/SKILL.md)

Apply user design feedback in the consuming project and capture reusable insights upstream. Use `report_feedback.py` to search open threads, add evidence, and report public-safe feedback. From this repository, run `python3 skills/one-ui/scripts/report_feedback.py --list` to triage the baseline backlog. [Feedback workflow](skills/one-ui/references/feedback-loop.md) · [Open design feedback](https://github.com/chai-in/one-ui-framework/issues?q=is%3Aissue+is%3Aopen+label%3Adesign-feedback)

### Plain HTML or any web framework

After the build, serve the following HTML from the checkout root.

For deployment, copy the stylesheet and the standalone ES module to your static assets and adjust the two URLs. Include `LICENSE` and `NOTICE.md` from `packages/web/dist/` with the assets. Give recipients a visible link to the corresponding source for the exact bundle you serve. For an unmodified build, link to the source archive for the Git commit you built. For a modified build, provide your modified source and build scripts under AGPL-3.0-only.

```html
<!doctype html>
<html lang="en" data-one-motion="tactile">
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Message actions</title>
  <link rel="stylesheet" href="./platforms/web/one-tokens.css">
  <script type="module" src="./packages/web/dist/one-ui-web.bundle.js"></script>
  <one-paper-plane label="Send message"></one-paper-plane>
  <one-swipe-confirm label="Confirm delivery"></one-swipe-confirm>
  <output aria-live="polite"></output>
  <script type="module">
    const status = document.querySelector('output')
    document.querySelector('one-paper-plane').addEventListener('one-action', () => {
      status.textContent = 'Send requested'
    })
    document.querySelector('one-swipe-confirm').addEventListener('one-confirm', () => {
      status.textContent = 'Delivery confirmed'
    })
  </script>
</html>
```

With a bundler, install the [local Web package](#install-the-web-or-react-package-from-source) and use `import '@one-ui/web'` to register the tags. For native HTML controls, import `one-primitives.css` after the tokens and apply classes such as `one-btn` with `data-one-role="accept"`.

For a searchable collection, use a native list with `.one-collection` and place its filters in a `.one-toolbar`. The grid responds to its container and retains item width as filtering removes results. Set `--one-collection-min` to the smallest useful preview width. Use a native `.one-table` for exact comparisons, with `data-one-numeric` on numeric headers and cells. Import `@one-ui/web/one-layout.css` after the tokens. React’s stylesheet and CLI-installed styles include these classes. [Layout primitives](platforms/web/one-layout.css)

`<one-choice-group>` provides Accept and Decline by default. Custom labels default to the neutral role. Use `options="Delete:destructive,Cancel:neutral"` to assign roles explicitly. The chosen label is available in `event.detail.value`.

### Tailwind CSS v4

Copy the two generated One UI sheets into your Tailwind entry stylesheet’s directory. The v4 bridge maps utility names to semantic variables, including their active color scheme.

```css
@import "tailwindcss";
@import "./one-tokens.css";
@import "./one-tailwind-v4.css";
```

```html
<main class="bg-one-canvas text-one-text-primary">
  <h1>Draft messages</h1>
</main>
```

[Web stylesheets](platforms/web/)

### React 18 or 19

Install the [local React package](#install-the-web-or-react-package-from-source) in an app with matching React and React DOM versions. Import the package stylesheet once. The provider scopes theme options to its children. The standalone spring hook accepts a numeric target and returns its current position.

```jsx
'use client'
import { useState } from 'react'
import { OnePaperPlane, OneProvider, useOneSpring } from '@one-ui/react'
import '@one-ui/react/styles.css'

function Outbox() {
  const [queued, setQueued] = useState(false)
  const fill = useOneSpring(queued ? 1 : 0, 'snappy')
  return <>
    <OnePaperPlane label="Queue message" disabled={queued} onClick={() => setQueued(true)} />
    <p role="status">{queued ? 'Message queued' : 'Ready to queue'}</p>
    <div aria-hidden="true" style={{
      height: 2, background: 'var(--one-color-accept)',
      transformOrigin: 'left', transform: `scaleX(${fill})`
    }} />
  </>
}

export default function App() {
  return <OneProvider motion="tactile"><Outbox /></OneProvider>
}
```

### Install the Web or React package from source

After building the checkout, package the adapters and their shared core into your app. Replace the app path, then run the install command for the adapter you use. Keep the tarballs at those paths for subsequent installs.

```sh
app=/absolute/path/to/your/app
mkdir -p "$app/vendor/one-ui"
npm pack --workspace=@one-ui/core --workspace=@one-ui/web --workspace=@one-ui/react \
  --pack-destination "$app/vendor/one-ui"
cd "$app"

# Web Components
npm install ./vendor/one-ui/one-ui-core-1.0.0.tgz ./vendor/one-ui/one-ui-web-1.0.0.tgz

# React
npm install ./vendor/one-ui/one-ui-core-1.0.0.tgz ./vendor/one-ui/one-ui-react-1.0.0.tgz
```

### Apple SwiftUI

In Xcode, add the local package at `platforms/apple` and link its **OneUI** library to your target. The SwiftPM manifest supports iOS 17+, macOS 14+ and watchOS 10+.

```swift
import OneUI
import SwiftUI

struct FavoriteSetting: View {
    @State private var saved = false

    var body: some View {
        OneBloomToggle(isOn: $saved, label: "Favorite")
    }
}
```

[Swift package](platforms/apple/Package.swift)

### Android Jetpack Compose and Flutter

For Compose, copy the Kotlin files from `platforms/android` into the app’s main source set in a project with Material 3 and Compose animation. The components live in `one.ui`. Pass application state and its update callback to a moment.

```kotlin
import androidx.compose.runtime.Composable
import one.ui.OnePaperPlaneButton

@Composable
fun OutboxAction(sent: Boolean, send: () -> Unit) {
    OnePaperPlaneButton(sent = sent, onSend = send, label = "Send message")
}
```

For Flutter, copy the Dart files from `platforms/flutter` into `lib/one_ui/` in a Material app. Use the same state-and-callback contract from a parent widget.

```dart
import 'package:flutter/material.dart';
import 'one_ui/one_moments.dart';

Widget outboxAction(bool sent, VoidCallback send) =>
    OnePaperPlaneButton(sent: sent, onSend: send, label: 'Send message');
```

Both source adapters carry the complete moment catalog and a selection of ready-made widgets. [Compose sources](platforms/android/) · [Flutter sources](platforms/flutter/)

### Interactive playground

After building, run `python3 -m http.server 8000 --bind 127.0.0.1` at the checkout root and open `http://127.0.0.1:8000/showcase/`. Try editing a draft, recovering from an empty search, or comparing the spring response curves and their numeric data. Serving from the root makes the built component bundle available. [Showcase entry point](showcase/index.html)

## Kinetic UI Moments

Use the slug with `one-ui inspect` or `one-ui add`. Each tag uses the catalog preset in tactile mode. [Machine-readable catalog](skills/one-ui/assets/catalog.json)

| ID | Slug | Web tag | Category | Spring preset |
| --- | --- | --- | --- | --- |
| 01 | `bars-fade` | `<one-bars-fade>` | feedback | gentle |
| 02 | `bloom-toggle` | `<one-bloom-toggle>` | selection | tactile |
| 03 | `snap-grid` | `<one-snap-grid>` | layout | detent |
| 04 | `card-fan` | `<one-card-fan>` | selection | gentle |
| 05 | `gooey-tab-bar` | `<one-gooey-tab-bar>` | navigation | elastic |
| 06 | `blocks-scale` | `<one-blocks-scale>` | feedback | snappy |
| 07 | `stretch-toggle` | `<one-stretch-toggle>` | selection | elastic |
| 08 | `merge-drops` | `<one-merge-drops>` | feedback | elastic |
| 09 | `paper-plane` | `<one-paper-plane>` | action | snappy |
| 10 | `detent-dial` | `<one-detent-dial>` | input | detent |
| 11 | `domino-row` | `<one-domino-row>` | feedback | tactile |
| 12 | `pebble-rating` | `<one-pebble-rating>` | input | tactile |
| 13 | `jelly-pad` | `<one-jelly-pad>` | action | elastic |
| 14 | `swipe-confirm` | `<one-swipe-confirm>` | action | detent |
| 15 | `bookmark` | `<one-bookmark>` | selection | snappy |
| 16 | `depth-stack` | `<one-depth-stack>` | layout | gentle |
| 17 | `menu-morph` | `<one-menu-morph>` | disclosure | snappy |
| 18 | `elastic-string` | `<one-elastic-string>` | input | elastic |
| 19 | `ripple-pad` | `<one-ripple-pad>` | action | tactile |
| 20 | `worm-dots` | `<one-worm-dots>` | navigation | elastic |
| 21 | `download-ring` | `<one-download-ring>` | feedback | gentle |
| 22 | `leaf-tabs` | `<one-leaf-tabs>` | navigation | tactile |
| 23 | `bell-toggle` | `<one-bell-toggle>` | selection | tactile |
| 24 | `ink-switch` | `<one-ink-switch>` | selection | gentle |
| 25 | `rocker-switch` | `<one-rocker-switch>` | selection | detent |
| 26 | `scrub-wave` | `<one-scrub-wave>` | input | detent |
| 27 | `squash-play` | `<one-squash-play>` | action | tactile |
| 28 | `rubber-search` | `<one-rubber-search>` | input | elastic |
| 29 | `odometer` | `<one-odometer>` | feedback | snappy |
| 30 | `tide-progress` | `<one-tide-progress>` | feedback | gentle |
| 31 | `eclipse-half` | `<one-eclipse-half>` | selection | gentle |
| 32 | `magnet-grid` | `<one-magnet-grid>` | selection | tactile |
| 33 | `checklist` | `<one-checklist>` | selection | snappy |
| 34 | `flip-coin` | `<one-flip-coin>` | action | elastic |
| 35 | `radial-menu` | `<one-radial-menu>` | disclosure | snappy |
| 36 | `dot-revolve` | `<one-dot-revolve>` | feedback | gentle |

## Customization

Start with `default`, `obsidian-studio`, `paper-editorial` or `high-contrast`. Each preset passes the repository’s solid-color WCAG contrast checks for light and dark. Use `createOneTheme()` to validate a proposed color change as someone edits it. Its result includes the unrounded ratio and threshold for each pair. Apply the change after the pairs pass.

```js
import { applyOneTheme, createOneTheme } from '@one-ui/core'

export function previewActionColor(hex) {
  const options = {
    preset: 'paper-editorial', theme: 'system', color: { light: { action: hex } },
    motion: 'tactile', actionBorder: 'borderless-filled', density: 'comfortable'
  }
  const { contrast } = createOneTheme(options)
  if (contrast.pass) applyOneTheme(document.documentElement, options)
  return contrast.pairs.filter(pair => !pair.pass)
}
```

Pass a valid solid hex color to this example. Invalid role names and malformed colors throw. `calm` keeps utility motion short, `tactile` selects the catalog spring and `reduced` settles immediately. A system reduced-motion request takes precedence. Use `borderless-filled` or `bordered` for filled actions, and `comfortable` or `compact` for density. The generated CSS also accepts these values through `data-one-preset`, `data-one-motion`, `data-one-action-border` and `data-one-density`. [Token policies](tokens/one.tokens.json)

## Verification

Run `npm run check:all` with Python 3 and an Apple Swift toolchain installed. It builds, typechecks, verifies tokens, audits sources, runs package and integration tests, then runs SwiftPM tests. Run `npm run bench` after the build to reproduce the spring benchmark and bundle measurement.

| ONE-24 evidence tier | Prior verification observations |
| --- | --- |
| 1 · Token arithmetic | 750/750 comparisons passed. The canonical palette and each of four presets contributed 150 pairs. Text is checked at 4.5:1 and essential UI at 3:1. [Contrast report](verification/accessibility-contrast.csv) |
| 2 · Static audit & automated tests | The auditor covered 32 source files across web, SwiftUI, Compose and Flutter with zero findings. The test run passed 259 JS/TS tests and 8 SwiftPM tests. [Audit implementation](skills/one-ui/scripts/audit_ui.py) |
| 3 · Rendered inspection | Headless Chromium exercised catalog filtering and focus return, draft recovery and deletion, nested overlays, RTL tab navigation, contrast presets and chart data. Firefox 153.0, WebKit 26.5 and desktop Safari 27.2 also passed catalog, keyboard recovery and reflow checks at seven widths from 320 to 1600 CSS px. [Research and design decisions](verification/design-review.md) |
| 4 · Assistive and device testing | Pending for this verification run. Check names, actions, announcements, navigation and reduced motion with the target input devices and assistive technology. |

With Node 24.22.1, the standalone web module measured **89,646 bytes raw and 23,594 bytes gzip** at level 9. One local benchmark run evaluated 3,000,000 springs in 217.15 ms. This measures solver throughput. Frame times and input latency depend on the consuming application.

## License

One UI is licensed under GNU Affero General Public License v3.0 only (`AGPL-3.0-only`). When distributing the project, retain the applicable license and third-party notices. The license also covers offering corresponding source to remote users of a modified version. [License](LICENSE) · [Third-party notices](NOTICE.md) · [Contributing](CONTRIBUTING.md)
