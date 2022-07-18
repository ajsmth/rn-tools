import * as React from "react";
import {
  Animated,
  LayoutRectangle,
  Pressable,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { createStackStore, StackItem } from "@rn-toolkit/core";

// TODO - animation config, gesture handling

export type ToastOptions = {
  duration?: number;
  distanceFromBottom?: number;
  distanceFromTop?: number;
};

export type ToastProps<T = any> = T & {
  push: (
    component: (props: ToastProps<T>) => React.ReactElement<any>,
    options: Omit<ToastItem<T>, "component">
  ) => Promise<void>;
  pop: () => Promise<void>;
  updateProps: (updates: ToastOptions) => void;
  focused: boolean;
};

type ToastItem<T = any> = ToastOptions & {
  props?: T;
  component: (props: ToastProps) => React.ReactElement<any>;
};

type ToastStackItem<T = any> = StackItem<ToastItem<T>>;

const defaultDistanceFromBottom = 64;

export function createToastProvider() {
  const stack = createStackStore<ToastItem>();

  function Provider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = React.useState<ToastStackItem[]>([]);

    React.useEffect(() => {
      const unsub = stack.store.subscribe(({ stack }) => {
        setToasts(stack);
      });

      return () => unsub();
    }, []);

    return (
      <Animated.View
        pointerEvents={"box-none"}
        style={[StyleSheet.absoluteFill]}
      >
        {children}
        {toasts.map((toast, index, arr) => {
          const focused = index === arr.length - 1;
          return <ToastItem key={toast.id} toast={toast} focused={focused} />;
        })}
      </Animated.View>
    );
  }

  function ToastItem({
    toast,
    focused,
  }: {
    toast: ToastStackItem;
    focused: boolean;
  }) {
    const {
      data: { component, props = {}, ...toastProps },
      actions,
      id,
      status,
    } = toast;

    const { height } = useWindowDimensions();
    const [layout, setLayout] = React.useState<LayoutRectangle | null>(null);
    const animatedValueRef = React.useRef(new Animated.Value(0));
    const timerRef = React.useRef<number | null>(null);

    const onPushEnd = React.useCallback(() => {
      return actions.pushEnd(id);
    }, [id, actions]);

    const onPopEnd = React.useCallback(() => {
      return actions.popEnd(id);
    }, [id, actions]);

    const updateProps = React.useCallback(
      (updates: ToastOptions) => {
        return actions.update(id, updates);
      },
      [id, actions]
    );

    React.useEffect(() => {
      if (status === "pushing") {
        Animated.spring(animatedValueRef.current, {
          toValue: 1,
          useNativeDriver: true,
        }).start(onPushEnd);
      }

      if (status === "popping") {
        Animated.spring(animatedValueRef.current, {
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
        // @ts-ignore
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

    if (toastProps.distanceFromBottom != null) {
      distanceFromBottom = toastProps.distanceFromBottom;
    }

    if (layout != null) {
      distanceFromBottom = distanceFromBottom + layout.height;
    }

    let translateY = animatedValueRef.current.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [height, height - distanceFromBottom, height],
    });

    if (toastProps.distanceFromTop != null) {
      if (layout != null) {
        translateY = animatedValueRef.current.interpolate({
          inputRange: [0, 1, 2],
          outputRange: [
            0 - layout.height,
            toastProps.distanceFromTop,
            0 - layout.height,
          ],
        });
      }
    }

    const opacity = animatedValueRef.current.interpolate({
      inputRange: [0, 1, 2],
      outputRange: [1, 1, 0],
    });

    const isPopping = status === "popping" || status === "popped";
    const Component = component;

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
          <Component
            push={push}
            pop={pop}
            updateProps={updateProps}
            focused={focused}
            {...props}
          />
        </Pressable>
      </Animated.View>
    );
  }

  async function push<T>(
    component: (props: ToastProps<T>) => React.ReactElement<any>,
    options: Omit<ToastStackItem<T>["data"], "component"> = {}
  ) {
    const item = stack.actions.push({
      component,
      ...options,
    });

    return await item.promises.push;
  }

  async function pop() {
    const item = stack.actions.pop();
    return item?.promises.pop;
  }

  return {
    Provider,
    push,
    pop,
  };
}
