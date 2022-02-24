import * as React from "react";
import { Animated, Pressable, useWindowDimensions } from "react-native";

import { Stack, StackItem } from "./create-async-stack";
import { ModalOptions, ModalStackItem, ModalProps } from "./types";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function ModalItem({
  status,
  data,
  onPopEnd,
  onPushEnd,
  animatedValue,
  pop,
}: StackItem<ModalStackItem>) {
  const { height } = useWindowDimensions();

  React.useEffect(() => {
    if (status === "pushing") {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start(onPushEnd);
    }

    if (status === "popping") {
      Animated.spring(animatedValue, {
        toValue: 0,
        useNativeDriver: true,
      }).start(onPopEnd);
    }
  }, [status]);

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [height, 0],
  });

  const isPopping = status === "popping" || status === "popped";
  const Component = data.component;

  return (
    <Animated.View
      pointerEvents={isPopping ? "none" : "box-none"}
      style={[
        {
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
          transform: [{ translateY }],
          justifyContent: "center",
        },
      ]}
    >
      <AnimatedPressable>
        <Component animatedValue={animatedValue} status={status} pop={pop} />
      </AnimatedPressable>
    </Animated.View>
  );
}

type ContextProps = {
  push: (
    component: React.JSXElementConstructor<ModalProps>,
    options?: ModalOptions
  ) => StackItem<ModalStackItem>;
  pop: (amount?: number) => StackItem<ModalStackItem>[];
};

export function createService(stack: Stack<ModalStackItem>): ContextProps {
  return {
    push: (
      component: React.JSXElementConstructor<ModalProps>,
      options?: ModalOptions
    ) => {
      options = options || {};
      const { backgroundColor = "rgba(0,0,0,0.5)" } = options;
      return stack.push({
        backgroundColor,
        component,
        type: "modal",
      });
    },
    pop: stack.pop,
  };
}

const Context = React.createContext<ContextProps | null>(null);

export function ModalStackProvider({
  stack,
  children,
}: {
  stack: Stack<ModalStackItem>;
  children: React.ReactNode;
}) {
  return (
    <Context.Provider value={createService(stack)}>{children}</Context.Provider>
  );
}

export const useModal = () => {
  const context = React.useContext(Context);

  if (!context) {
    throw new Error(
      `useModal() must be used within a <ModalProvider /> context`
    );
  }

  return context;
};
