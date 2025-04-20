import { requireNativeView } from "expo";
import * as React from "react";

type NativeTabViewProps = {};

const NativeView: React.ComponentType<NativeTabViewProps> =
  requireNativeView("RNToolsTabs");

export function Tabs(props: NativeTabViewProps) {
  return <NativeView {...props} />;
}
