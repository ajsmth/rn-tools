import * as React from "react";
import { StyleSheet } from "react-native";
import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";

type NativeHostProps = ViewProps & {
  children?: React.ReactNode;
  debugLayout?: boolean;
};

const NativeToastsHostView =
  requireNativeViewManager<NativeHostProps>("RNToolsToasts");

export function ToastHost({
  debugLayout = false,
  children,
}: {
  debugLayout?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <NativeToastsHostView
      style={styles.host}
      debugLayout={debugLayout && __DEV__}
      pointerEvents="box-none"
      collapsable={false}
    >
      {children}
    </NativeToastsHostView>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
});
