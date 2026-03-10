# Android Overlay Architecture Notes

## Goal

Document the temporary Android overlay implementation work, why each change was needed, how it differs from iOS, and what a cleaner final cross-platform design should look like.

This is intentionally a design/debug note, not a final implementation spec.

## Problem Statement

The iOS overlay implementation was already working because it uses a top-level passthrough `UIWindow` and custom hit testing in [RNToolsOverlayView.swift](/Users/andrewsmith/dev/rn-tools/packages/core/ios/RNToolsOverlayView.swift).

Android initially used a full-screen dialog-based overlay in [RNToolsOverlayView.kt](/Users/andrewsmith/dev/rn-tools/packages/core/android/src/main/java/expo/modules/rntoolscore/RNToolsOverlayView.kt), which correctly sat above the app and above sheet dialogs, but it captured touch events across the entire screen.

We needed Android behavior with these properties:

- overlay must sit above the rest of the app
- overlay must sit above Android sheet dialogs
- untouched regions should remain tappable
- notification lanes should only occupy bounded top/bottom regions

## What We Learned

### 1. A full-screen Android dialog blocks touches

The original Android overlay approach used a full-screen `AppCompatDialog`.

That created the right z-order, but it captured the touch stream at the window level before the underlying activity could receive it.

Important consequence:

- React Native `pointerEvents="box-none"` is not enough on Android when the overlay lives in a separate full-screen dialog window.
- `pointerEvents` only affects React view-tree hit testing inside the overlay window.
- It does not make the Android window itself input-transparent.

### 2. A portal/in-window strategy would improve touch passthrough, but lose z-order over dialogs

We considered a portal-style approach similar to `react-native-teleport`, where overlay content is reparented into another `ViewGroup` in the same window.

That would likely solve touch passthrough more naturally, but it would not reliably render above native dialogs such as `BottomSheetDialog`.

Because notifications/surfaces need to sit above sheets, we stayed with the higher-priority dialog/window strategy.

### 3. Bounded overlay windows are the viable Android compromise

The workable Android strategy was:

- keep overlay surfaces in separate high-priority dialogs
- do not make those dialogs full-screen unless necessary
- bound each dialog to the visible overlay region

For notifications, that means:

- one bounded dialog for the top lane
- one bounded dialog for the bottom lane

This allows the middle of the screen to remain tappable while still rendering above sheets.

## Architectural Changes We Made

### A. Added an Android native overlay module

Files:

- [RNToolsOverlayModule.kt](/Users/andrewsmith/dev/rn-tools/packages/core/android/src/main/java/expo/modules/rntoolscore/RNToolsOverlayModule.kt)
- [RNToolsOverlayView.kt](/Users/andrewsmith/dev/rn-tools/packages/core/android/src/main/java/expo/modules/rntoolscore/RNToolsOverlayView.kt)
- [RNToolsOverlayRootView.kt](/Users/andrewsmith/dev/rn-tools/packages/core/android/src/main/java/expo/modules/rntoolscore/RNToolsOverlayRootView.kt)
- [styles.xml](/Users/andrewsmith/dev/rn-tools/packages/core/android/src/main/res/values/styles.xml)
- [expo-module.config.json](/Users/andrewsmith/dev/rn-tools/packages/core/expo-module.config.json)

What changed:

- added a new Android Expo module named `RNToolsOverlay`
- added a native overlay view backed by `AppCompatDialog`
- added a React RootView-style host for overlay children
- registered the Android module in Expo module config
- added Android dialog theme resources and required Android dependency wiring

Why:

- Android had no native `RNToolsOverlay` implementation.
- We needed an Expo view manager capable of hosting React children in a separate dialog.
- We also needed a RootView-like container for React touch/pointer dispatch.

### B. Added bounded-window props to the Android overlay

Files:

- [RNToolsOverlayModule.kt](/Users/andrewsmith/dev/rn-tools/packages/core/android/src/main/java/expo/modules/rntoolscore/RNToolsOverlayModule.kt)
- [RNToolsOverlayView.kt](/Users/andrewsmith/dev/rn-tools/packages/core/android/src/main/java/expo/modules/rntoolscore/RNToolsOverlayView.kt)
- [overlay.tsx](/Users/andrewsmith/dev/rn-tools/packages/core/src/overlay.tsx)

Props added:

- `contentHeight`
- `offsetTop`

What changed:

- Android overlay now accepts an explicit height for the dialog window
- Android overlay now accepts an explicit top offset for positioning the dialog window
- the JS overlay wrapper exposes those props to native

Why:

- A full-screen overlay dialog blocked touches everywhere.
- We needed the native dialog window itself to be only as large as the overlay region.

### C. Split Android notifications into two overlay windows

File:

- [notifications-client.tsx](/Users/andrewsmith/dev/rn-tools/packages/notifications/src/notifications-client.tsx)

What changed:

- Android notifications stopped rendering both lanes inside one shared overlay instance
- Android now mounts one `Overlay` for the top lane and one `Overlay` for the bottom lane
- each lane gets its own bounded native window

Why:

- Notifications render in both a top lane and a bottom lane.
- A single dialog sized to contain both lanes would effectively cover most of the screen.
- Two separate bounded dialogs preserve touch passthrough in the middle of the screen.

Android-specific structure became:

- top lane -> top bounded `Overlay`
- bottom lane -> bottom bounded `Overlay`

iOS still uses a single overlay window for both lanes.

### D. Matched JS layout bounds to native dialog bounds

Files:

- [overlay.tsx](/Users/andrewsmith/dev/rn-tools/packages/core/src/overlay.tsx)
- [notifications-client.tsx](/Users/andrewsmith/dev/rn-tools/packages/notifications/src/notifications-client.tsx)

What changed:

- Android bounded overlays no longer always use the default `absoluteFill` JS style
- each Android overlay instance gets an explicit JS `top` and `height`
- the JS overlay rectangle is now intended to mirror the native dialog rectangle

Why:

- Native Android dialog bounds alone were not enough.
- The React subtree inside the overlay was still laid out as if it filled the entire screen.
- This caused bottom-lane content to anchor and animate using full-screen coordinates while being clipped by a smaller native dialog.

This was the key discovery of the session.

The fix was:

- when Android overlay bounds are provided, do not force `absoluteFill` in JS
- give each Android overlay instance an explicit JS `top/height` frame matching the native dialog bounds

This made the bottom lane start behaving correctly.

### E. Added lane-specific Android offsets/buffers

Files:

- [notifications-native-view.tsx](/Users/andrewsmith/dev/rn-tools/packages/notifications/src/notifications-native-view.tsx)
- [notifications-client.tsx](/Users/andrewsmith/dev/rn-tools/packages/notifications/src/notifications-client.tsx)

What changed:

- added temporary Android-only lane/window slack
- added a temporary Android-only top debug offset
- added a temporary Android-only bottom content inset
- adjusted top/bottom lane sizing to create breathing room at the edges

Why:

- After matching JS and native bounds, the bottom lane still clipped slightly at the bottom edge.
- The bottom lane needed explicit internal breathing room from the lower edge of the bounded window.

Temporary Android-specific changes included:

- a bottom content inset
- extra lane/window slack
- a top debug offset to validate controlled positioning

These are debugging/prototyping values, not final API decisions.

### F. Stabilized notification measurement enough to debug the layout

File:

- [notifications-slot.tsx](/Users/andrewsmith/dev/rn-tools/packages/notifications/src/notifications-slot.tsx)

What changed:

- notification item heights are now stabilized during a notification’s lifetime
- stale height entries are cleared when notifications unmount
- temporary debug logging/layout probes were added around notification measurement

Why:

- Notification height was being measured from animated/transformed content.
- During animation, repeated `onLayout` updates caused the stored height to shrink.
- That created a layout feedback loop where the lane shrank, content clipped, and measurements kept collapsing.

Temporary mitigation:

- keep per-notification height monotonic during its lifetime
- clean up stale heights when entries are removed

This was a debugging stabilization step, not necessarily the final measurement design.

### G. Stubbed Android safe area to zero temporarily

File:

- [SafeAreaUtils.kt](/Users/andrewsmith/dev/rn-tools/packages/core/android/src/main/java/expo/modules/rntoolscore/SafeAreaUtils.kt)

What changed:

- Android safe area calculation was temporarily replaced with a zero-insets stub

Why:

- Android safe area values were clearly wrong during testing.
- Example observed values were much larger than expected and pushed the overlay content away from the screen edges.
- To isolate overlay layout from safe-area bugs, Android safe area was temporarily stubbed to zero.

This should be reverted once the real safe-area implementation is fixed.

## Why The Bottom Lane Was Broken

The bottom lane failure turned out not to be “bounded dialogs do not work.”

What was actually wrong:

1. The native bottom dialog had bounded size.
2. The React subtree inside it was still using full-screen layout coordinates.
3. Bottom-aligned content was therefore positioning itself relative to a larger coordinate space.
4. The bounded dialog clipped that content.

Symptoms:

- the bottom lane existed
- debug container visuals rendered
- bottom items were effectively laid out too low

The fix that proved the architecture:

- match React overlay frame to native bounded dialog frame

## How Android Now Differs From iOS

### iOS current strategy

File:

- [RNToolsOverlayView.swift](/Users/andrewsmith/dev/rn-tools/packages/core/ios/RNToolsOverlayView.swift)

Characteristics:

- single overlay `UIWindow`
- full-screen
- custom passthrough `hitTest`
- untouched regions can fall through to underlying content
- top and bottom notifications can coexist in the same overlay window

### Android current strategy

Files:

- [RNToolsOverlayView.kt](/Users/andrewsmith/dev/rn-tools/packages/core/android/src/main/java/expo/modules/rntoolscore/RNToolsOverlayView.kt)
- [notifications-client.tsx](/Users/andrewsmith/dev/rn-tools/packages/notifications/src/notifications-client.tsx)

Characteristics:

- separate high-priority dialogs
- bounded to actual overlay regions
- one overlay dialog per lane for notifications
- JS frame must match native dialog frame
- explicit per-lane insets/buffers currently used

### Main divergence

iOS relies on a single full-screen passthrough overlay window.

Android currently relies on multiple bounded non-passthrough overlay windows.

This is the biggest architectural difference.

## How We Could Bring iOS And Android Closer Together

### Option 1. Keep Android bounded-window strategy and move iOS toward it

This is the most structurally similar direction.

Idea:

- iOS notifications also use bounded windows per lane
- top lane gets one bounded overlay window
- bottom lane gets one bounded overlay window
- JS uses the same bounded overlay framing model on both platforms

Benefits:

- more consistent cross-platform architecture
- same conceptual model for top/bottom overlays
- fewer platform-specific layout assumptions

Costs:

- iOS would move away from its simpler current full-screen passthrough model
- more window management on iOS

### Option 2. Keep iOS as-is and treat Android as a deliberate platform-specific implementation

Idea:

- keep iOS single-window passthrough implementation
- keep Android bounded multi-dialog implementation
- align only the public JS API, not the native internals

Benefits:

- less iOS churn
- preserves already-working iOS behavior

Costs:

- more divergence in native architecture
- more platform-specific edge cases

### Option 3. Introduce a cross-platform “bounded overlay lane” abstraction

Idea:

- define the public overlay behavior in terms of bounded regions
- implement those bounded regions using platform-specific primitives
- iOS can still use passthrough windows internally
- Android can use bounded dialogs internally

Benefits:

- shared conceptual API
- native internals remain platform-appropriate
- reduces public API divergence without forcing identical native internals

This is likely the best long-term direction.

## Recommended Final Direction

### Public model

Treat overlay surfaces as bounded overlay regions, not as one implicit full-screen host.

For notifications specifically:

- top notification lane is one bounded overlay region
- bottom notification lane is one bounded overlay region

### Android final implementation

- keep high-priority dialog/window approach
- keep dialogs bounded to content regions
- keep JS frame matched to native dialog frame
- replace temporary debug constants with deliberate lane insets
- replace monotonic measurement hack with proper untransformed measurement
- restore real Android safe-area support

### iOS final implementation

Most likely best path:

- keep current working overlay internals if desired
- but expose/use the same bounded lane model at the JS level
- optionally evolve notifications to mount into distinct bounded lane hosts for parity

This gives conceptual consistency without immediately forcing a risky iOS rewrite.

## Known Temporary / Debug-Only Pieces To Revisit

These should not be treated as final implementation decisions:

- Android debug borders/fills in [RNToolsOverlayView.kt](/Users/andrewsmith/dev/rn-tools/packages/core/android/src/main/java/expo/modules/rntoolscore/RNToolsOverlayView.kt)
- logging in overlay and notifications code
- stubbed Android safe area in [SafeAreaUtils.kt](/Users/andrewsmith/dev/rn-tools/packages/core/android/src/main/java/expo/modules/rntoolscore/SafeAreaUtils.kt)
- temporary top debug offset in [notifications-client.tsx](/Users/andrewsmith/dev/rn-tools/packages/notifications/src/notifications-client.tsx)
- temporary bottom content inset in [notifications-native-view.tsx](/Users/andrewsmith/dev/rn-tools/packages/notifications/src/notifications-native-view.tsx)
- temporary lane/window slack constants in [notifications-client.tsx](/Users/andrewsmith/dev/rn-tools/packages/notifications/src/notifications-client.tsx)
- monotonic height stabilization in [notifications-slot.tsx](/Users/andrewsmith/dev/rn-tools/packages/notifications/src/notifications-slot.tsx)

## Summary

The session established that Android can support overlays above sheets without full-screen touch blocking, but only if:

- the overlay is bounded
- top and bottom lanes use separate overlay windows
- the JS overlay frame matches the native bounded dialog frame

The major insight was that mismatched JS/native bounds, not just dialog sizing, caused the bottom lane failures.

The most promising long-term design is a shared bounded-overlay-region model at the JS level, with platform-specific native implementations underneath.
