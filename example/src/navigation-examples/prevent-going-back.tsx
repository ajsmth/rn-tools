import { navigation, Stack } from "@rn-tools/navigation";
import * as React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  Button,
  View,
  Alert,
} from "react-native";

export function PreventGoingBack() {
  return (
    <Button
      title="Push screen"
      onPress={() => navigation.pushScreen(<MyScreen />)}
    />
  );
}

function MyScreen() {
  let [input, setInput] = React.useState("");

  let canGoBack = input.length === 0;

  let onPressBackButton = React.useCallback(() => {
    if (canGoBack) {
      navigation.popScreen();
    } else {
      Alert.alert("Are you sure you want to go back?", "", [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: () => navigation.popScreen(),
        },
      ]);
    }
  }, [canGoBack]);

  return (
    <Stack.Screen
      preventNativeDismiss={!canGoBack}
      nativeBackButtonDismissalEnabled={!canGoBack}
      gestureEnabled={canGoBack}
      header={
        <Stack.Header title="Prevent going back">
          <Stack.HeaderLeft>
            <TouchableOpacity
              onPress={onPressBackButton}
              style={{ opacity: canGoBack ? 1 : 0.4 }}
            >
              <Text>Back</Text>
            </TouchableOpacity>
          </Stack.HeaderLeft>
        </Stack.Header>
      }
    >
      <View style={{ paddingVertical: 48, paddingHorizontal: 16, gap: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "medium" }}>
          Enter some text and try to go back
        </Text>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Enter some text"
          onSubmitEditing={() => setInput("")}
        />
        <Button title="Submit" onPress={() => setInput("")} />
      </View>
    </Stack.Screen>
  );
}
