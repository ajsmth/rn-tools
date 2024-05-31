import { navigation, Stack } from "@rn-tools/navigation";
import * as React from "react";
import { Text, View, TouchableOpacity } from "react-native";

import { AuthenticationExample } from "./authentication";
import { BasicStack } from "./basic-stack";
import { BasicTabs } from "./basic-tabs";
import { NestedStackTabs } from "./nested-stack-tabs";
import { PushScreenOnce } from "./push-screen-once";

export function NavigationExamples() {
  return (
    <Stack.Screen>
      <Stack.Header title="Navigation" />

      <View className="flex-1 pt-28" style={{ gap: 8 }}>
        <NavLink label="Basic Stack" screen={<BasicStack />} />
        <NavLink label="Basic Tabs" screen={<BasicTabs />} />
        <NavLink label="Stacks in Tabs" screen={<NestedStackTabs />} />
        <NavLink label="Push screen once" screen={<PushScreenOnce />} />
        <NavLink label="Authentication" screen={<AuthenticationExample />} />
      </View>
    </Stack.Screen>
  );
}

function NavLink({
  label,
  screen,
}: {
  label: string;
  screen: React.ReactElement<unknown>;
}) {
  return (
    <TouchableOpacity
      className="px-4"
      onPress={() =>
        navigation.pushScreen(
          <Stack.Screen>
            <Stack.Header title={label} />
            {screen}
          </Stack.Screen>
        )
      }
    >
      <Text className="font-semibold text-lg underline">{label}</Text>
    </TouchableOpacity>
  );
}
