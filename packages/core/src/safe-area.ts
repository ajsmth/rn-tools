import { requireNativeModule } from "expo-modules-core";
import type { EventSubscription } from "expo-modules-core";
import { createStore } from "./store";

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

const baseSafeAreaStore = createStore<SafeAreaState>({
  insets: getSafeAreaInsets(),
});

let listenerCount = 0;
let nativeSubscription: EventSubscription | null = null;

function ensureNativeSubscription() {
  if (!nativeCoreModule || nativeSubscription) {
    return;
  }

  nativeSubscription = nativeCoreModule.addListener(
    "onSafeAreaInsetsChange",
    (event: SafeAreaInsetsChangeEvent) => {
      const nextInsets = event?.insets ?? getSafeAreaInsets();
      baseSafeAreaStore.setState((state) => {
        if (areInsetsEqual(state.insets, nextInsets)) {
          return state;
        }
        return { ...state, insets: nextInsets };
      });
    },
  );

  const initialInsets = getSafeAreaInsets();
  baseSafeAreaStore.setState((state) => {
    if (areInsetsEqual(state.insets, initialInsets)) {
      return state;
    }
    return { ...state, insets: initialInsets };
  });
}

function releaseNativeSubscription() {
  if (listenerCount > 0) {
    return;
  }

  nativeSubscription?.remove();
  nativeSubscription = null;
}

export const safeAreaStore = {
  getState: baseSafeAreaStore.getState,
  setState: baseSafeAreaStore.setState,
  subscribe(listener: () => void) {
    listenerCount += 1;
    ensureNativeSubscription();
    const unsubscribe = baseSafeAreaStore.subscribe(listener);
    return () => {
      unsubscribe();
      listenerCount = Math.max(0, listenerCount - 1);
      releaseNativeSubscription();
    };
  },
};
