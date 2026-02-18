import * as React from "react";
import { StyleSheet, View } from "react-native";
import { requireNativeViewManager } from "expo-modules-core";

type NativeToastViewProps = {
  children: React.ReactNode;
  isVisible: boolean;
  position: "top" | "bottom";
  duration: number;
  onShown: () => void;
  onDismissed: () => void;
};

const NativeToastsView =
  requireNativeViewManager<NativeToastViewProps>("RNToolsToasts");

export type ToastProps = {
  children: React.ReactNode;
  isVisible: boolean;
  position?: "top" | "bottom";
  duration?: number;
  onShown?: () => void;
  onDismissed?: () => void;
};

export function Toast(props: ToastProps) {
  const {
    children,
    isVisible,
    position = "top",
    duration = 3,
    onShown,
    onDismissed,
  } = props;

  const handleShown = React.useCallback(() => {
    onShown?.();
  }, [onShown]);

  const handleDismissed = React.useCallback(() => {
    onDismissed?.();
  }, [onDismissed]);

  const pointerEvents = React.useMemo(() => {
    return isVisible ? "auto" : "none";
  }, [isVisible]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={pointerEvents}>
      <NativeToastsView
        isVisible={isVisible}
        position={position}
        duration={duration}
        onShown={handleShown}
        onDismissed={handleDismissed}
      >
        {children}
      </NativeToastsView>
    </View>
  );
}
