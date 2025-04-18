# @rn-tools/sheets

An expo module for rendering native bottom sheet components in iOS and Android. 

Uses SwiftUI's sheet API and Android's BottomSheetDialog component to render React Native children in a modal bottom sheet

## Motivation

- Better performance and responsiveness than JS based solutions

- Native OS handling for gestures, keyboard, and navigation

## Installation

`yarn add @rntools/sheets`


As with most non-core expo modules this requires a new native build


## Usage 

```
import { BottomSheet } from '@rn-tools/sheets'

export default function App() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <View className="flex-1">
        <Button title="Show sheet" onPress={() => setIsOpen(!isOpen)} />

        <BottomSheet
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          openToIndex={1}
          onStateChange={(event) => console.log({ event })}
          snapPoints={[400, 600]}
        >
          <MyContent />
        </BottomSheet>
    </View>
  );
}
```

## Props 

- `isOpen / onOpenChange` - Controller props for toggling the sheet open and closed - this is required 

- `openToIndex` - will open the bottom sheet to the defined snapPoint index 

- `onStateChange` - callback to track the internal state of the sheet. The following events are emitted:

    - { type: "HIDDEN" } 
    - { type: "OPEN", payload: { index: number }}
    - { type: "SETTLING" }
    - { type: "DRAGGING" }

- `snapPoints` - a list of sizes that the sheet will "snap" to 

    - if you do not specify snapPoints, the sheet will size to its content. This means any flex based layout needs to have an explicit container size

    - **Android will only use the first two snapPoints!**
    


## Caveats

- (Android) can have a maximum of 2 snap points

- (Android) use the `nestedScrollEnabled` prop for nested scrollviews
