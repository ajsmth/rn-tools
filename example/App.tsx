import {
  navigation,
  Stack,
  defaultTabbarStyle,
  Tabs,
} from "@rn-tools/navigation";
import { BottomSheet } from "@rn-tools/sheets";
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
  const [isSecondarySheetVisible, setIsSecondarySheetVisible] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)


  return (
    <View className="flex-1 pt-24">
      <View className="flex-1">
        <Button title="Show sheet" onPress={() => setIsVisible(!isVisible)} />

        <Text>{`isVisible" ${isVisible ? "true" : "false"}`}</Text>
        <Text>{`isDragging" ${isDragging ? "true" : "false"}`}</Text>

        <BottomSheet isVisible={isVisible} onVisibleChange={setIsVisible} onIsDraggingChange={setIsDragging} snapPoints={[500, 600, 800]}>

          <Button title="Hide sheet" onPress={() => setIsVisible(!isVisible)} />
          <Button title="Show sheet" onPress={() => setIsSecondarySheetVisible(true)} />
          <ScrollView
            scrollEnabled={true}
            nestedScrollEnabled
            style={{ flex: 1, borderWidth: 1 }}
            contentContainerStyle={{ paddingBottom: 64 }}
          >
            <Text>Hi</Text>
            <View style={{ height: 4000, backgroundColor: "yellow" }} />
            <Text>Whats up</Text>
          </ScrollView>
        </BottomSheet>
        {/* <BottomSheet isVisible={isSecondarySheetVisible} onVisibleChange={setIsSecondarySheetVisible} snapPoints={[500, 700]}> */}
        {/*   <Text>Nice</Text> */}
        {/*   <Button title="Hide sheet" onPress={() => setIsSecondarySheetVisible(false)} /> */}
        {/*   <View className='flex-1 bg-red-500'> */}
        {/*   </View> */}
        {/* </BottomSheet> */}
      </View>
    </View >
  );
}

function RootScreen() {
  let insets = useSafeAreaInsets();

  return (
    <View className="flex-1 px-4" style={{ paddingTop: insets.top + 64 }}>
      <TouchableOpacity
        onPress={() => navigation.pushScreen(<NavigationExamples />)}
      >
        <Text className="font-semibold t4xt-lg underline">
          Navigation Examples
        </Text>
      </TouchableOpacity>
    </View>
  );
}
