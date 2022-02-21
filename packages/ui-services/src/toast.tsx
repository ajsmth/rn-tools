import * as React from "react";
import {
  Animated,
  LayoutRectangle,
  Pressable,
  useWindowDimensions,
  StyleSheet,
} from "react-native";

import { createAsyncStack } from "./create-async-stack";
import { StackItemComponent, ToastOptions, ToastProps } from "./types";
import { useStackItems } from "./use-stack-items";

const defaultDistanceFromBottom = 64;

export function createToastStack() {
  const Stack = createAsyncStack<ToastOptions>();

  const Toast = {
    push: (component: StackItemComponent, options?: ToastOptions) => {
      return Stack.push({ ...options, component });
    },
    pop: Stack.pop,
  };

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
  };
}

export function ToastItem(props: ToastProps) {
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

  let distanceFromBottom =
    data.toastProps?.distanceFromBottom || defaultDistanceFromBottom;

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
