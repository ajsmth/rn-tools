import { Tabs, navigation, Stack } from "@rn-tools/navigation";
import * as React from "react";
import { View, Text, Button } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

export function BasicTabs() {
  return (
    <SafeAreaProvider>
      <Stack.Navigator rootScreen={<MyTabs />} />
    </SafeAreaProvider>
  );
}

function MyTabs() {
  return (
    <Tabs.Navigator
      tabbarPosition="bottom"
      tabbarStyle={{ backgroundColor: "blue" }}
      screens={[
        {
          key: "1",
          screen: <MyScreen title="Screen 1" bg="red" />,
          tab: ({ isActive }) => <MyTab isActive={isActive}>1</MyTab>,
        },
        {
          key: "2",
          screen: <MyScreen title="Screen 2" bg="blue" />,
          tab: ({ isActive }) => <MyTab isActive={isActive}>2</MyTab>,
        },
        {
          key: "3",
          screen: <MyScreen title="Screen 3" bg="purple" />,
          tab: ({ isActive }) => <MyTab isActive={isActive}>3</MyTab>,
        },
      ]}
    />
  );
}

function MyTab({
  children,
  isActive,
}: {
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <View style={{ padding: 16, alignItems: "center" }}>
      <Text
        style={isActive ? { fontWeight: "bold" } : { fontWeight: "normal" }}
      >
        {children}
      </Text>
    </View>
  );
}

function MyScreen({
  title,
  children,
  bg,
}: {
  title: string;
  children?: React.ReactNode;
  bg?: string;
}) {
  function pushScreen() {
    navigation.pushScreen(
      <Stack.Screen>
        <MyScreen title="Pushed screen" bg={bg}>
          <Button title="Pop screen" onPress={popScreen} />
        </MyScreen>
      </Stack.Screen>
    );
  }

  function popScreen() {
    navigation.popScreen();
  }

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: bg || "white",
      }}
    >
      <Text>{title}</Text>
      <Button title="Push screen" onPress={pushScreen} />
      {children}
    </View>
  );
}
