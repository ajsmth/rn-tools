import * as React from "react";
import { Animated, View, Pressable, StyleSheet } from "react-native";

import { BottomSheetItem, BottomSheetProps } from "./bottom-sheet";
import { createAsyncStack, Stack, StackItem } from "./create-async-stack";
import { ModalItem, ModalProps } from "./modal";
import { createScreenStack } from "./screen";
import { ToastItem, ToastProps } from "./toast";
import { useStackItems } from "./use-stack-items";

// TODO - generic store for updating screens / items?
// TODO - pass animated value to each view to stay in sync

type UIServicesProps = {
  children: React.ReactNode;
};

type UIServicesBaseProps = {
  backgroundColor?: string;
};

type ItemByType = ModalProps | BottomSheetProps | ToastProps;
type Item = UIServicesBaseProps & ItemByType;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function createUIServices() {
  const { ScreenContainer, Screens } = createScreenStack();

  const UI = createAsyncStack<Item>();

  function onDismissed() {
    UI.pop();
  }

  function UIServicesProvider({ children }: UIServicesProps) {
    const items = useStackItems(UI);

    const activeItems = items.filter(
      (i) => i.status === "pushing" || i.status === "settled"
    );

    const backgroundColor = useBackgroundColor(UI);

    return (
      <View style={StyleSheet.absoluteFill}>
        <ScreenContainer>{children}</ScreenContainer>
        <AnimatedPressable
          onPress={onDismissed}
          pointerEvents={activeItems.length > 0 ? "auto" : "none"}
          style={[StyleSheet.absoluteFillObject, { backgroundColor }]}
        >
          {items.map((item) => renderStackItem(item))}
        </AnimatedPressable>
      </View>
    );
  }

  const Modal = {
    push: (
      component: React.JSXElementConstructor<StackItem>,
      options: ModalProps["modalProps"] & UIServicesBaseProps = {}
    ) => {
      const { backgroundColor = "rgba(0,0,0,0.5)", ...rest } = options;

      return UI.push({
        type: "modal",
        backgroundColor,
        modalProps: rest,
        component,
      });
    },
    pop: UI.pop,
    getState: UI.getState,
  };

  const BottomSheet = {
    push: (
      component: React.JSXElementConstructor<StackItem>,
      options: BottomSheetProps["bottomSheetProps"] & UIServicesBaseProps
    ) => {
      const { backgroundColor = "rgba(0,0,0,0.5)", ...rest } = options;

      return UI.push({
        type: "bottom-sheet",
        bottomSheetProps: rest,
        backgroundColor,
        component,
      });
    },
    pop: UI.pop,
    getState: UI.getState,
  };

  const Toast = {
    push: (
      component: React.JSXElementConstructor<StackItem>,
      options: ToastProps["toastProps"] & UIServicesBaseProps = {}
    ) => {
      const { backgroundColor = "rgba(0,0,0,0.0)", ...rest } = options;

      return UI.push({
        type: "toast",
        toastProps: rest,
        backgroundColor,
        component,
      });
    },
    pop: UI.pop,
    getState: UI.getState,
  };

  return {
    UIServicesProvider,
    Stack: Screens,
    BottomSheet,
    Modal,
    Toast,
  };
}

function renderStackItem(item: StackItem<Item>) {
  if (item.data.type === "modal") {
    return <ModalItem {...(item as StackItem<ModalProps>)} />;
  }

  if (item.data.type === "bottom-sheet") {
    return <BottomSheetItem {...(item as StackItem<BottomSheetProps>)} />;
  }

  if (item.data.type === "toast") {
    return <ToastItem {...(item as StackItem<ToastProps>)} />;
  }

  return null;
}

function useBackgroundColor(stack: Stack<Item>) {
  const animatedValue = React.useRef(new Animated.Value(0));
  const bgColorHistory = React.useRef<string[]>([]);

  const [colorStack, setColorStack] = React.useState(["rgba(0,0,0,0.0)"]);

  React.useEffect(() => {
    const unsub = stack.subscribe(({ state, event }) => {
      if (event.action === "pushstart") {
        const item = state.getItemByKey(event.key);

        if (item?.data.backgroundColor != null) {
          const currentColor =
            bgColorHistory.current[bgColorHistory.current.length - 1] ||
            "rgba(0,0,0,0.0)";

          bgColorHistory.current.push(item.data.backgroundColor);

          const nextColor =
            bgColorHistory.current[bgColorHistory.current.length - 1];

          setColorStack([currentColor, nextColor]);

          animatedValue.current.stopAnimation();
          animatedValue.current.setValue(0);

          Animated.spring(animatedValue.current, {
            toValue: 1,
            useNativeDriver: false,
          }).start();
        }
      }

      if (event.action === "popstart") {
        const item = state.getItemByKey(event.key);

        if (item?.data.backgroundColor != null) {
          const currentColor =
            bgColorHistory.current.pop() || "rgba(0,0,0,0.0)";
          const previousColor =
            bgColorHistory.current[bgColorHistory.current.length - 1] ||
            "rgba(0,0,0,0.0)";

          animatedValue.current.stopAnimation();
          animatedValue.current.setValue(0);

          setColorStack([currentColor, previousColor]);

          Animated.spring(animatedValue.current, {
            toValue: 1,
            useNativeDriver: false,
          }).start();
        }
      }
    });

    return () => {
      unsub();
    };
  }, []);

  const backgroundColor =
    colorStack.length <= 1
      ? "rgba(0,0,0,0.0)"
      : animatedValue.current.interpolate({
          inputRange: [0, 1],
          outputRange: [colorStack[0], colorStack[1]],
        });

  return backgroundColor;
}

const UI = createUIServices();
const { Stack, Modal, UIServicesProvider, BottomSheet, Toast } = UI;

export { createUIServices, Stack, Modal, UIServicesProvider, BottomSheet, Toast, StackItem };
