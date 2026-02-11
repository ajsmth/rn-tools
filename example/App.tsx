import {
  createNavigation,
  Navigation,
  Stack,
  Tabs,
  type TabScreenOptions,
} from "@rn-tools/navigation";
import * as React from "react";
import { Text, View, Button, Pressable } from "react-native";

const navigation = createNavigation();

const tabScreens: TabScreenOptions[] = [
  {
    id: "home",
    screen: <Stack id="home" rootScreen={<HomeScreen />} />,
    tab: TabButton,
  },
  {
    id: "explore",
    screen: <Stack id="explore" rootScreen={<ExploreScreen />} />,
    tab: TabButton,
  },
  {
    id: "settings",
    screen: <SettingsScreen />,
    tab: TabButton,
  },
];

export default function App() {
  return (
    <Navigation navigation={navigation}>
      <Tabs id="main-tabs" screens={tabScreens} tabbarPosition="top" />
    </Navigation>
  );
}

function TabButton({
  id,
  isActive,
  onPress,
}: {
  id: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const label = id.charAt(0).toUpperCase() + id.slice(1);
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: "center",
        paddingVertical: 12,
      }}
    >
      <Text
        style={{
          fontSize: 14,
          fontWeight: isActive ? "bold" : "normal",
          color: isActive ? "#007AFF" : "#8E8E93",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Home</Text>
      <Button
        title="Push screen"
        onPress={() => {
          navigation.pushScreen(
            <DetailScreen title="Pushed Screen" count={1} />,
          );
        }}
      />
    </View>
  );
}

function ExploreScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Explore</Text>
      <Button
        title="Push screen"
        onPress={() => {
          navigation.pushScreen(
            <DetailScreen title="Explore Detail" count={1} />,
          );
        }}
      />
    </View>
  );
}

function SettingsScreen() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Settings</Text>
      <Button
        title="Push screen"
        onPress={() => {
          navigation.pushScreen(
            <DetailScreen title="Settings Detail" count={1} />,
          );
        }}
      />
    </View>
  );
}

function DetailScreen({ title, count }: { title: string; count: number }) {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>{title}</Text>
      <Text style={{ fontSize: 16, color: "#666", marginTop: 8 }}>
        Screen #{count}
      </Text>
      <Button
        title="Push another"
        onPress={() => {
          navigation.pushScreen(
            <DetailScreen title="Pushed Screen" count={count + 1} />,
          );
        }}
      />
      <Button title="Pop screen" onPress={() => navigation.popScreen()} />
    </View>
  );
}
