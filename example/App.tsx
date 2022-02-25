import * as React from "react";

import {
  Container,
  BottomSheet,
  Modal,
  Stack,
  Toast,
  useStack,
  useModal,
  useBottomSheet,
  useToast,
  BottomSheetOptions,
  BottomSheetProps,
  ScreenProps,
  createStack,
} from "@rn-toolkit/ui";

import { ThemeProvider } from "@rn-toolkit/primitives";

import { View, Text, Pressable } from "./styles";

function Tabs({ children }: any) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <View styles="absolute inset-0">
      <View styles="flex-1">{children[activeIndex]}</View>

      <View styles="flex-1 pb-12">
        <Pressable styles="flex-1" onPress={() => setActiveIndex(0)}>
          <Text styles="text-center py-2">Tab 1</Text>
        </Pressable>
        <Pressable styles="flex-1 border" onPress={() => setActiveIndex(1)}>
          <Text styles="text-center">Tab 2</Text>
        </Pressable>
      </View>
    </View>
  );
}

const Stack1 = createStack();
const Stack2 = createStack();

export default function App() {
  return (
    <ThemeProvider>
      <Container>
        <View styles="flex-1 items-center justify-center">
          <Menu />
        </View>
      </Container>
    </ThemeProvider>
  );
}

function MyApp() {
  return (
    <View styles="bg-red-500 flex-1 items-center justify-center">
      <Menu />
    </View>
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
