import {
  navigation,
  Stack,
  StackNavigator,
  TabNavigator,
  defaultTabbarStyle,
} from "@rn-toolkit/navigation";
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

function MyTabs() {
  let { bottom } = useSafeAreaInsets();

  let tabbarStyle = React.useMemo(() => {
    return {
      ...defaultTabbarStyle,
      bottom,
    };
  }, [bottom]);

  return (
    <Tabs.Navigator
      tabbarPosition="bottom"
      tabbarStyle={tabbarStyle}
      screens={[
        {
          key: "1",
          screen: <MyStack colorClassName="bg-red-500" />,
          tab: ({ isActive }) => (
            <View className="flex-1 p-4 items-center">
              <Text className={isActive ? "font-bold" : "font-medium"}>1</Text>
            </View>
          ),
        },
        {
          key: "2",
          screen: <MyStack colorClassName="bg-blue-500" />,
          tab: ({ isActive }) => (
            <View className="p-4 items-center">
              <Text className={isActive ? "font-bold" : "font-medium"}>2</Text>
            </View>
          ),
        },
        {
          key: "3",
          screen: <MyStack colorClassName="bg-purple-500" />,
          tab: ({ isActive }) => (
            <View className="p-4 items-center">
              <Text className={isActive ? "font-bold" : "font-medium"}>3</Text>
            </View>
          ),
        },
      ]}
    />
  );
}

function MyStack({ colorClassName }: { colorClassName?: string }) {
  return (
    <Stack.Navigator rootScreen={<MyScreen colorClassName={colorClassName} />} />
  );
}

function MyScreen({
  colorClassName = "white",
  children,
}: {
  colorClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <View className={"flex-1" + " " + colorClassName}>
      {children || (
        <View className="flex-1 items-center justify-center gap-4">
          <TouchableOpacity
            onPress={() =>
              navigation.pushScreen(
                <Stack.Screen>
                  <MyTabs />
                </Stack.Screen>
              )
            }
          >
            <Text>Push Tabs</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() =>
              navigation.pushScreen(
                <Stack.Screen>
                  <MyScreen />
                </Stack.Screen>
              )
            }
          >
            <Text>Push Screen</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.popScreen(2);
            }}
          >
            <Text>Pop</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.setTabIndex(1);
            }}
          >
            <Text>Set index</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.reset();
            }}
          >
            <Text>Reset</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
