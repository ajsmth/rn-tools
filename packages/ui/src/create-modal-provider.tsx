import * as React from "react";
import {
  Animated,
  Pressable,
  useWindowDimensions,
  StyleSheet,
} from "react-native";
import { createStackStore, StackItem } from "@rn-toolkit/core";

export type ModalOptions = {
  duration?: number;
};

export type ModalProps<T = any> = T & {
  push: (
    component: (props: ModalProps<T>) => React.ReactElement<any>,
    options: Omit<ModalItem, "component">
  ) => Promise<void>;
  pop: () => Promise<void>;
  updateProps: (updates: ModalOptions) => void;
  focused: boolean;
};

type ModalItem<T = any> = ModalOptions & {
  props?: T;
  component: (props: ModalProps) => React.ReactElement<any>;
};

type ModalStackItem<T = any> = StackItem<ModalItem<T>>;

export function createModalProvider() {
  const stack = createStackStore<ModalItem>();

  function Provider({ children }: { children: React.ReactNode }) {
    const [modals, setModals] = React.useState<ModalStackItem[]>([]);

    React.useEffect(() => {
      const unsub = stack.store.subscribe(({ stack }) => {
        setModals(stack);
      });

      return () => unsub();
    }, []);

    return (
      <Animated.View
        pointerEvents={"box-none"}
        style={[StyleSheet.absoluteFill]}
      >
        {children}
        {modals.map((modal, index, arr) => {
          const focused = index === arr.length - 1;
          return <ModalItem key={modal.id} modal={modal} focused={focused} />;
        })}
      </Animated.View>
    );
  }

  function ModalItem({
    modal,
    focused,
  }: {
    modal: ModalStackItem;
    focused: boolean;
  }) {
    const {
      data: { component, props = {}, ...modalProps },
      actions,
      id,
      status,
    } = modal;

    const { height } = useWindowDimensions();
    const animatedValueRef = React.useRef(new Animated.Value(0));

    const onPushEnd = React.useCallback(() => {
      return actions.pushEnd(id);
    }, [id, actions]);

    const onPopEnd = React.useCallback(() => {
      return actions.popEnd(id);
    }, [id, actions]);

    const updateProps = React.useCallback(
      (updates: ModalOptions) => {
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
          toValue: 0,
          useNativeDriver: true,
        }).start(onPopEnd);
      }
    }, [status]);

    const translateY = animatedValueRef.current.interpolate({
      inputRange: [0, 1],
      outputRange: [height, 0],
    });

    const isPopping = status === "popping" || status === "popped";
    const Component = component;

    return (
      <Pressable
        pointerEvents="box-none"
        onPress={pop}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View
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
          <Pressable>
            <Component
              push={push}
              pop={pop}
              updateProps={updateProps}
              focused={focused}
              {...props}
              {...modalProps}
            />
          </Pressable>
        </Animated.View>
      </Pressable>
    );
  }

  async function push<T = any>(
    component: (props: ModalProps<T>) => React.ReactElement<any>,
    options: Omit<ModalItem<T>, "component">
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
