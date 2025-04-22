import { requireNativeView } from "expo";
import * as React from "react";

type NativeTabViewProps = {};

const NativeView: React.ComponentType<NativeTabViewProps> =
  requireNativeView("RNToolsTabs");

export function Tabs2(props: NativeTabViewProps) {
  console.log({ props });
  return <NativeView {...props} />;
}
