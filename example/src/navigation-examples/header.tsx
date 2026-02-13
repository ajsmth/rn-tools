import { navigation, Stack } from "@rn-tools/navigation";
import * as React from "react";
import { Button, View, TextInput, Text } from "react-native";

export function HeaderExample() {
  return (
    <View>
      <Button
        title="Push screen with header"
        onPress={() => navigation.push(<MyScreenWithHeader />)}
      />
    </View>
  );
}

function MyScreenWithHeader() {
  let [title, setTitle] = React.useState("");

  return (
    <Stack.Screen
      header={
        <Stack.Header
          title={title}
          backTitle="Custom back title"
          backTitleFontSize={16}
          hideBackButton={false}
        >
          <Stack.HeaderRight>
            <Text>Custom right text!</Text>
          </Stack.HeaderRight>
        </Stack.Header>
      }
    >
      <View
        style={{
          flex: 1,
          alignItems: "center",
          paddingVertical: 48,
        }}
      >
        <TextInput
          style={{ fontSize: 26, fontWeight: "semibold" }}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter header text"
        />
      </View>
    </Stack.Screen>
  );
}
