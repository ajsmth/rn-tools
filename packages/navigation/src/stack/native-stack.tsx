import * as React from "react";
import { StyleSheet } from "react-native";
import * as RNScreens from "react-native-screens";

type NativeStackProps = {
  children: React.ReactNode;
};

export const NativeStack = React.memo(function NativeStack(
  props: NativeStackProps,
) {
  return <RNScreens.ScreenStack style={StyleSheet.absoluteFill} {...props} />;
});

export type NativeScreenProps = Omit<RNScreens.ScreenProps, "active"> & {
  children: React.ReactNode;
  active: boolean;
};

export const NativeScreen = React.memo(function NativeScreen(
  props: NativeScreenProps,
) {
  return <RNScreens.Screen {...props} activityState={2} />;
});
