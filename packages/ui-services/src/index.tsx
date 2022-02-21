import * as React from "react";
import { Animated, View, Pressable, StyleSheet } from "react-native";

import { createAsyncStack, Stack, StackItem } from "./create-async-stack";
import { useStackItems } from "./use-stack-items";
import { useBackgroundColor } from "./use-background-color";

import { BottomSheetItem } from "./bottom-sheet";
import { ModalItem } from "./modal";
import { createScreenStack } from "./screen";
import { createToastStack } from "./toast";

import {
  BottomSheetOptions,
  BottomSheetProps,
  BottomSheetStackItem,
  ModalOptions,
  ModalStackItem,
  StackItemComponent,
} from "./types";

// TODO - generic store for updating screens / items?
// TODO - pass animation configs to any push() call

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FullScreenStackItem = ModalStackItem | BottomSheetStackItem;

function createServices() {
  const { ScreenContainer, Screens } = createScreenStack();
  const { Toast, ToastStack } = createToastStack();

  const fullScreenStack = createAsyncStack<FullScreenStackItem>();

  function onDismissed() {
    fullScreenStack.pop();
  }

  function Provider({ children }: any) {
    const fullScreenItems = useStackItems(fullScreenStack);

    const activeItems = fullScreenItems.filter(
      (i) => i.status === "pushing" || i.status === "settled"
    );

    // @ts-ignore
    const backgroundColor = useBackgroundColor(fullScreenStack);

    return (
      <View style={StyleSheet.absoluteFill}>
        <ScreenContainer>{children}</ScreenContainer>
        <AnimatedPressable
          style={[StyleSheet.absoluteFill, { backgroundColor }]}
          onPress={onDismissed}
          pointerEvents={activeItems.length > 0 ? "auto" : "none"}
        >
          {fullScreenItems.map((item) => renderFullscreenItem(item))}
        </AnimatedPressable>
        <ToastStack />
      </View>
    );
  }

  const Modal = {
    push: (component: StackItemComponent, options: ModalOptions = {}) => {
      const { backgroundColor = "rgba(0,0,0,0.5)", ...rest } = options;
      return fullScreenStack.push({
        backgroundColor,
        ...rest,
        component,
        type: "modal",
      });
    },
    pop: fullScreenStack.pop,
  };

  const BottomSheet = {
    push: (component: StackItemComponent, options: BottomSheetOptions) => {
      const { backgroundColor = "rgba(0,0,0,0.5)", ...bottomSheetProps } =
        options;
      return fullScreenStack.push({
        type: "bottom-sheet",
        component,
        backgroundColor,
        bottomSheetProps,
      });
    },
    pop: fullScreenStack.pop,
  };

  return {
    Provider,
    Stack: Screens,
    Modal,
    BottomSheet,
    Toast,
  };
}

function renderFullscreenItem(item: StackItem<FullScreenStackItem>) {
  if (item.data.type === "modal") {
    return <ModalItem {...item} />;
  }

  if (item.data.type === "bottom-sheet") {
    return <BottomSheetItem {...(item as BottomSheetProps)} />;
  }

  return null;
}

const { Stack, Modal, BottomSheet, Provider, Toast } = createServices();

export { createServices, Stack, Modal, Provider, BottomSheet, Toast };
