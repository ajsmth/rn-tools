import { ScreenProps } from "@rn-toolkit/navigation";
import { BottomSheetProps, ToastProps, ModalProps } from "@rn-toolkit/ui";
import * as React from "react";
import { View, Text, Pressable } from "react-native";
import {
  AppProviders,
  Stack,
  Toasts,
  BottomSheets,
  Modals,
} from "./AppProviders";

export default function App() {
  return (
    <AppProviders>
      <View styles="flex-1 bg-rose-500 items-center justify-center">
        <Pressable
          onPress={() =>
            Toasts.push(Toast, {
              duration: 2000,
              distanceFromTop: 64,
              props: { message: "Hello." },
            })
          }
        >
          <Text styles="text-xl font-bold">Hi.</Text>
        </Pressable>
        <Pressable
          styles="mt-8"
          onPress={() => {
            BottomSheets.push(BottomSheet, {
              snapPoints: [200, 500],
              props: { message: "Hey." },
            });
          }}
        >
          <Text styles="text-xl font-bold">Hello.</Text>
        </Pressable>
        <Pressable
          styles="mt-8"
          onPress={() =>
            Modals.push(Modal, {
              props: { message: "Hi." },
            })
          }
        >
          <Text styles="text-xl font-bold">Hey.</Text>
        </Pressable>
        <Pressable
          styles="mt-8"
          onPress={() => {
            Stack.push(Screen, { props: { message: "Howdy." } });
          }}
        >
          <Text styles="text-xl font-bold">Ola.</Text>
        </Pressable>
      </View>
    </AppProviders>
  );
}

function Toast(props: ToastProps<{ message: string }>) {
  const { message } = props;
  return (
    <View styles="mx-8 py-6 px-4 bg-white shadow rounded-lg">
      <Text styles="font-semibold text-sm text-center">{message}</Text>
    </View>
  );
}

function BottomSheet(props: BottomSheetProps<{ message: string }>) {
  const { message } = props;
  return (
    <View styles="mx-8 py-6 px-4 bg-white shadow rounded-lg">
      <Text styles="font-semibold text-lg text-center">{message}</Text>
    </View>
  );
}

function Modal(props: ModalProps<{ message: string }>) {
  const { message } = props;
  return (
    <View styles="mx-8 py-6 px-4 bg-white shadow rounded-lg">
      <Text styles="font-semibold text-sm text-center">{message}</Text>
    </View>
  );
}

function Screen(props: ScreenProps<{ message: string }>) {
  const { message, setHeaderProps } = props;
  return (
    <View styles="bg-white flex-1 items-center justify-center">
      <Pressable onPress={() => setHeaderProps({ title: message })}>
        <Text styles="font-semibold text-lg text-center">{message}</Text>
      </Pressable>
    </View>
  );
}
