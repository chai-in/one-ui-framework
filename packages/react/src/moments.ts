'use client'

import * as React from 'react'
import { findMoment } from '@one-ui/core'
import type { MomentSlug } from '@one-ui/core'
import * as Patterns from './moment-patterns.ts'
import type { MomentBaseProps } from './moment-patterns.ts'

/** Bind a catalog entry while retaining each pattern's exact public props. */
function bind<P extends MomentBaseProps>(slug: MomentSlug,
  Pattern: (props: P & { spec: NonNullable<ReturnType<typeof findMoment>> }) => React.ReactElement) {
  const spec = findMoment(slug)!
  function BoundMoment(props: P): React.ReactElement {
    return React.createElement(Pattern, { ...props, spec })
  }
  BoundMoment.displayName = 'One' + spec.name.replaceAll(' ', '')
  return BoundMoment
}

export const OneBarsFade = /* @__PURE__ */ bind<Patterns.ProgressMomentProps>('bars-fade', Patterns.Progress)
export const OneBloomToggle = /* @__PURE__ */ bind<Patterns.ToggleMomentProps>('bloom-toggle', Patterns.Toggle)
export const OneSnapGrid = /* @__PURE__ */ bind<Patterns.OptionMomentProps>('snap-grid', Patterns.Choice)
export const OneCardFan = /* @__PURE__ */ bind<Patterns.OptionMomentProps>('card-fan', Patterns.Choice)
export const OneGooeyTabBar = /* @__PURE__ */ bind<Patterns.TabMomentProps>('gooey-tab-bar', Patterns.Tabs)
export const OneBlocksScale = /* @__PURE__ */ bind<Patterns.ProgressMomentProps>('blocks-scale', Patterns.Progress)
export const OneStretchToggle = /* @__PURE__ */ bind<Patterns.ToggleMomentProps>('stretch-toggle', Patterns.Toggle)
export const OneMergeDrops = /* @__PURE__ */ bind<Patterns.MergeDropsProps>('merge-drops', Patterns.MergeDrops)
export const OnePaperPlane = /* @__PURE__ */ bind<Patterns.ActionMomentProps>('paper-plane', Patterns.Action)
export const OneDetentDial = /* @__PURE__ */ bind<Patterns.RangeMomentProps>('detent-dial', Patterns.Range)
export const OneDominoRow = /* @__PURE__ */ bind<Patterns.ProgressMomentProps>('domino-row', Patterns.Progress)
export const OnePebbleRating = /* @__PURE__ */ bind<Patterns.OptionMomentProps>('pebble-rating', Patterns.Choice)
export const OneJellyPad = /* @__PURE__ */ bind<Patterns.ActionMomentProps>('jelly-pad', Patterns.Action)
export const OneSwipeConfirm = /* @__PURE__ */ bind<Patterns.ActionMomentProps>('swipe-confirm', Patterns.Action)
export const OneBookmark = /* @__PURE__ */ bind<Patterns.PressedMomentProps>('bookmark', Patterns.Pressed)
export const OneDepthStack = /* @__PURE__ */ bind<Patterns.OptionMomentProps>('depth-stack', Patterns.Choice)
export const OneMenuMorph = /* @__PURE__ */ bind<Patterns.MenuMomentProps>('menu-morph', Patterns.Menu)
export const OneElasticString = /* @__PURE__ */ bind<Patterns.RangeMomentProps>('elastic-string', Patterns.Range)
export const OneRipplePad = /* @__PURE__ */ bind<Patterns.ActionMomentProps>('ripple-pad', Patterns.Action)
export const OneWormDots = /* @__PURE__ */ bind<Patterns.TabMomentProps>('worm-dots', Patterns.Tabs)
export const OneDownloadRing = /* @__PURE__ */ bind<Patterns.ProgressMomentProps>('download-ring', Patterns.Progress)
export const OneLeafTabs = /* @__PURE__ */ bind<Patterns.TabMomentProps>('leaf-tabs', Patterns.Tabs)
export const OneBellToggle = /* @__PURE__ */ bind<Patterns.ToggleMomentProps>('bell-toggle', Patterns.Toggle)
export const OneInkSwitch = /* @__PURE__ */ bind<Patterns.ToggleMomentProps>('ink-switch', Patterns.Toggle)
export const OneRockerSwitch = /* @__PURE__ */ bind<Patterns.ToggleMomentProps>('rocker-switch', Patterns.Toggle)
export const OneScrubWave = /* @__PURE__ */ bind<Patterns.RangeMomentProps>('scrub-wave', Patterns.Range)
export const OneSquashPlay = /* @__PURE__ */ bind<Patterns.PressedMomentProps>('squash-play', Patterns.Pressed)
export const OneRubberSearch = /* @__PURE__ */ bind<Patterns.SearchMomentProps>('rubber-search', Patterns.Search)
export const OneOdometer = /* @__PURE__ */ bind<Patterns.OdometerProps>('odometer', Patterns.Odometer)
export const OneTideProgress = /* @__PURE__ */ bind<Patterns.ProgressMomentProps>('tide-progress', Patterns.Progress)
export const OneEclipseHalf = /* @__PURE__ */ bind<Patterns.ToggleMomentProps>('eclipse-half', Patterns.Toggle)
export const OneMagnetGrid = /* @__PURE__ */ bind<Patterns.OptionMomentProps>('magnet-grid', Patterns.Choice)
export const OneChecklist = /* @__PURE__ */ bind<Patterns.ChecklistProps>('checklist', Patterns.Checklist)
export const OneFlipCoin = /* @__PURE__ */ bind<Patterns.ActionMomentProps>('flip-coin', Patterns.Action)
export const OneRadialMenu = /* @__PURE__ */ bind<Patterns.MenuMomentProps>('radial-menu', Patterns.Menu)
export const OneDotRevolve = /* @__PURE__ */ bind<Patterns.ProgressMomentProps>('dot-revolve', Patterns.Progress)

export const ONE_REACT_MOMENTS = /* @__PURE__ */ Object.freeze({
  'bars-fade': OneBarsFade,
  'bloom-toggle': OneBloomToggle,
  'snap-grid': OneSnapGrid,
  'card-fan': OneCardFan,
  'gooey-tab-bar': OneGooeyTabBar,
  'blocks-scale': OneBlocksScale,
  'stretch-toggle': OneStretchToggle,
  'merge-drops': OneMergeDrops,
  'paper-plane': OnePaperPlane,
  'detent-dial': OneDetentDial,
  'domino-row': OneDominoRow,
  'pebble-rating': OnePebbleRating,
  'jelly-pad': OneJellyPad,
  'swipe-confirm': OneSwipeConfirm,
  'bookmark': OneBookmark,
  'depth-stack': OneDepthStack,
  'menu-morph': OneMenuMorph,
  'elastic-string': OneElasticString,
  'ripple-pad': OneRipplePad,
  'worm-dots': OneWormDots,
  'download-ring': OneDownloadRing,
  'leaf-tabs': OneLeafTabs,
  'bell-toggle': OneBellToggle,
  'ink-switch': OneInkSwitch,
  'rocker-switch': OneRockerSwitch,
  'scrub-wave': OneScrubWave,
  'squash-play': OneSquashPlay,
  'rubber-search': OneRubberSearch,
  'odometer': OneOdometer,
  'tide-progress': OneTideProgress,
  'eclipse-half': OneEclipseHalf,
  'magnet-grid': OneMagnetGrid,
  'checklist': OneChecklist,
  'flip-coin': OneFlipCoin,
  'radial-menu': OneRadialMenu,
  'dot-revolve': OneDotRevolve,
} satisfies Record<MomentSlug, React.ComponentType<never>>)

type Registry = typeof ONE_REACT_MOMENTS
export type OneMomentProps = {
  [Name in keyof Registry]: { name: Name } & React.ComponentProps<Registry[Name]>
}[keyof Registry]

export function OneMoment({ name, ...props }: OneMomentProps): React.ReactElement {
  // The discriminated union pairs each tag with its props before this runtime lookup.
  const Component = ONE_REACT_MOMENTS[name] as React.ComponentType<typeof props>
  return React.createElement(Component, props)
}
