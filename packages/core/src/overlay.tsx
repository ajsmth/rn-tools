import * as React from "react";
import { StyleSheet } from "react-native";
import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";

type NativeOverlayProps = ViewProps & {
  children?: React.ReactNode;
};

const NativeRNToolsOverlayView =
  requireNativeViewManager<NativeOverlayProps>("RNToolsOverlay");

export function Overlay({ children, style, ...props }: NativeOverlayProps) {
  return (
    <NativeRNToolsOverlayView
      {...props}
      style={[styles.overlay, style]}
      pointerEvents="box-none"
      collapsable={false}
    >
      {children}
    </NativeRNToolsOverlayView>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
});
