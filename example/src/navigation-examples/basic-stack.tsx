import { Stack, navigation } from "@rn-tools/navigation";
import * as React from "react";
import { View, Text, Button } from "react-native";


export function BasicStack() {
  return <Stack.Navigator rootScreen={<MyScreen title="Root Screen" />} />;
}

function MyScreen({
  title,
  showPopButton = false,
}: {
  title: string;
  showPopButton?: boolean;
}) {
  function pushScreen() {
    navigation.pushScreen(
      <Stack.Screen>
        <MyScreen title="Pushed screen" showPopButton />
      </Stack.Screen>
    );
  }

  function popScreen() {
    navigation.popScreen();
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{title}</Text>
      <Button title="Push screen" onPress={pushScreen} />
      {showPopButton && <Button title="Pop screen" onPress={popScreen} />}
    </View>
  );
}