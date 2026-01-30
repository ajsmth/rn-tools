import { requireNativeModule } from "expo-modules-core";
import { Store, useStore } from "./store";

export type EdgeInsets = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type SafeAreaState = {
  insets: EdgeInsets;
};

type SafeAreaInsetsChangeEvent = {
  insets?: EdgeInsets;
};

type NativeCoreModule = {
  addListener: (
    eventName: "onSafeAreaInsetsChange",
    listener: (event: SafeAreaInsetsChangeEvent) => void,
  ) => { remove: () => void };
  getSafeAreaInsets?: () => EdgeInsets;
};

const nativeCoreModule = requireNativeModule<NativeCoreModule>("RNToolsCore");

const fallbackInsets: EdgeInsets = {
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

export function getSafeAreaInsets(): EdgeInsets {
  try {
    return nativeCoreModule?.getSafeAreaInsets?.() ?? fallbackInsets;
  } catch (error) {
    return fallbackInsets;
  }
}

function areInsetsEqual(left: EdgeInsets, right: EdgeInsets) {
  return (
    left.top === right.top &&
    left.right === right.right &&
    left.bottom === right.bottom &&
    left.left === right.left
  );
}

export const safeAreaStore = new Store<SafeAreaState>({
  insets: getSafeAreaInsets(),
});

nativeCoreModule.addListener(
  "onSafeAreaInsetsChange",
  (event: SafeAreaInsetsChangeEvent) => {
    const nextInsets = event?.insets ?? getSafeAreaInsets();
    safeAreaStore.setState((state) => {
      if (areInsetsEqual(state.insets, nextInsets)) {
        return state;
      }
      return { ...state, insets: nextInsets };
    });
  },
);

const initialInsets = getSafeAreaInsets();

safeAreaStore.setState((state) => {
  if (areInsetsEqual(state.insets, initialInsets)) {
    return state;
  }
  return { ...state, insets: initialInsets };
});

const insetsSelector = (state: SafeAreaState) => state.insets;

export const useSafeAreaInsets = (): EdgeInsets => {
  return useStore(safeAreaStore, insetsSelector);
};
