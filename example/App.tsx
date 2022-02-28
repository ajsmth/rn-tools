import * as React from "react";

import {
  Provider,
  BottomSheet,
  Modal,
  Stack,
  Toast,
  useStack,
  BottomSheetProps,
  ScreenProps,
} from "@rn-toolkit/ui";

import { ThemeProvider } from "@rn-toolkit/tailwind";
import { View, Text, Heading, Pressable } from "./styles";

export default function App() {
  return (
    <ThemeProvider themePreference="light">
      <Provider>
        <View
          styles="flex-1 justify-center"
          selectors={{ light: "bg-red-500", dark: "bg-blue-500" }}
        >
          <Menu />
        </View>
      </Provider>
    </ThemeProvider>
  );
}

function Menu() {
  const stack = useStack();

  return (
    <View>
      <MyButton
        title="Push screen"
        onPress={() => {
          stack.push(MyScreen, { headerProps: { title: "Heyo" } });
        }}
      />

      <MyButton
        title="Push bottom sheet"
        onPress={() => {
          BottomSheet.push(MyBottomSheet, {
            snapPoints: [500, 900],
          });
        }}
      />

      <MyButton
        title="Push modal"
        onPress={() => {
          Modal.push(MyModal);
        }}
      />

      <MyButton
        title="Push toast"
        onPress={() => {
          Toast.push(MyToast, { duration: 1000 });
        }}
      />
    </View>
  );
}

function MyScreen(props: ScreenProps) {
  return (
    <View styles="bg-white flex-1 items-center pt-48">
      <MyButton title="Pop" onPress={() => props.pop()} />
      <Menu />
    </View>
  );
}

function MyButton({ onPress, title }: any) {
  return (
    <Pressable onPress={onPress} styles="py-2 px-4 items-center">
      <Text styles="text-lg font-medium">{title}</Text>
    </Pressable>
  );
}

function MyBottomSheet(props: BottomSheetProps) {
  return (
    <View styles="flex-1">
      <MyButton
        title="Push screen"
        onPress={() => {
          Stack.push(MyScreen, { headerProps: { title: "Heyo" } });
        }}
      />
    </View>
  );
}

function MyModal() {
  return (
    <View styles="bg-white rounded-lg mx-4 p-4 shadow-medium">
      <Menu />
    </View>
  );
}

function MyToast() {
  return (
    <View styles="bg-green-500 mx-4 py-4 border-1 rounded-md">
      <Text styles="text-center text-lg font-semibold text-white">Hi</Text>
    </View>
  );
}
