import { BottomSheetProps as BSP } from "@gorhom/bottom-sheet";
import { Animated } from "react-native";
import {
  ScreenStackHeaderConfigProps as RNSHeaderProps,
  ScreenProps as RNSScreenProps,
} from "react-native-screens";

import { StackItem, Status } from "./create-async-stack";

export type Props<T> = {
  animatedValue: Animated.Value;
  pop: () => void;
  status: Status;
};

export type ModalProps = Props<ModalOptions>;
export type BottomSheetProps = Props<BottomSheetOptions>;
export type ToastProps = Props<ToastOptions>;
export type ScreenProps = Props<ScreenOptions>;

export type StackItemComponent<T = any> = React.JSXElementConstructor<Props<T>>;

export type BottomSheetOptions = Omit<BSP, "children"> & {
  backgroundColor?: string;
};

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

export type ToastOptions = {
  duration?: number;
};

export type ToastStackItem = {
  component: StackItemComponent;
  toastProps?: ToastOptions;
};

export type FullScreenStackItem = ModalStackItem | BottomSheetStackItem;

export type ScreenStackItem = {
  component: StackItemComponent;
  screenProps?: RNSScreenProps;
  headerProps?: RNSHeaderProps;
};

export type ScreenOptions = {
  screenProps?: RNSScreenProps;
  headerProps?: RNSHeaderProps;
};
