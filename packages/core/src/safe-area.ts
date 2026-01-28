import { requireNativeModule } from "expo-modules-core";
import type { EventSubscription } from "expo-modules-core";
import { createManagedStore, useStoreSelector } from "./store";

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
  ) => EventSubscription;
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

export const safeAreaStore = createManagedStore<SafeAreaState>(
  {
    insets: getSafeAreaInsets(),
  },
  {
    start(store) {
      if (!nativeCoreModule) {
        return;
      }

      const subscription = nativeCoreModule.addListener(
        "onSafeAreaInsetsChange",
        (event: SafeAreaInsetsChangeEvent) => {
          const nextInsets = event?.insets ?? getSafeAreaInsets();
          store.setState((state) => {
            if (areInsetsEqual(state.insets, nextInsets)) {
              return state;
            }
            return { ...state, insets: nextInsets };
          });
        },
      );

      const initialInsets = getSafeAreaInsets();
      store.setState((state) => {
        if (areInsetsEqual(state.insets, initialInsets)) {
          return state;
        }
        return { ...state, insets: initialInsets };
      });

      return () => subscription.remove();
    },
  },
);

export const useSafeAreaInsets = (): EdgeInsets => {
  return useStoreSelector(safeAreaStore, (state) => state.insets);
};
