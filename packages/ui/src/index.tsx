import * as React from "react";
import { Animated, View, Pressable, StyleSheet } from "react-native";

import { createAsyncStack, Stack, StackItem } from "./create-async-stack";
import { useStackItems } from "./use-stack-items";
import { useBackgroundColor } from "./use-background-color";

import {
  BottomSheetItem,
  BottomSheetStackProvider,
  createService as createBottomSheetService,
  useBottomSheet,
} from "./bottom-sheet";
import {
  ModalItem,
  ModalStackProvider,
  useModal,
  createService as createModalService,
} from "./modal";
import { createStack, useStack } from "./stack";
import { createToastStack, useToast } from "./toast";

import {
  BottomSheetStackItem,
  FullScreenStackItem,
  ModalStackItem,
  BottomSheetOptions,
  BottomSheetProps,
  ModalOptions,
  ModalProps,
  ToastOptions,
  ToastProps,
  ScreenOptions,
  ScreenProps,
} from "./types";

// TODO - generic store for updating screens props like header title etc
// TODO - pass animation configs to any push() call

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function createServices() {
  const Stack = createStack();
  const { Toast, ToastStack, ToastProvider } = createToastStack();

  const fullScreenStack = createAsyncStack<FullScreenStackItem>();

  function onDismissed() {
    fullScreenStack.pop();
  }

  function Container({ children }: any) {
    const fullScreenItems = useStackItems(fullScreenStack);

    const activeItems = fullScreenItems.filter(
      (i) => i.status === "pushing" || i.status === "settled"
    );

    // @ts-ignore
    const backgroundColor = useBackgroundColor(fullScreenStack);

    return (
      <Stack.Provider>
        <BottomSheetStackProvider
          stack={fullScreenStack as Stack<BottomSheetStackItem>}
        >
          <ModalStackProvider stack={fullScreenStack as Stack<ModalStackItem>}>
            <ToastProvider>
              <View style={StyleSheet.absoluteFill}>
                <Stack.Container>{children}</Stack.Container>
                <AnimatedPressable
                  style={[StyleSheet.absoluteFill, { backgroundColor }]}
                  onPress={onDismissed}
                  pointerEvents={activeItems.length > 0 ? "auto" : "none"}
                >
                  {fullScreenItems.map((item) =>
                    renderFullscreenItem(item, fullScreenStack)
                  )}
                </AnimatedPressable>
                <ToastStack />
              </View>
            </ToastProvider>
          </ModalStackProvider>
        </BottomSheetStackProvider>
      </Stack.Provider>
    );
  }

  const Modal = createModalService(fullScreenStack as Stack<ModalStackItem>);

  const BottomSheet = createBottomSheetService(
    fullScreenStack as Stack<BottomSheetStackItem>
  );

  return {
    Container,
    Stack,
    Modal,
    BottomSheet,
    Toast,
  };
}

function renderFullscreenItem(
  item: StackItem<FullScreenStackItem>,
  stack: Stack<FullScreenStackItem>
) {
  if (item.data.type === "modal") {
    return (
      <ModalItem {...(item as StackItem<ModalStackItem>)} pop={stack.pop} />
    );
  }

  if (item.data.type === "bottom-sheet") {
    return (
      <BottomSheetItem
        {...(item as StackItem<BottomSheetStackItem>)}
        pop={stack.pop}
      />
    );
  }

  return null;
}

const { Stack, Modal, BottomSheet, Container, Toast } = createServices();

export {
  Stack,
  Modal,
  Container,
  BottomSheet,
  Toast,
  useModal,
  useToast,
  useBottomSheet,
  useStack,
  createStack,
  BottomSheetOptions,
  BottomSheetProps,
  ModalOptions,
  ModalProps,
  ToastOptions,
  ToastProps,
  ScreenOptions,
  ScreenProps,
};
