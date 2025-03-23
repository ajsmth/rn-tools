import {
  navigation,
  Stack,
  defaultTabbarStyle,
  Tabs,
} from "@rn-tools/navigation";
import { NativeSheet } from "@rn-tools/sheets";
import * as React from "react";
import { Text, View, TouchableOpacity, Button, ScrollView } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { NavigationExamples } from "./src/navigation-examples";
navigation.setDebugModeEnabled(true);

export default function App() {
  const [isVisible, setIsVisible] = React.useState(false);
  return (

    <View className='flex-1'><View className="flex-1">
      <Button title="Show sheet" onPress={() => setIsVisible(!isVisible)} />
      <Text>{`isVisible" ${isVisible ? 'true' : 'false'}`}</Text>

      <NativeSheet isVisible={isVisible} onVisibleChange={setIsVisible}>
        <Button title="Hide sheet" onPress={() => setIsVisible(!isVisible)} />
        <ScrollView className='border h-[400px]' scrollEnabled={true}>
          <Text>Hi</Text>
          <View style={{ height: 1000, backgroundColor: 'yellow' }} />
          <Text>Hey</Text>
        </ScrollView>
      </NativeSheet>

    </View></View>
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
