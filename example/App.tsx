import {
  createNavigation,
  NavigationProvider,
  Stack,
} from "@rn-tools/navigation";
import * as React from "react";
import { Text, View, Button } from "react-native";

const navigation = createNavigation();

export default function App() {
  return (
    <NavigationProvider navigation={navigation}>
      <Stack id="main" rootScreen={<HomeScreen />} />
    </NavigationProvider>
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
            <DetailScreen
              title="Pushed Screen"
              count={count + 1}
            />,
          );
        }}
      />
      <Button
        title="Pop screen"
        onPress={() => navigation.popScreen()}
      />
    </View>
  );
}
