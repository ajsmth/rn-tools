import * as React from "react";
import { requireNativeViewManager } from "expo-modules-core";

const NativeSheetsView = requireNativeViewManager("RNToolsSheets");
const NativeSheetContainerView = requireNativeViewManager("RNToolsSheetContainer")

type NativeSheetProps = {
  isVisible?: boolean;
  onVisibleChange?: (isVisible: boolean) => void;
  children: React.ReactNode;
};

export function NativeSheet({
  children,
  isVisible = false,
  onVisibleChange,
}: NativeSheetProps) {
  return (
    <NativeSheetsView
      style={{ flex: 1 }}
      isVisible={isVisible}
      onDismiss={() => onVisibleChange?.(false)}
    >
      <NativeSheetContainerView>{children}</NativeSheetContainerView>
    </NativeSheetsView>
  );
}
