import * as React from "react";
import { View, Button, Text } from "react-native";

import {
  UIServicesProvider,
  BottomSheet,
  Modal,
  Stack,
  Toast,
  StackItem,
} from "@rn-toolkit/ui-services";

export default function App() {
  return (
    <UIServicesProvider>
      <MyApp />
    </UIServicesProvider>
  );
}

function MyApp() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Menu />
    </View>
  );
}

function Menu() {
  return (
    <View>
      <Text>Hi</Text>
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

function MyScreen(props: StackItem) {
  return (
    <View style={{ flex: 1, backgroundColor: "white", paddingTop: 100 }}>
      <Text>Hi</Text>
      <Button title="Pop" onPress={() => props.pop()} />
      <Menu />
    </View>
  );
}

function MyBottomSheet() {
  return (
    <View>
      <Menu />
    </View>
  );
}

function MyModal() {
  return (
    <View style={{ backgroundColor: "white" }}>
      <Text>Hi</Text>
      <Menu />
    </View>
  );
}

function MyToast() {
  return (
    <View style={{ backgroundColor: "white" }}>
      <Text>Hi</Text>
      <Menu />
    </View>
  );
}
