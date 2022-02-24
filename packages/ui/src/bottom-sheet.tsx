import * as React from "react";
import BottomSheet from "@gorhom/bottom-sheet";

import {
  BottomSheetOptions,
  BottomSheetProps,
  BottomSheetStackItem,
  StackItemComponent,
} from "./types";
import { Stack, StackItem } from "./create-async-stack";

export function BottomSheetItem({
  data,
  status,
  pop,
  onPushEnd,
  onPopEnd,
  animatedValue,
}: StackItem<BottomSheetStackItem>) {
  const { bottomSheetProps } = data;

  const bottomSheetRef = React.useRef<BottomSheet>(null);

  React.useEffect(() => {
    if (status === "pushing") {
      bottomSheetRef.current?.expand();
      onPushEnd();
    }

    if (status === "popping") {
      bottomSheetRef.current?.close();
    }
  }, [status]);

  const onChange = React.useCallback(
    (index: number) => {
      if (index === -1) {
        if (status !== "popping") {
          pop();
        }
        onPopEnd();
      }
    },
    [status]
  );

  const Component = data.component;

  return (
    <BottomSheet
      enablePanDownToClose
      {...bottomSheetProps}
      ref={bottomSheetRef}
      onChange={onChange}
    >
      <Component animatedValue={animatedValue} status={status} pop={pop} />
    </BottomSheet>
  );
}

export function createService(
  stack: Stack<BottomSheetStackItem>
): ContextProps {
  return {
    push: (component: StackItemComponent, options: BottomSheetOptions) => {
      const { backgroundColor = "rgba(0,0,0,0.5)", ...bottomSheetProps } =
        options;
      return stack.push({
        type: "bottom-sheet",
        component,
        backgroundColor,
        bottomSheetProps,
      });
    },
    pop: stack.pop,
  };
}

type ContextProps = {
  push: (
    component: React.JSXElementConstructor<BottomSheetProps>,
    options: BottomSheetOptions
  ) => StackItem<BottomSheetStackItem>;
  pop: (amount?: number) => StackItem<BottomSheetStackItem>[];
};

const Context = React.createContext<ContextProps | null>(null);

export function BottomSheetStackProvider({
  stack,
  children,
}: {
  stack: Stack<BottomSheetStackItem>;
  children: React.ReactNode;
}) {
  return (
    <Context.Provider value={createService(stack)}>{children}</Context.Provider>
  );
}

export const useBottomSheet = () => {
  const context = React.useContext(Context);

  if (!context) {
    throw new Error(
      `useBottomSheet() must be used within a <UIServicesProvider /> context`
    );
  }

  return context;
};
