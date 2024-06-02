import { DeepLinks, navigation, Stack, Tabs } from "@rn-tools/navigation";
import * as React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import * as Linking from "expo-linking";

export function DeepLinksExample() {
  // You'll likely want to use Expo's Linking API to get the current URL and path
  // let url = Linking.useURL()
  // let { path } = Linking.parse(url)

  // But it's easier to test hardcoded strings for the sake of this example
  let path = "/testing/home/item/6";

  return (
    <DeepLinks
      path={path}
      handlers={[
        {
          path: "/testing/home/item/:itemId",
          handler: (params: { itemId: string }) => {
            let itemId = params.itemId;

            // Go to home tab
            navigation.setTabIndex(0);

            // Push the screen we want
            navigation.pushScreen(
              <Stack.Screen>
                <MyScreen title={`Item: ${itemId}`} />
              </Stack.Screen>
            );
          },
        },
      ]}
    >
      <MyTabs />
    </DeepLinks>
  );
}

function MyTabs() {
  return (
    <Tabs.Navigator
      tabbarPosition="bottom"
      screens={[
        {
          key: "1",
          screen: (
            <Stack.Navigator
              rootScreen={<MyScreen bg="red" title="Home screen" isRoot />}
            />
          ),
          tab: ({ isActive }) => <MyTab text="Home" isActive={isActive} />,
        },
        {
          key: "2",
          screen: (
            <Stack.Navigator
              rootScreen={<MyScreen bg="blue" title="Search screen" isRoot />}
            />
          ),
          tab: ({ isActive }) => <MyTab text="Search" isActive={isActive} />,
        },
        {
          key: "3",
          screen: (
            <Stack.Navigator
              rootScreen={
                <MyScreen bg="purple" title="Settings screen" isRoot />
              }
            />
          ),
          tab: ({ isActive }) => <MyTab text="Settings" isActive={isActive} />,
        },
      ]}
    />
  );
}

function MyTab({ isActive, text }: { isActive?: boolean; text: string }) {
  return (
    <View
      style={{
        padding: 16,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: isActive ? "bold" : "normal" }}>
        {text}
      </Text>
    </View>
  );
}

function MyScreen({
  bg = "white",
  title = "",
  isRoot = false,
}: {
  title?: string;
  bg?: string;
  isRoot?: boolean;
}) {
  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <View className="flex-1 items-center justify-center gap-4">
        <Text style={{ fontSize: 26, fontWeight: "semibold" }}>{title}</Text>

        {!isRoot && (
          <TouchableOpacity
            onPress={() => {
              navigation.popScreen();
            }}
          >
            <Text>Pop</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
