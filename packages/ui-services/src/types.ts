import { BottomSheetProps as BSP } from "@gorhom/bottom-sheet";

import { StackItem } from "./create-async-stack";

export type StackItemComponent = React.JSXElementConstructor<StackItem>;

export type BottomSheetOptions = Omit<BSP, "children"> & {
  backgroundColor?: string;
};

export type BottomSheetProps = StackItem<BottomSheetStackItem>;

export type BottomSheetStackItem = {
  type: "bottom-sheet";
  component: StackItemComponent;
  bottomSheetProps: Omit<BSP, "children">;
  backgroundColor?: string;
};

export type ModalOptions = {
  backgroundColor?: string;
};

export type ModalStackItem = {
  type: "modal";
  component: StackItemComponent;
  backgroundColor?: string;
};

export type ModalProps = StackItem<ModalOptions>;

export type ToastOptions = {
  component: StackItemComponent;
  toastProps?: {
    duration?: number;
    distanceFromBottom?: number;
  };
};

export type ToastProps = StackItem<ToastOptions>;
