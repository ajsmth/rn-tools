import * as React from "react";
import { createStackStore, StackItem } from "@rn-toolkit/core";
import BottomSheet, { BottomSheetProps as BSP } from "@gorhom/bottom-sheet";
import { Animated, Pressable, StyleSheet } from "react-native";

type BSProps = Omit<BSP, "children">;

export type BottomSheetProps<T = any> = T & {
  push: (
    component: (props: BottomSheetProps<T>) => React.ReactElement<any>,
    options: Omit<BottomSheetItem<T>, "component">
  ) => Promise<void>;
  pop: () => Promise<void>;
  updateProps: (updates: BSProps) => void;
  focused: boolean;
};

type BottomSheetItem<T = any> = BSProps & {
  props?: T;
  component: (props: BottomSheetProps) => React.ReactElement<any>;
};

type BottomSheetStackItem<T = any> = StackItem<BottomSheetItem<T>>;

export function createBottomSheetProvider() {
  const stack = createStackStore<BottomSheetItem>();

  function Provider({ children }: { children: React.ReactNode }) {
    const [sheets, setSheets] = React.useState<BottomSheetStackItem[]>([]);

    React.useEffect(() => {
      const unsub = stack.store.subscribe(({ stack }) => {
        setSheets(stack);
      });

      return () => unsub();
    }, []);

    return (
      <Animated.View pointerEvents={"box-none"} style={StyleSheet.absoluteFill}>
        <Pressable onPress={pop} style={StyleSheet.absoluteFill}>
          {children}
          {sheets.map((sheet, index, arr) => {
            const focused = index === arr.length - 1;
            return (
              <BottomSheetItem key={sheet.id} sheet={sheet} focused={focused} />
            );
          })}
        </Pressable>
      </Animated.View>
    );
  }

  function BottomSheetItem({
    sheet,
    focused,
  }: {
    sheet: BottomSheetStackItem;
    focused: boolean;
  }) {
    const {
      data: { component, props = {}, ...bottomSheetProps },
      actions,
      id,
      status,
    } = sheet;

    const bottomSheetRef = React.useRef<BottomSheet>(null);

    const onPopEnd = React.useCallback(() => {
      return actions.popEnd(id);
    }, [id]);

    const onPushEnd = React.useCallback(() => {
      return actions.pushEnd(id);
    }, [id]);

    React.useEffect(() => {
      if (status === "pushing") {
        bottomSheetRef.current?.expand();
        onPushEnd();
      }

      if (status === "popping") {
        bottomSheetRef.current?.close();
      }
    }, [status, onPushEnd]);

    const onChange = React.useCallback(
      (index: number) => {
        if (index === -1) {
          if (status !== "popping") {
            return pop();
          }
          return onPopEnd();
        }
      },
      [status, onPopEnd]
    );

    const updateProps = React.useCallback(
      (updates: BSProps) => {
        return actions.update(id, updates);
      },
      [id]
    );

    const Component = component;

    return (
      <BottomSheet
        enablePanDownToClose
        {...bottomSheetProps}
        ref={bottomSheetRef}
        onChange={onChange}
      >
        <Component
          push={push}
          pop={pop}
          focused={focused}
          updateProps={updateProps}
          {...props}
        />
      </BottomSheet>
    );
  }

  async function push<T = any>(
    component: (props: BottomSheetProps<T>) => React.ReactElement<any>,
    options: Omit<BottomSheetItem<T>, "component">
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
