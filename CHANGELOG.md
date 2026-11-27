# Changelog

This project tracks notable changes using [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## 1.0.0

### Changed

- Asterline UI v0.3 becomes **One UI v1.0**. The canonical tokens move to
  `one.tokens.json`, web properties use `--one-*`, and agent rules use
  `ONE-01` through `ONE-28`.
- One UI adopts the GNU Affero General Public License v3.0 only
  (`AGPL-3.0-only`). BoardUI and Inter retain their upstream licenses.
  [Licensing and provenance](NOTICE.md)

### Added

- Kinetic UI Moments, a 36-component system built on interruptible springs
  with instant reduced-motion equivalents.
- `@one-ui/core` for spring physics, gesture math, contrast, themes and the
  component catalog, `@one-ui/web` for web components, and `@one-ui/react`
  for React bindings.
- The `one-ui` CLI for adding components to an existing project.
- The `OneUI` Swift Package and generated token and spring bindings for
  Android Jetpack Compose and Flutter.
- Default, Obsidian Studio, Paper Editorial and High Contrast theme presets.
