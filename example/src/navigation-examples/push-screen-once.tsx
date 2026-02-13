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
  function pushOnce() {
    navigation.push(
      <Stack.Screen>
        <MyScreen title="Pushed screen">
          <Button title="Pop screen" onPress={pop} />
        </MyScreen>
      </Stack.Screen>,
      {
        screenId: "unique-key",
      }
    );
  }

  function pop() {
    navigation.pop();
  }

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>{title}</Text>
      <Button title="Push screen" onPress={pushOnce} />
      {children}
    </View>
  );
}
