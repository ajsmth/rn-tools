import * as React from "react";
import {
  LayoutRectangle,
  NativeSyntheticEvent,
  View,
  ViewStyle,
  Platform,
  LayoutChangeEvent,
} from "react-native";
import { requireNativeViewManager } from "expo-modules-core";

type SheetState = "DRAGGING" | "OPEN" | "SETTLING" | "HIDDEN";

type ChangeEvent<T extends SheetState, P = unknown> = {
  type: T;
  payload?: P;
};

type OpenChangeEvent = ChangeEvent<"OPEN", { index: number }>;
type DraggingChangeEvent = ChangeEvent<"DRAGGING">;
type SettlingChangeEvent = ChangeEvent<"SETTLING">;
type HiddenChangeEvent = ChangeEvent<"HIDDEN">;

type SheetChangeEvent =
  | OpenChangeEvent
  | DraggingChangeEvent
  | SettlingChangeEvent
  | HiddenChangeEvent;

type NativeOnChangeEvent = NativeSyntheticEvent<SheetChangeEvent>;

type AppearanceIOS = {
  grabberVisible?: boolean;
  backgroundColor?: string;
};

type AppearanceAndroid = {
  dimAmount?: number;
  backgroundColor?: string;
};

type NativeSheetViewProps = {
  children: React.ReactNode;
  snapPoints?: number[];
  isOpen: boolean;
  openToIndex: number;
  onDismiss: () => void;
  onStateChange: (event: NativeOnChangeEvent) => void;
  appearanceAndroid?: AppearanceAndroid;
  appearanceIOS?: AppearanceIOS;
};

const NativeSheetsView =
  requireNativeViewManager<NativeSheetViewProps>("RNToolsSheets");

export type BottomSheetProps = {
  children: React.ReactNode;
  containerStyle?: ViewStyle;
  snapPoints?: number[];
  isOpen: boolean;
  openToIndex?: number;
  onOpenChange: (isOpen: boolean) => void;
  onStateChange?: (event: SheetChangeEvent) => void;
  appearanceAndroid?: AppearanceAndroid;
  appearanceIOS?: AppearanceIOS;
};

// TODO:
// - get sheet container height from native side and clamp maxHeight to that value
//

export function BottomSheet(props: BottomSheetProps) {
  const {
    onStateChange,
    children,
    snapPoints = [],
    containerStyle,
    isOpen,
    openToIndex = 0,
    onOpenChange: setIsOpen,
    appearanceAndroid,
    appearanceIOS,
  } = props;

  const [layout, setLayout] = React.useState<LayoutRectangle>({
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  });

  const computedSnapPoints = React.useMemo(() => {
    if (snapPoints.length === 0 && layout.height > 0) {
      return [layout.height];
    }

    return Platform.OS === "android" ? snapPoints.slice(0, 2) : [...snapPoints];
  }, [snapPoints, layout]);

  const maxHeight = React.useMemo(
    () =>
      computedSnapPoints.length === 0
        ? undefined
        : Math.max(...computedSnapPoints),
    [computedSnapPoints],
  );

  const style = React.useMemo(() => {
    return {
      height: maxHeight,
      ...containerStyle,
    };
  }, [maxHeight]);

  const handleOnDismiss = React.useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleStateChange = React.useCallback(
    (event: NativeOnChangeEvent) => {
      onStateChange?.(event.nativeEvent);
    },
    [onStateChange],
  );

  const handleLayout = React.useCallback((event: LayoutChangeEvent) => {
    setLayout(event.nativeEvent.layout);
  }, []);

  return (
    <NativeSheetsView
      isOpen={isOpen}
      openToIndex={openToIndex}
      onDismiss={handleOnDismiss}
      onStateChange={handleStateChange}
      snapPoints={computedSnapPoints}
      appearanceAndroid={appearanceAndroid}
      appearanceIOS={appearanceIOS}
    >
      <View style={style} onLayout={handleLayout}>
        {children}
      </View>
    </NativeSheetsView>
  );
}
