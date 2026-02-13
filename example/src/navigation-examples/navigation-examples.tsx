import { navigation, Stack } from "@rn-tools/navigation";
import * as React from "react";
import { Text, View, TouchableOpacity } from "react-native";

import { AuthenticationExample } from "./authentication";
import { BasicStack } from "./basic-stack";
import { BasicTabs } from "./basic-tabs";
import { DeepLinksExample } from "./deep-links";
import { HeaderExample } from "./header";
import { MultiNested } from "./multi-nested-examples";
import { NestedStackTabs } from "./nested-stack-tabs";
import { PreventGoingBack } from "./prevent-going-back";
import { PushScreenOnce } from "./push-screen-once";

export function NavigationExamples() {
  return (
    <Stack.Screen style={{ paddingVertical: 48, backgroundColor: "white" }}>
      <Stack.Header title="Navigation" />

      <View className="flex-1" style={{ gap: 8 }}>
        <NavLink label="Basic Stack" screen={<BasicStack />} />
        <NavLink label="Basic Tabs" screen={<BasicTabs />} />
        <NavLink label="Stacks in Tabs" screen={<NestedStackTabs />} />
        <NavLink label="Push screen once" screen={<PushScreenOnce />} />
        <NavLink label="Authentication" screen={<AuthenticationExample />} />
        <NavLink label="Header" screen={<HeaderExample />} />
        <NavLink label="Prevent going back" screen={<PreventGoingBack />} />
        <NavLink label="Deep Links" screen={<DeepLinksExample />} />
        <NavLink label="Multi nested" screen={<MultiNested />} />
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
      onPress={() => {
        navigation.push(
          <Stack.Screen>
            <Stack.Header title={label} />
            {screen}
          </Stack.Screen>
        );
      }}
    >
      <Text className="font-semibold text-lg underline">{label}</Text>
    </TouchableOpacity>
  );
}
