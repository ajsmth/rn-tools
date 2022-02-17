import * as React from "react";
import { Animated, Pressable } from "react-native";
import BottomSheet, { BottomSheetProps as BSP } from "@gorhom/bottom-sheet";

import { StackItem } from "./create-async-stack";

export type BottomSheetProps = {
  type: "bottom-sheet";
  component: React.JSXElementConstructor<StackItem>;
  bottomSheetProps: Omit<BSP, "children">;
};

type BottomSheetItemProps = StackItem<BottomSheetProps>;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BottomSheetItem(props: BottomSheetItemProps) {
  const { data, status, pop, onPushEnd, onPopEnd } = props;
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
      <AnimatedPressable style={{ flex: 1 }}>
        <Component {...props} />
      </AnimatedPressable>
    </BottomSheet>
  );
}
