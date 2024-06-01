import { Stack, navigation } from "@rn-tools/navigation";
import * as React from "react";
import { View, Text, Button } from "react-native";

export function PushScreenOnce() {
  return <Stack.Navigator rootScreen={<MyScreen title="Root Screen" />} />;
}

function MyScreen({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  function pushScreenOnce() {
    navigation.pushScreen(
      <Stack.Screen>
        <MyScreen title="Pushed screen">
          <Button title="Pop screen" onPress={popScreen} />
        </MyScreen>
      </Stack.Screen>,
      {
        screenId: "unique-key",
      }
    );
  }

  function popScreen() {
    navigation.popScreen();
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{title}</Text>
      <Button title="Push screen" onPress={pushScreenOnce} />
      {children}
    </View>
  );
}
