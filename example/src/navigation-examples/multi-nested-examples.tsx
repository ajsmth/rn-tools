import { navigation, Stack, Tabs } from "@rn-tools/navigation";
import * as React from "react";
import { Text, View, TouchableOpacity } from "react-native";

export function MultiNested() {
  return <Stack.Navigator rootScreen={<MyTabs />} />;
}
function MyTabs() {
  return (
    <Tabs.Navigator
      tabbarPosition="bottom"
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
