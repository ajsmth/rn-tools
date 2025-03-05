import {
  navigation,
  Stack,
  defaultTabbarStyle,
  Tabs,
} from "@rn-tools/navigation";
import * as React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { NavigationExamples } from "./src/navigation-examples";
navigation.setDebugModeEnabled(true);

export default function App() {
  return (
    <SafeAreaProvider>
      <Stack.Navigator rootScreen={<RootScreen />} />
    </SafeAreaProvider>
  );
}

function RootScreen() {
  let insets = useSafeAreaInsets();

  return (
    <View className="flex-1 px-4" style={{ paddingTop: insets.top + 64 }}>
      <TouchableOpacity
        onPress={() => navigation.pushScreen(<NavigationExamples />)}
      >
        <Text className="font-semibold text-lg underline">
          Navigation Examples
        </Text>
      </TouchableOpacity>
    </View>
  );
}
