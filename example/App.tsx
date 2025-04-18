import {
  navigation,
  Stack,
  defaultTabbarStyle,
  Tabs,
} from "@rn-tools/navigation";
import { BottomSheet } from "@rn-tools/sheets";
import * as React from "react";
import {
  Text,
  View,
  TouchableOpacity,
  Button,
  ScrollView,
  TextInput,
  FlatList,
} from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import { NavigationExamples } from "./src/navigation-examples";
// navigation.setDebugModeEnabled(true);

export default function App() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <View className="flex-1 pt-24">
      <View className="flex-1">
        <Button title="Show sheet" onPress={() => setIsOpen(!isOpen)} />

        <BottomSheet
          isOpen={isOpen}
          onOpenChange={setIsOpen}
          openToIndex={1}
          onStateChange={(event) => console.log({ event })}
          snapPoints={[400, 600, 750]}
          appearanceAndroid={{
            dimAmount: 0,
            cornerRadius: 32.0,
            backgroundColor: "#ffffff",
          }}
          appearanceIOS={{
            cornerRadius: 16.0,
            grabberVisible: true,
            backgroundColor: "#ffffff",
          }}
        >
          {isOpen && <MyContent />}
        </BottomSheet>
      </View>
    </View>
  );
}

const data = Array.from({ length: 50 }).map((i, index) => `Item ${index}`);

function MyContent() {
  return (
    <View className="bg-white flex-1 rounded-lg">
      <TextInput placeholder="Wowow" />
      <FlatList
        nestedScrollEnabled
        renderItem={({ item }) => (
          <TextInput placeholder={`Placeholder item ${item}`} />
        )}
        data={data}
      />
    </View>
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
