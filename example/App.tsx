import {
  createNavigation,
  Navigation,
  Stack,
  Tabs,
  type TabScreenOptions,
} from "@rn-tools/navigation";
import { createRenderTreeStore, RenderTree } from "@rn-tools/core";
import { createToasts, ToastsProvider, useToasts } from "@rn-tools/toasts";
import * as React from "react";
import { Text, View, Button, Pressable } from "react-native";

const navigation = createNavigation();
const toastsRenderTreeStore = createRenderTreeStore();
const toasts = createToasts(toastsRenderTreeStore);

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
    <RenderTree store={toastsRenderTreeStore}>
      <ToastsProvider toasts={toasts}>
        <Navigation navigation={navigation}>
          <Tabs id="main-tabs" screens={tabScreens} tabbarPosition="bottom" />
        </Navigation>
      </ToastsProvider>
    </RenderTree>
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
      <View style={{ marginTop: 24 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "600",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Toasts
        </Text>
        <Button
          title="Toast from top (3s)"
          onPress={() =>
            toasts.show(
              <ToastContent message="Hello from the top!" position="top" />,
              {
                position: "top",
                durationMs: 3000,
              },
            )
          }
        />
        <Button
          title="Toast from bottom (5s)"
          onPress={() =>
            toasts.show(
              <ToastContent
                message="Hello from the bottom!"
                position="bottom"
              />,
              {
                position: "bottom",
                durationMs: 5000,
              },
            )
          }
        />
        <Button
          title="Persistent toast (no auto-dismiss)"
          onPress={() =>
            toasts.show(
              <ToastContent
                message="I won't go away on my own!"
                position="top"
              />,
              {
                position: "top",
                durationMs: 0,
                id: "persistent",
              },
            )
          }
        />
        <Button title="Dismiss top toast" onPress={() => toasts.dismiss()} />
        <Button
          title='Dismiss latest "top" toast'
          onPress={() => toasts.dismiss("top")}
        />
        <Button
          title='Dismiss latest "bottom" toast'
          onPress={() => toasts.dismiss("bottom")}
        />
        <Button
          title="Dismiss all toasts"
          onPress={() => toasts.dismissAll()}
        />
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

function ToastContent({
  message,
  position,
}: {
  message: string;
  position: "top" | "bottom";
}) {
  const toasts = useToasts();

  return (
    <View
      style={{
        margin: 16,
        padding: 16,
        backgroundColor: "#fff",
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "#ddd",
      }}
    >
      <Text style={{ color: "#111", fontSize: 16, fontWeight: "600" }}>
        {message}
      </Text>
      <Button title="Dismiss" onPress={() => toasts.dismiss(position)} />
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
      <Button
        title="Autosized sheet"
        onPress={() => navigation.present(<SheetContent label="Auto-sized" />)}
      />
      <Button
        title="Snap points sheet"
        onPress={() =>
          navigation.present(<SheetContent label="Snap points" />, {
            snapPoints: [300, 500],
          })
        }
      />
    </View>
  );
}
