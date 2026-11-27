# Migrate Asterline UI v0.3 to One UI v1.0

The upgrade changes the token schema, CSS names, Swift integration, agent skill and project license. You can migrate styles one component at a time using the variable aliases. Kinetic moments are opt-in. An existing Save button can remain a native button throughout the upgrade.

## 1. Prepare the new checkout and check licensing

One UI v1.0 uses `AGPL-3.0-only`. Review the license for your distribution and network use. Retain the BoardUI attribution and the Inter license when shipping the font. [License](LICENSE) · [Third-party notices](NOTICE.md)

From the One UI checkout, build the workspaces and make the local CLI available in this shell. Set `project` to your application.

```sh
npm ci
npm run build
npm rebuild @one-ui/cli
export PATH="$PWD/node_modules/.bin:$PATH"
project=/absolute/path/to/your/app
python3 scripts/install.py --repo "$project"
cd "$project"
one-ui init --platform web --compat-asterline --inject-rules AGENTS.md --dry-run
one-ui init --platform web --compat-asterline --inject-rules AGENTS.md
```

Use `--platform tailwind` for the v4 stylesheet bridge or `--platform react` for a React project. For a Swift-only project use `--platform apple` and omit the CSS compatibility flag. The CLI copies a generated token file in Apple mode. If you adopt the Swift package in step 4, remove that local generated file from the app target to avoid two token definitions.

## 2. Change the stylesheet entry point

With the CLI, import `src/styles/one-ui.css` at the application entry point. With a manual installation, replace `asterline-tokens.css` with `one-compat-asterline.css` and place `one-tokens.css` beside it. The compatibility sheet imports the new tokens and maps reads of the old variables to their new counterparts. Keep legacy primitive styling in place for any markup that still uses its selectors.

| Asterline v0.3 | One UI v1.0 |
| --- | --- |
| `tokens/asterline.tokens.json` (schema 2) | `tokens/one.tokens.json` (schema 3) |
| `var(--al-color-accept)` | `var(--one-color-accept)` |
| `var(--al-space-4)` | `var(--one-space-4)` |
| `var(--al-radius-control)` | `var(--one-radius-control)` |
| `asterline-primitives.css` and `.al-btn` | `one-primitives.css` and `.one-btn` |
| `data-role="accept"` on a styled button | `data-one-role="accept"` |
| `data-asterline-theme`, `data-asterline-density`, `data-asterline-action-border` | `data-one-theme`, `data-one-density`, `data-one-action-border` |
| `asterline-tailwind-v4.css`, `bg-al-canvas` | `one-tailwind-v4.css`, `bg-one-canvas` |

Change custom theme **writes** as well as reads. For example, a local override of `--al-color-action` needs to set `--one-color-action` for new components to inherit it. Update classes, data attributes, Tailwind utilities and any custom CSS layer ordering as you migrate each view. The bridge aliases custom properties only. After the last legacy consumer is migrated, remove the compatibility import and set `compatAsterline` to `false` in `one-ui.config.json`. Keep the token import.

## 3. Update the skill and rule references

The installer creates `.agents/skills/one-ui`. Update scripts, agent prompts and CI paths that reference `skills/asterline-ui` to `skills/one-ui`. For global Codex installation, run `python3 scripts/install.py --targets codex` from the new checkout. Retire the old skill copy or symlink after confirming the agent discovers the new one. Check local edits before removing any old skill directory.

The installer-owned v0.3 rule block is recognized by its `<!-- asterline-ui:v0.3 -->` markers. Injection upgrades that block and preserves the surrounding instructions. If you maintain rules by hand, replace the old block with the current rules. [Compact rules](RULES.md)

| Old reference | New reference | What to update |
| --- | --- | --- |
| `AL-01`–`AL-24` | `ONE-01`–`ONE-24` | Preserve the number. Update review templates, lint annotations and agent prompts. Read the current rule text for its platform scope. |
| New in v1.0 | `ONE-25` | Animate the visual child and verify compositing on the target. |
| New in v1.0 | `ONE-26` | Preserve position and velocity when retargeting. |
| New in v1.0 | `ONE-27` | Tie a kinetic metaphor to a real action, value or progress state. |
| New in v1.0 | `ONE-28` | Settle instantly under reduced motion and preserve semantic behavior. |

## 4. Move SwiftUI consumers to SwiftPM

Add the local package directory `platforms/apple` in Xcode, link the **OneUI** product and add `import OneUI` in views that use its types. A SwiftPM consumer can declare `.package(name: "OneUI", path: "../one-ui-framework/platforms/apple")` and add `.product(name: "OneUI", package: "OneUI")` to the consuming target’s dependencies. Adjust the path for your checkout layout. Deployment minimums are iOS 17, macOS 14 and watchOS 10.

Replace `AsterlineColor`, `AsterlineSpace` and `AsterlineRadius` with `OneColor`, `OneSpace` and `OneRadius`. Replace `AsterlineButtonStyle` with `OneButtonStyle`, `.asterlineField()` with `.oneField()` and `.asterlineReadingWidth()` with `.oneReadingWidth()`. Once the app builds against the library, retire the previously vendored Swift sources from the target. [Swift sources and public initializers](platforms/apple/Sources/OneUI/)

## 5. Verify the migrated app

From the consuming project, check the installed files and audit the migrated source. Substitute your application’s source directory for `src`.

```sh
one-ui doctor --json
one-ui verify --json
one-ui audit src
one-ui inspect paper-plane --json
```

If you regenerate custom tokens, pass their location to `one-ui verify --tokens path/to/one.tokens.json`. In the One UI checkout, `npm run check:all` exercises the package, catalog, token and Swift checks, and `npm run bench` reports solver timing and bundle size.

Revisit one real decision group in light, dark and high contrast. Follow it with the keyboard, check the full focus ring, interrupt an in-flight interaction, then repeat it with reduced motion and the target assistive technology. Record the observed outcomes alongside the token and source reports. [Verification tiers](ARCHITECTURE.md#verification-and-evidence)
