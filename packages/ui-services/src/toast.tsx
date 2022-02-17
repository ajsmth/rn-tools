import * as React from "react";
import { Animated, Pressable, useWindowDimensions } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";

import { StackItem } from "./create-async-stack";

export type ToastProps = {
  type: "toast";
  component: React.JSXElementConstructor<StackItem>;
  toastProps?: {
    duration?: number;
    distanceFromBottom?: number;
  };
};

type ToastItemProps = StackItem<ToastProps>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const defaultDistanceFromBottom = 64;

export function ToastItem(props: ToastItemProps) {
  const { status, data, onPopEnd, onPushEnd, pop } = props;
  const { toastProps } = data;

  const animatedValue = React.useRef(new Animated.Value(0));
  const { height } = useWindowDimensions();

  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    if (status === "pushing") {
      Animated.spring(animatedValue.current, {
        toValue: 1,
        useNativeDriver: true,
      }).start(onPushEnd);
    }

    if (status === "popping") {
      Animated.spring(animatedValue.current, {
        toValue: 0,
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

  const distanceFromBottom =
    data.toastProps?.distanceFromBottom || defaultDistanceFromBottom;

  const translateY = animatedValue.current.interpolate({
    inputRange: [0, 1],
    outputRange: [height, height - distanceFromBottom],
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
