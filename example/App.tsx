import * as React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

import {
  navigation,
  Stack,
  StackNavigator,
  TabNavigator,
  defaultTabbarStyle,
  setDebugModeEnabled
} from "@rn-toolkit/navigation";


export default function App() {
  return (
    <SafeAreaProvider>
      <MyTabs />
    </SafeAreaProvider>
  );
}

function MyTabs() {
  const { bottom } = useSafeAreaInsets();

  const tabbarStyle = React.useMemo(() => {
    return {
      ...defaultTabbarStyle,
      bottom,
    };
  }, []);

  return (
    <TabNavigator
      tabbarPosition="bottom"
      tabbarStyle={tabbarStyle}
      screens={[
        {
          key: "1",
          screen: <MyStack count={1} colorClassName="bg-red-500" />,
          tab: ({ isActive }) => (
            <View className="flex-1 p-4 items-center">
              <Text className={isActive ? "font-bold" : "font-medium"}>1</Text>
            </View>
          ),
        },
        {
          key: "2",
          screen: <MyStack count={2} colorClassName="bg-blue-500" />,
          tab: ({ isActive }) => (
            <View className="p-4 items-center">
              <Text className={isActive ? "font-bold" : "font-medium"}>2</Text>
            </View>
          ),
        },
        {
          key: "3",
          screen: <MyStack count={3} colorClassName="bg-purple-500" />,
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

function MyStack({
  count,
  colorClassName,
}: {
  count: number;
  colorClassName?: string;
}) {
  return (
    <StackNavigator
      rootScreen={<MyScreen count={count} colorClassName={colorClassName} />}
    />
  );
}

function MyScreen({
  count,
  colorClassName = "",
  children,
}: {
  count: number;
  colorClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <View className={"flex-1" + " " + colorClassName}>
      {children || (
        <View className="flex-1 items-center justify-center gap-4">
          <Text>{count}</Text>
          <TouchableOpacity
            onPress={() =>
              navigation.pushScreen(
                <Stack.Screen>
                  <MyScreen count={8} colorClassName="bg-white" />
                </Stack.Screen>
              )
            }
          >
            <Text>Push</Text>
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
        </View>
      )}
    </View>
  );
}
