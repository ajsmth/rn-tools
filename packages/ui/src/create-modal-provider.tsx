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

export type ModalProps = {
  push: (
    component: (props: ModalProps) => React.ReactElement<any>,
    options: Omit<ModalStackItem, "component">
  ) => Promise<void>;
  pop: () => Promise<void>;
  updateProps: (updates: ModalOptions) => void;
  focused: boolean;
};

type ModalItem = ModalOptions & {
  component: (props: ModalProps) => React.ReactElement<any>;
};

type ModalStackItem = StackItem<ModalItem>;

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
      data: { component, ...ModalProps },
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
        <Pressable>
          <Component
            push={push}
            pop={pop}
            updateProps={updateProps}
            focused={focused}
          />
        </Pressable>
      </Animated.View>
    );
  }

  async function push(
    component: (props: ModalProps) => React.ReactElement<any>,
    options: Omit<ModalStackItem, "component">
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
