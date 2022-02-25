import * as React from "react";
import {
  Animated,
  LayoutRectangle,
  Pressable,
  useWindowDimensions,
  StyleSheet,
} from "react-native";

import { createAsyncStack, Stack, StackItem } from "./create-async-stack";
import {
  StackItemComponent,
  ToastOptions,
  ToastProps,
  ToastStackItem,
} from "./types";
import { useStackItems } from "./use-stack-items";

const defaultDistanceFromBottom = 64;

export function createToastStack() {
  const Stack = createAsyncStack<ToastStackItem>();

  const ToastProvider = ({ children }: { children: React.ReactNode }) => (
    <ToastStackProvider stack={Stack}>{children}</ToastStackProvider>
  );

  const Toast = createService(Stack);

  function ToastStack() {
    const toasts = useStackItems(Stack);

    return (
      <Animated.View
        pointerEvents={"box-none"}
        style={[StyleSheet.absoluteFill]}
      >
        {toasts.map((toast) => (
          <ToastItem {...toast} />
        ))}
      </Animated.View>
    );
  }

  return {
    Toast,
    ToastStack,
    ToastProvider,
  };
}

function ToastItem(props: StackItem<ToastStackItem>) {
  const { status, data, onPopEnd, onPushEnd, pop, animatedValue } = props;
  const { toastProps } = data;

  const { height } = useWindowDimensions();

  const [layout, setLayout] = React.useState<LayoutRectangle | null>(null);
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (status === "pushing") {
      Animated.spring(animatedValue, {
        toValue: 1,
        useNativeDriver: true,
      }).start(onPushEnd);
    }

    if (status === "popping") {
      Animated.spring(animatedValue, {
        toValue: 2,
        useNativeDriver: true,
      }).start(() => {
        onPopEnd();

        if (timerRef.current != null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      });
    }

    if (status === "settled") {
      timerRef.current = setTimeout(() => {
        pop();
        timerRef.current = null;
      }, toastProps?.duration || 2000);
    }

    return () => {
      if (timerRef.current != null) {
        clearTimeout(timerRef.current);
      }
    };
  }, [status, pop, toastProps?.duration]);

  let distanceFromBottom = defaultDistanceFromBottom;

  if (layout != null) {
    distanceFromBottom = distanceFromBottom + layout.height;
  }

  const translateY = animatedValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [
      height,
      height - distanceFromBottom,
      height - distanceFromBottom,
    ],
  });

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1, 2],
    outputRange: [1, 1, 0],
  });

  const isPopping = status === "popping" || status === "popped";
  const Component = data.component;

  return (
    <Animated.View
      onLayout={({ nativeEvent: { layout } }) => setLayout(layout)}
      pointerEvents={isPopping ? "none" : "box-none"}
      style={[
        {
          position: "absolute",
          left: 0,
          right: 0,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <Pressable onPress={pop}>
        <Component {...props} />
      </Pressable>
    </Animated.View>
  );
}

type ContextProps = {
  push: (
    component: StackItemComponent,
    options: ToastOptions
  ) => StackItem<ToastStackItem>;
  pop: (amount?: number) => StackItem<ToastStackItem>[];
};

function createService(stack: Stack<ToastStackItem>): ContextProps {
  return {
    push: (
      component: React.JSXElementConstructor<ToastProps>,
      options?: ToastOptions
    ) => {
      return stack.push({ toastProps: options, component });
    },
    pop: stack.pop,
  };
}

const Context = React.createContext<ContextProps | null>(null);

function ToastStackProvider({
  stack,
  children,
}: {
  stack: Stack<ToastStackItem>;
  children: React.ReactNode;
}) {
  return (
    <Context.Provider value={createService(stack)}>{children}</Context.Provider>
  );
}

export const useToast = () => React.useContext(Context);
