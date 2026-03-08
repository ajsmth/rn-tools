import * as React from "react";
import { StyleSheet, View } from "react-native";
import { requireNativeViewManager } from "expo-modules-core";
import type { ViewProps } from "react-native";

type NativeHostProps = ViewProps & {
  children?: React.ReactNode;
  debugLayout?: boolean;
};

const NativeNotificationsHostView = requireNativeViewManager<NativeHostProps>(
  "RNToolsNotifications",
);

const NativeNotificationsTopLaneView = requireNativeViewManager<ViewProps>(
  "RNToolsNotificationsTopLane",
);
const NativeNotificationsBottomLaneView = requireNativeViewManager<ViewProps>(
  "RNToolsNotificationsBottomLane",
);

export function NativeContainer({
  debugLayout = false,
  children,
}: {
  debugLayout?: boolean;
  children?: React.ReactNode;
}) {
  return <View style={styles.lane}>{children}</View>;
  return (
    <NativeNotificationsHostView
      style={styles.host}
      debugLayout={debugLayout && __DEV__}
      pointerEvents="box-none"
      collapsable={false}
    >
      {children}
    </NativeNotificationsHostView>
  );
}

type NativeLaneProps = {
  children?: React.ReactNode;
};

export const NativeTopLane = React.memo(function NativeTopLane({
  children,
}: NativeLaneProps) {
  return <View style={styles.lane}>{children}</View>;
  return (
    <NativeNotificationsTopLaneView
      collapsable={false}
      pointerEvents="box-none"
      style={styles.lane}
    >
      {children}
    </NativeNotificationsTopLaneView>
  );
});

export const NativeBottomLane = React.memo(function NativeBottomLane({
  children,
}: NativeLaneProps) {
  return <View style={styles.lane}>{children}</View>;
  return (
    <NativeNotificationsBottomLaneView
      collapsable={false}
      pointerEvents="box-none"
      style={styles.lane}
    >
      {children}
    </NativeNotificationsBottomLaneView>
  );
});

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
  },
  lane: {
    ...StyleSheet.absoluteFillObject,
  },
});
