import * as React from "react";
import {
  View,
  Button,
  Text,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import tw from "./styles";

import {
  Container,
  BottomSheet,
  Modal,
  Stack,
  Toast,
  useStack,
  useModal,
  useBottomSheet,
  useToast,
  BottomSheetOptions,
  BottomSheetProps,
  ScreenProps,
  createStack,
} from "@rn-toolkit/ui";


function Tabs({ children }: any) {
  const [activeIndex, setActiveIndex] = React.useState(0);

  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={tw("flex-1")}>{children[activeIndex] || null}</View>

      <View style={tw("flex-row pb-12")}>
        <TouchableOpacity
          style={tw("flex-1")}
          onPress={() => setActiveIndex(0)}
        >
          <Text style={tw("text-center py-2")}>Tab 1</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={tw("flex-1 border")}
          onPress={() => setActiveIndex(1)}
        >
          <Text style={tw("text-center")}>Tab 2</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const Stack1 = createStack();
const Stack2 = createStack();

export default function App() {
  return (
    <Container>
      <Tabs>
        <Stack1.Container>
          <MyApp />
        </Stack1.Container>
        <Stack2.Container>
          <MyApp />
        </Stack2.Container>
      </Tabs>
    </Container>
  );
}

function MyApp() {
  return (
    <View style={tw("bg-white flex-1 items-center justify-center")}>
      <Menu />
    </View>
  );
}

function Menu() {
  const stack = useStack();

  return (
    <View>
      <Button
        title="Push screen"
        onPress={() => {
          stack.push(MyScreen, { headerProps: { title: "Heyo" } });
        }}
      />

      <Button
        title="Push bottom sheet"
        onPress={() => {
          BottomSheet.push(MyBottomSheet, {
            snapPoints: [500, 900],
          });
        }}
      />

      <Button
        title="Push modal"
        onPress={() => {
          Modal.push(MyModal);
        }}
      />

      <Button
        title="Push toast"
        onPress={() => {
          Toast.push(MyToast, { duration: 1000, distanceFromBottom: 250 });
        }}
      />
    </View>
  );
}

function MyScreen(props: ScreenProps) {
  return (
    <View style={tw("bg-white flex-1 items-center pt-48")}>
      <Button title="Pop" onPress={() => props.pop()} />
      <Menu />
    </View>
  );
}

function MyButton({ onPress, title }: any) {
  return (
    <Pressable onPress={onPress} style={tw("py-2 px-4 items-center")}>
      <Text style={tw("text-lg font-medium")}>{title}</Text>
    </Pressable>
  );
}

function MyBottomSheet(props: BottomSheetProps) {
  return (
    <View style={tw("flex-1")}>
      <MyButton
        title="Push screen"
        onPress={() => {
          Stack.push(MyScreen, { headerProps: { title: "Heyo" } });
        }}
      />
    </View>
  );
}

function MyModal() {
  return (
    <View style={tw("bg-white rounded-lg mx-4 p-4 shadow-medium")}>
      <Menu />
    </View>
  );
}

function MyToast() {
  return (
    <View style={tw("bg-green-500 mx-4 py-4 border-1 rounded-md")}>
      <Text style={tw("text-center text-lg font-semibold text-white")}>Hi</Text>
    </View>
  );
}
