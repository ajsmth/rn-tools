import { BottomSheet } from "@rn-tools/sheets";
import * as React from "react";
import {
  Text,
  View,
  Button,
  TextInput,
  FlatList,
} from "react-native";
import { useKeyboardHeight } from "@rn-tools/core";

const data = Array.from({ length: 50 }).map((i, index) => `Item ${index}`);

export function BottomSheetExample() {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <View className="flex-1 pt-24">
      <View className="flex-1">
        <Button title="Show sheet" onPress={() => setIsOpen(!isOpen)} />

        <BottomSheet
          isOpen={isOpen}
          setIsOpen={setIsOpen}
          initialIndex={1}
          canDismiss
          onStateChange={(event) => console.log({ event })}
          snapPoints={[400, 600, 1200]}
          appearanceAndroid={{
            dimAmount: 0,
            cornerRadius: 32.0,
            backgroundColor: "#ffffff",
          }}
          appearanceIOS={{
            cornerRadius: 16.0,
            grabberVisible: true,
            backgroundColor: "#ffffff",
          }}
        >
          {isOpen && <SheetContent setIsOpen={setIsOpen} />}
        </BottomSheet>
      </View>
    </View>
  );
}

function SheetContent({ setIsOpen }: { setIsOpen: (isOpen: boolean) => void }) {
  const handleClose = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const keyboardHeight = useKeyboardHeight();

  return (
    <View className="bg-white absolute inset-0 border rounded-lg px-4">
      <View className="py-4 border">
        <Text style={{ fontWeight: "bold", fontSize: 24 }}>
          Native bottom sheets! Wahoo
        </Text>
        <Button onPress={() => handleClose()} title="Close" />
      </View>

      <FlatList
        nestedScrollEnabled
        className="flex-1"
        renderItem={({ item }) => (
          <TextInput placeholder={`Text input ${item}`} />
        )}
        data={data}
        contentContainerStyle={{ paddingBottom: keyboardHeight }}
      />
    </View>
  );
}
