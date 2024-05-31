import {
  Tabs,
  navigation,
  Stack,
  defaultTabbarStyle,
} from "@rn-tools/navigation";
import * as React from "react";
import { View, Text, Button } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function BasicTabs() {
  return <Stack.Navigator rootScreen={<MyTabs />} />;
}

function MyTabs() {
  let insets = useSafeAreaInsets();

  let tabbarStyle = React.useMemo(() => {
    return {
      ...defaultTabbarStyle,
      bottom: insets.bottom,
    }
  }, [insets.bottom]) 

  return (
    <Tabs.Navigator
      tabbarPosition="bottom"
      tabbarStyle={tabbarStyle}
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
  showPopButton = false,
  bg,
}: {
  title: string;
  showPopButton?: boolean;
  bg?: string;
}) {
  function pushScreen() {
    navigation.pushScreen(
      <Stack.Screen>
        <MyScreen title="Pushed screen" showPopButton />
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
      {showPopButton && <Button title="Pop screen" onPress={popScreen} />}
    </View>
  );
}