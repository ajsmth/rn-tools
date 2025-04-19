# @rn-tools/sheets

An expo module for rendering native bottom sheet components in iOS and Android. 

Uses SwiftUI's sheet API and Android's BottomSheetDialog to render React Native children in a modal bottom sheet


https://github.com/user-attachments/assets/426c77e6-74c6-4748-8010-477267fa9433


## Motivation

- Better performance and responsiveness than JS based solutions

- Native OS handling for gestures, keyboard, and navigation

## Installation

`yarn add @rntools/sheets expo-build-properties`

Update your minimum iOS deployment target to 16 in `app.json`: 

```json
{
    "plugins": [
      [
        "expo-build-properties",
        {
         "ios": {
            "deploymentTarget": "16.4"
          }
        }
      ]
}

```

As with most non-core expo modules this requires a new native build


## Usage 

```tsx
import { BottomSheet } from '@rn-tools/sheets'

export default function App() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <View className="flex-1">
       <Button title="Show sheet" onPress={() => setIsOpen(true)} />

       <BottomSheet
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          openToIndex={1}
          onStateChange={(event) => console.log({ event })}
          snapPoints={[400, 600, 750]}
          appearanceAndroid={{
            dimAmount: 0,
            cornerRadius: 32.0,
            backgroundColor: "#ffffff",
          }}
          appearanceIOS={{
            cornerRadius: 16.0,
            grabberVisible: true,
            backgroundColor: "#ffffff",
          }}
        >
          {isOpen && <MyContent />}
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
