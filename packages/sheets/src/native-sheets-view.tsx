import * as React from "react";
import { View, ViewStyle } from 'react-native'
import { requireNativeViewManager } from "expo-modules-core";

const NativeSheetsView = requireNativeViewManager("RNToolsSheets");

type NativeSheetProps = {
  children: React.ReactNode;
  containerStyle?: ViewStyle
  snapPoints: number[]
  isVisible?: boolean;
  onVisibleChange?: (isVisible: boolean) => void;
  onIsDraggingChange?: (isDragging: boolean) => void
};

export function BottomSheet(props: NativeSheetProps) {
  const { isVisible, onVisibleChange, children, snapPoints, onIsDraggingChange, containerStyle } = props

  const maxHeight = React.useMemo(() => Math.max(...snapPoints), [snapPoints])
  const style = React.useMemo(() => {
    return {
      height: maxHeight,
      ...containerStyle,
    }
  }, [maxHeight])

  return (
    <NativeSheetsView
      isVisible={isVisible}
      onDismiss={() => onVisibleChange?.(false)}
      snapPoints={snapPoints}
      onDraggingChange={(isDragging) => onIsDraggingChange?.(isDragging)}
    >
      <View style={style}>
        {children}
      </View>

    </NativeSheetsView>
  );
}
