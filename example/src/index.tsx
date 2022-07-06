import * as React from "react";
import { ScreenProps, Router, navigate } from "@rn-toolkit/navigation";

import { View, Text, Heading, Pressable } from "../styles";

export function MenuContainer() {
  return (
    <View
      styles="flex-1 justify-center"
      // TODO: babel plugin for tailwind
      selectors={{ light: "bg-red-500", dark: "bg-blue-500" }}
    >
      <Menu />
    </View>
  );
}

export function Menu() {
  return (
    <View>
      <MyButton
        title="Push screen"
        onPress={() => {
          navigate("/hi");
        }}
      />

      <MyButton title="Push bottom sheet" onPress={() => {}} />

      <MyButton title="Push modal" onPress={() => {}} />

      <MyButton title="Push toast" onPress={() => {}} />
    </View>
  );
}

function MyScreen(props: ScreenProps<{ title: string }>) {
  return (
    <Router
      rank={props.focused ? 2 : 1}
      routes={{
        "/hi": async () => {
          console.log("INNER THIRD!");
          return false;
        },
      }}
    >
      <View styles="bg-white flex-1 items-center pt-48">
        <MyButton title="Pop" onPress={() => props.pop()} />
        <MyButton
          title="Update header"
          onPress={() => props.setHeaderProps({ title: props.title })}
        />
        <MyButton
          title="Update screen"
          onPress={() =>
            props.setScreenProps({ style: { backgroundColor: "red" } })
          }
        />

        <MyButton title="Navigate" onPress={() => navigate("/hi")} />
        {/* <Menu /> */}
      </View>
    </Router>
  );
}

function MyButton({ onPress, title }: any) {
  return (
    <Pressable onPress={onPress} styles="py-2 px-4 items-center">
      <Text styles="text-lg font-medium">{title}</Text>
    </Pressable>
  );
}

function MyBottomSheet(props: any) {
  return (
    <View styles="flex-1">
      <MyButton
        title="Push screen"
        onPress={() => {
          // Stack.push(MyScreen, { headerProps: { title: "Heyo" } });
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
