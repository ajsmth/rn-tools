import { Stack, navigation } from "@rn-tools/navigation";
import * as React from "react";
import { View, Text, Button } from "react-native";

export function BasicStack() {
  return <Stack.Navigator rootScreen={<MyScreen title="Root Screen" />} />;
}

function MyScreen({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  function pushScreen() {
    navigation.pushScreen(
      <Stack.Screen>
        <MyScreen title="Pushed screen">
          <Button title="Pop screen" onPress={popScreen} />
        </MyScreen>
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
      {children}
    </View>
  );
}
