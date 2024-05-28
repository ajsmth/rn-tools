import {
  navigation,
  Stack,
  StackNavigator,
  TabNavigator,
  defaultTabbarStyle,
  setDebugModeEnabled,
} from "@rn-toolkit/navigation";
import * as React from "react";
import { Text, View, TouchableOpacity } from "react-native";
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

setDebugModeEnabled(true);

export default function App() {
  return (
    <React.StrictMode>
      <SafeAreaProvider>
        <MyTabs />
      </SafeAreaProvider>
    </React.StrictMode>
  );
}

function MyTabs() {
  const { bottom } = useSafeAreaInsets();

  const tabbarStyle = React.useMemo(() => {
    return {
      ...defaultTabbarStyle,
      bottom,
    };
  }, [bottom]);

  return (
    <TabNavigator
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
    <StackNavigator rootScreen={<MyScreen colorClassName={colorClassName} />} />
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
