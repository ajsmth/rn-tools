# @rn-tools/sheets

An expo module for rendering native bottom sheet components in iOS and Android. 

Uses native iOS sheet presentation and Android's BottomSheetDialog to render React Native children in a modal bottom sheet.

Supports stacking multiple sheets on top of each other

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
            "deploymentTarget": "16.0"
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
          setIsOpen={setIsOpen}
          initialIndex={1}
          onStateChange={(event) => console.log({ event })}
          canDismiss={true}
          onDismissPrevented={() => console.log("dismiss prevented")}
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

- `isOpen / setIsOpen` - Controller props for toggling the sheet open and closed - this is required 

- `initialIndex` - will open the bottom sheet to the defined snapPoint index 

- `onStateChange` - callback to track the internal state of the sheet. The following events are emitted:

    - { type: "HIDDEN" } 
    - { type: "OPEN", payload: { index: number }}

- `canDismiss` - controls whether the user can dismiss the sheet via swipe/back/gesture (default: true)

- `onDismissPrevented` - called when a dismiss gesture is blocked by `canDismiss={false}`

- `snapPoints` - a list of sizes that the sheet will "snap" to 

    - if you do not specify snapPoints, the sheet will size to its content. This means any flex based layout needs to have an explicit container size

    - **Android will only use the first two snapPoints!**
    


## Caveats

- iOS uses an overlay window to present the sheet.

- Default appearance values if not provided:
  - iOS: grabber visible, white background, system default corner radius unless set
  - Android: white background, 32dp top corner radius, dim amount 0.56

- (Android) can have a maximum of 2 snap points

- (Android) use the `nestedScrollEnabled` prop for nested scrollviews
