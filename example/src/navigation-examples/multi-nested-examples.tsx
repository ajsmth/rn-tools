import { navigation, Stack, Tabs } from "@rn-tools/navigation";
import * as React from "react";
import { Text, View, TouchableOpacity } from "react-native";

export function MultiNested() {
  return <MyTabs />
}

function MyTabs() {
  return (
    <Tabs.Navigator
      tabbarPosition="bottom"
      screens={[
        {
          key: "1",
          screen: <MyStack colorClassName="bg-teal-400" />,
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
    <Stack.Navigator
      rootScreen={<MyScreen colorClassName={colorClassName} />}
    />
  );
}

function MyScreen({
  colorClassName = "bg-white",
  children,
}: {
  colorClassName?: string;
  children?: React.ReactNode;
}) {
  return (
    <View className={"flex-1" + " " + colorClassName}>
      {children || (
        <View className="flex-1 gap-4">
          <TouchableOpacity
            onPress={() =>
              navigation.pushScreen(
                <Stack.Screen>
                  <MyScreen />
                </Stack.Screen>
              )
            }
          >
            <Text className="font-medium text-lg">Push Screen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.pushScreen(
                <Stack.Screen
                  stackPresentation="modal"
                  stackAnimation="slide_from_bottom"
                  gestureEnabled={true}
                >
                  <Stack.Navigator rootScreen={<MyScreen />} />
                </Stack.Screen>
              )
            }
          >
            <Text className="font-medium text-lg">Push Modal</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.pushScreen(
                <Stack.Screen>
                  <MyTabs />
                </Stack.Screen>
              )
            }
          >
            <Text className="font-medium text-lg">Push Tabs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              navigation.popScreen();
            }}
          >
            <Text className="font-medium text-lg">Pop</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.setTabIndex(1);
            }}
          >
            <Text className="font-medium text-lg">Set tab index</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              navigation.reset();
            }}
          >
            <Text className="font-medium text-lg">Reset</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
