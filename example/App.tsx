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
    screen: <Stack rootScreen={<HomeScreen />} />,
    tab: TabButton,
  },
  {
    id: "explore",
    screen: <Stack rootScreen={<ExploreScreen />} />,
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
          navigation.push(<DetailScreen title="Pushed Screen" count={1} />);
        }}
      />
      <View style={{ marginTop: 24 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Sheets
        </Text>
        <Button
          title="Present sheet (auto-size)"
          onPress={() =>
            navigation.present(<SheetContent label="Auto-sized" />)
          }
        />
        <Button
          title="Present sheet (snap points)"
          onPress={() =>
            navigation.present(<SheetContent label="Snap points" />, {
              snapPoints: [300, 500],
            })
          }
        />
        <Button
          title="Present sheet (id: edit)"
          onPress={() =>
            navigation.present(<SheetContent label="Edit sheet" />, {
              id: "edit",
            })
          }
        />
        <Button
          title="Dismiss top sheet"
          onPress={() => navigation.dismiss()}
        />
        <Button
          title='Dismiss by id "edit"'
          onPress={() => navigation.dismiss("edit")}
        />
        <Button title="Dismiss all" onPress={() => navigation.dismissAll()} />
      </View>
    </View>
  );
}

function SheetContent({ label }: { label: string }) {
  return (
    <View style={{ padding: 24 }}>
      <Text style={{ fontSize: 20, fontWeight: "bold", marginBottom: 12 }}>
        {label}
      </Text>
      <Text style={{ fontSize: 14, color: "#666", marginBottom: 16 }}>
        This sheet was presented imperatively.
      </Text>
      <Button
        title="Present nested sheet"
        onPress={() => {
          navigation.present(<SheetContent label="Nested sheet" />, {
            snapPoints: [250],
          });
        }}
      />
      <Button title="Dismiss this sheet" onPress={() => navigation.dismiss()} />
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
          navigation.push(<DetailScreen title="Explore Detail" count={1} />);
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
          navigation.push(<DetailScreen title="Settings Detail" count={1} />);
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
          navigation.push(
            <DetailScreen title="Pushed Screen" count={count + 1} />,
          );
        }}
      />
      <Button title="Pop screen" onPress={() => navigation.pop()} />
    </View>
  );
}
