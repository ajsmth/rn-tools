import * as React from "react";
import { View, Button, Text, Pressable } from "react-native";
import tw from "./styles";

import {
  Provider,
  BottomSheet,
  Modal,
  Stack,
  Toast,
} from "@rn-toolkit/ui-services";

export default function App() {
  return (
    <Provider>
      <MyApp />
    </Provider>
  );
}

function MyApp() {
  return (
    <View style={tw("bg-white flex-1 items-center justify-center")}>
      <Menu />
    </View>
  );
}

function Menu() {
  return (
    <View>
      <Button
        title="Push screen"
        onPress={() => {
          Stack.push(MyScreen, { headerProps: { title: "Heyo" } });
        }}
      />

      <Button
        title="Push bottom sheet"
        onPress={() => {
          BottomSheet.push(MyBottomSheet, {
            snapPoints: [400, 600],
          });
        }}
      />

      <Button
        title="Push modal"
        onPress={() => {
          Modal.push(MyModal);
        }}
      />

      <Button
        title="Push toast"
        onPress={() => {
          Toast.push(MyToast);
        }}
      />
    </View>
  );
}

function MyScreen(props: any) {
  return (
    <View style={tw("bg-white flex-1 items-center pt-48")}>
      <Button title="Pop" onPress={() => props.pop()} />
      <Menu />
    </View>
  );
}

function MyButton({ onPress, title }: any) {
  return (
    <Pressable onPress={onPress} style={tw("py-2 px-4 items-center")}>
      <Text style={tw("text-lg font-medium")}>{title}</Text>
    </Pressable>
  );
}

function MyBottomSheet() {
  return (
    <View style={tw("flex-1")}>
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
    <View style={tw("bg-white rounded-lg mx-4 p-4 shadow-medium")}>
      <Menu />
    </View>
  );
}

function MyToast() {
  return (
    <View style={tw("bg-green-500 mx-4 py-4 border-1 rounded-md")}>
      <Text style={tw("text-center text-lg font-semibold text-white")}>Hi</Text>
    </View>
  );
}
