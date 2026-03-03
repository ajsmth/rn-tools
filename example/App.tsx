import {
  createNavigation,
  Navigation,
  Stack,
  Tabs,
  type NotificationInjectedProps,
  type SheetInjectedProps,
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
      <Tabs screens={tabScreens} tabbarPosition="bottom" />
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
          navigation.stack.push(<DetailScreen title="Pushed Screen" count={1} />);
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
            navigation.sheets.present(<SheetContent label="Auto-sized" />)
          }
        />
        <Button
          title="Present sheet (snap points)"
          onPress={() =>
            navigation.sheets.present(<SheetContent label="Snap points" />, {
              snapPoints: [300, 500],
            })
          }
        />
        <Button
          title="Present sheet (id: edit)"
          onPress={() =>
            navigation.sheets.present(<SheetContent label="Edit sheet" />, {
              id: "edit",
            })
          }
        />
        <Button
          title="Dismiss top sheet"
          onPress={() => navigation.sheets.dismiss()}
        />
        <Button
          title='Dismiss by id "edit"'
          onPress={() => navigation.sheets.dismiss("edit")}
        />
        <Button title="Dismiss all" onPress={() => navigation.sheets.dismissAll()} />
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
          Notifications
        </Text>
        <Button
          title="Notification from top (3s)"
          onPress={() =>
            navigation.notifications.present(
              <NotificationContent
                message="Hello from the top!"
                position="top"
              />,
              {
                position: "top",
                durationMs: 3000,
              },
            )
          }
        />
        <Button
          title="Notification from bottom (5s)"
          onPress={() =>
            navigation.notifications.present(
              <NotificationContent
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
          title="Persistent notification (no auto-dismiss)"
          onPress={() =>
            navigation.notifications.present(
              <NotificationContent
                message="I won't go away on my own!"
                position="top"
              />,
              {
                position: "top",
                durationMs: null,
                id: "persistent",
              },
            )
          }
        />
        <Button
          title="Dismiss top notification"
          onPress={() => navigation.notifications.dismiss()}
        />
        <Button
          title='Dismiss latest "top" notification'
          onPress={() => navigation.notifications.dismiss("top")}
        />
        <Button
          title='Dismiss latest "bottom" notification'
          onPress={() => navigation.notifications.dismiss("bottom")}
        />
        <Button
          title="Dismiss all notifications"
          onPress={() => navigation.notificationsStore.dismissAll()}
        />
      </View>
    </View>
  );
}

function SheetContent({
  label,
  dismiss,
}: {
  label: string;
} & SheetInjectedProps) {
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
          navigation.sheets.present(<SheetContent label="Nested sheet" />, {
            snapPoints: [250],
          });
        }}
      />
      <Button title="Dismiss this sheet" onPress={() => dismiss?.()} />
    </View>
  );
}

function NotificationContent({
  message,
  position,
  dismiss,
}: {
  message: string;
  position: "top" | "bottom";
} & NotificationInjectedProps) {
  return (
    <View
      style={{
        marginHorizontal: 12,
        marginVertical: 6,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: "#fff",
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "#ddd",
      }}
    >
      <Text style={{ color: "#111", fontSize: 14, fontWeight: "600" }}>
        {message}
      </Text>
      <Pressable
        onPress={dismiss}
        style={{ marginTop: 8, alignSelf: "flex-start" }}
      >
        <Text style={{ color: "#007AFF", fontSize: 13, fontWeight: "500" }}>
          Dismiss {position}
        </Text>
      </Pressable>
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
          navigation.stack.push(<DetailScreen title="Explore Detail" count={1} />);
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
          navigation.stack.push(<DetailScreen title="Settings Detail" count={1} />);
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
          navigation.stack.push(
            <DetailScreen title="Pushed Screen" count={count + 1} />,
          );
        }}
      />
      <Button title="Pop screen" onPress={() => navigation.stack.pop()} />
      <Button
        title="Autosized sheet"
        onPress={() => navigation.sheets.present(<SheetContent label="Auto-sized" />)}
      />
      <Button
        title="Snap points sheet"
        onPress={() =>
          navigation.sheets.present(<SheetContent label="Snap points" />, {
            snapPoints: [300, 500],
          })
        }
      />
    </View>
  );
}
