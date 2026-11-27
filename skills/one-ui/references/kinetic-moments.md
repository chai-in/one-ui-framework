# Kinetic UI Moments

Choose the control for the task first. A moment gives an existing action, selection, value or pending operation tactile feedback. Keep the accessible name, event and focus target stable across its visual states. The catalog contains component tags, attributes, events and semantic roles. [Machine-readable catalog](../assets/catalog.json)

## Motion profiles

The default `calm` profile uses utility timing. Opt into spring feedback with `data-one-motion="tactile"`. In `reduced` mode, commit state immediately and suppress travel, scale and loops. The system preference takes precedence. Stop a progress loop as soon as the operation settles, fails or is cancelled.

Web transitions can use `--one-motion-duration` and `--one-motion-ease`. For a specific tactile gesture, pair the preset's duration with its curve, for example `--one-spring-detent-duration` and `--one-spring-detent`. Apply the transform to a decorative child. Keep the hit area and focus ring stationary. For continuously retargeted dragging, preserve the live position and velocity in a spring driver. Sampled CSS easing describes a unit step from rest.

SwiftUI provides `OneTokens.Springs` with both physical and response-based presets. Pass `nil` to the animation when the environment requests reduced motion. Compose's `OneSprings` exposes unit-mass spring specs. Flutter's `OneSprings` exposes physical spring descriptions. In either runtime, snap to the requested value when the motion preference changes to reduced, including mid-gesture.

| ID | Moment and slug | Spring | Semantics and keyboard | Reduced motion |
| --- | --- | --- | --- | --- |
| 01 | Bars Fade (`bars-fade`) | gentle | Named progress indicator with min, max and current value. Omit the value for indeterminate progress. Reading-order content has no tab stop. | Show a static progress indicator and its accessible label. |
| 02 | Bloom Toggle (`bloom-toggle`) | tactile | Named switch with aria-checked. Toggle with Space. | Swap the checked marker instantly. |
| 03 | Snap Grid (`snap-grid`) | detent | Named radio group with one checked option and arrow-key selection. | Place the selection on its final grid cell. |
| 04 | Card Fan (`card-fan`) | gentle | Named radio group with one checked option and arrow-key selection. | Keep cards stationary and mark the selected card. |
| 05 | Gooey Tab Bar (`gooey-tab-bar`) | elastic | Roving tabs with aria-selected, arrow keys and associated tabpanels. | Move the active tab marker immediately. |
| 06 | Blocks Scale (`blocks-scale`) | snappy | Named progress indicator with min, max and current value. Omit the value for indeterminate progress. Reading-order content has no tab stop. | Show the current block count without scaling. |
| 07 | Stretch Toggle (`stretch-toggle`) | elastic | Named switch with aria-checked. Toggle with Space. | Set the final thumb position on change. |
| 08 | Merge Drops (`merge-drops`) | elastic | Expose the final text in a polite atomic status region. Hide intermediate animation frames. Reading-order content has no tab stop. | Present the merged state and its text immediately. |
| 09 | Paper Plane (`paper-plane`) | snappy | Named native button. Activate with Enter or Space. | Show the send result without flight. |
| 10 | Detent Dial (`detent-dial`) | detent | Named range with min, max and current value. Arrow keys step and Home/End select endpoints. | Set the indicated detent directly. |
| 11 | Domino Row (`domino-row`) | tactile | Named progress indicator with min, max and current value. Omit the value for indeterminate progress. Reading-order content has no tab stop. | Set all completed segments at once. |
| 12 | Pebble Rating (`pebble-rating`) | tactile | Named radio group with one checked option and arrow-key selection. | Mark the selected rating immediately. |
| 13 | Jelly Pad (`jelly-pad`) | elastic | Named native button. Activate with Enter or Space. | Use a static pressed state. |
| 14 | Swipe Confirm (`swipe-confirm`) | detent | Named native button. Activate with Enter or Space. Provide the same confirm action without swiping. | Commit immediately on activation and display confirmation. |
| 15 | Bookmark (`bookmark`) | snappy | Named toggle button with aria-pressed and a stable label. Enter or Space toggles. | Swap the saved marker immediately. |
| 16 | Depth Stack (`depth-stack`) | gentle | Named radio group with one checked option and arrow-key selection. | Show the selected item without depth travel. |
| 17 | Menu Morph (`menu-morph`) | snappy | Menu button with aria-haspopup and aria-expanded. Arrow keys navigate menuitems and Escape restores focus. | Switch the icon and menu visibility instantly. |
| 18 | Elastic String (`elastic-string`) | elastic | Named range with min, max and current value. Arrow keys step and Home/End select endpoints. | Update the value with a stationary track. |
| 19 | Ripple Pad (`ripple-pad`) | tactile | Named native button. Activate with Enter or Space. | Indicate activation without an expanding ripple. |
| 20 | Worm Dots (`worm-dots`) | elastic | Roving tabs with aria-selected, arrow keys and associated tabpanels. | Mark the current page without stretching. |
| 21 | Download Ring (`download-ring`) | gentle | Named progress indicator with min, max and current value. Omit the value for indeterminate progress. Reading-order content has no tab stop. | Update the ring to the current value immediately. |
| 22 | Leaf Tabs (`leaf-tabs`) | tactile | Roving tabs with aria-selected, arrow keys and associated tabpanels. | Show the chosen tab and panel immediately. |
| 23 | Bell Toggle (`bell-toggle`) | tactile | Named switch with aria-checked. Toggle with Space. | Use a stationary notification-state icon. |
| 24 | Ink Switch (`ink-switch`) | gentle | Named switch with aria-checked. Toggle with Space. | Show the checked state without spreading ink. |
| 25 | Rocker Switch (`rocker-switch`) | detent | Named switch with aria-checked. Toggle with Space. | Set the labelled switch state immediately. |
| 26 | Scrub Wave (`scrub-wave`) | detent | Named range with min, max and current value. Arrow keys step and Home/End select endpoints. | Update the playhead and time directly. |
| 27 | Squash Play (`squash-play`) | tactile | Named toggle button with aria-pressed and a stable label. Enter or Space toggles. | Switch playback state without scaling. |
| 28 | Rubber Search (`rubber-search`) | elastic | Named native search input. Preserve typing, selection and keyboard submission. | Keep the search field fixed while editing. |
| 29 | Odometer (`odometer`) | snappy | Expose the final text in a polite atomic status region. Hide intermediate animation frames. Reading-order content has no tab stop. | Display and expose the final number once. |
| 30 | Tide Progress (`tide-progress`) | gentle | Named progress indicator with min, max and current value. Omit the value for indeterminate progress. Reading-order content has no tab stop. | Show the current fill level without waves. |
| 31 | Eclipse Half (`eclipse-half`) | gentle | Named switch with aria-checked. Toggle with Space. | Show the chosen appearance immediately. |
| 32 | Magnet Grid (`magnet-grid`) | tactile | Named radio group with one checked option and arrow-key selection. | Keep items fixed and show the current selection. |
| 33 | Checklist (`checklist`) | snappy | Named group of labelled native checkboxes. Space toggles the focused item. | Set checkbox markers immediately. |
| 34 | Flip Coin (`flip-coin`) | elastic | Named native button. Activate with Enter or Space. | Expose the chosen face immediately. |
| 35 | Radial Menu (`radial-menu`) | snappy | Menu button with aria-haspopup and aria-expanded. Arrow keys navigate menuitems and Escape restores focus. | Show all menu items in their final positions. |
| 36 | Dot Revolve (`dot-revolve`) | gentle | Named progress indicator with min, max and current value. Omit the value for indeterminate progress. Reading-order content has no tab stop. | Use a stationary indicator while the operation is pending. |
