import * as React from "react";
import {
  LayoutRectangle,
  NativeSyntheticEvent,
  View,
  ViewStyle,
  Platform,
  LayoutChangeEvent,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { requireNativeViewManager } from "expo-modules-core";
import { useSafeAreaInsets } from "@rn-tools/core";

type SheetState = "DRAGGING" | "OPEN" | "SETTLING" | "HIDDEN";

type ChangeEvent<T extends SheetState, P = unknown> = {
  type: T;
  payload?: P;
};

type OpenChangeEvent = ChangeEvent<"OPEN", { index: number }>;
type HiddenChangeEvent = ChangeEvent<"HIDDEN">;

export type SheetChangeEvent = OpenChangeEvent | HiddenChangeEvent;

type NativeOnChangeEvent = NativeSyntheticEvent<SheetChangeEvent>;

export type AppearanceIOS = {
  grabberVisible?: boolean;
  backgroundColor?: string;
  cornerRadius?: number;
};

export type AppearanceAndroid = {
  dimAmount?: number;
  cornerRadius?: number;
  backgroundColor?: string;
};

type NativeSheetViewProps = {
  children: React.ReactNode;
  snapPoints?: number[];
  isOpen: boolean;
  initialIndex: number;
  onDismiss: () => void;
  canDismiss?: boolean;
  onDismissPrevented: () => void;
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
  initialIndex?: number;
  setIsOpen: (isOpen: boolean) => void;
  onDismissed?: () => void;
  canDismiss?: boolean;
  onDismissPrevented?: () => void;
  onStateChange?: (event: SheetChangeEvent) => void;
  appearanceAndroid?: AppearanceAndroid;
  appearanceIOS?: AppearanceIOS;
};

export function BottomSheet(props: BottomSheetProps) {
  const {
    onStateChange,
    children,
    snapPoints = [],
    containerStyle,
    isOpen,
    initialIndex = 0,
    setIsOpen,
    onDismissed,
    appearanceAndroid,
    appearanceIOS,
    canDismiss = true,
    onDismissPrevented,
  } = props;

  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const maxSheetHeight = React.useMemo(
    () => Math.max(0, windowHeight - insets.top - insets.bottom),
    [windowHeight, insets.top, insets.bottom],
  );

  const [layout, setLayout] = React.useState<LayoutRectangle>({
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  });

  const hasOpened = React.useRef(false);

  const computedSnapPoints = React.useMemo(() => {
    if (snapPoints.length === 0) {
      if (layout.height === 0) {
        return [];
      }

      return [Math.round(Math.min(layout.height, maxSheetHeight))];
    }

    let effectiveSnapPoints =
      Platform.OS === "android" ? snapPoints.slice(0, 2) : [...snapPoints];

    const snapPointsExceedingMaxHeight = snapPoints.filter(
      (snapPoint) => snapPoint >= maxSheetHeight,
    );

    if (snapPointsExceedingMaxHeight.length > 0) {
      effectiveSnapPoints = [
        ...effectiveSnapPoints.filter(
          (snapPoint) => snapPoint < maxSheetHeight,
        ),
        maxSheetHeight,
      ];
    }

    return effectiveSnapPoints.map((snapPoint) => Math.round(snapPoint));
  }, [layout.height, maxSheetHeight, snapPoints]);

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
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      backgroundColor: "white",
      ...containerStyle,
    };
  }, [maxHeight, containerStyle]);

  const computedIsOpen = React.useMemo(
    () => isOpen && computedSnapPoints.length > 0,
    [isOpen, computedSnapPoints],
  );

  const notifyDismissed = React.useCallback(
    () => {
      if (hasOpened.current) {
        setIsOpen(false);
      }
      onDismissed?.();
      hasOpened.current = false;
    },
    [setIsOpen, onDismissed],
  );

  const handleOnDismiss = React.useCallback(() => {
    notifyDismissed();
  }, [notifyDismissed]);

  const handleStateChange = React.useCallback(
    (event: NativeOnChangeEvent) => {
      if (event.nativeEvent.type === "OPEN") {
        hasOpened.current = true;
      }

      if (event.nativeEvent.type === "HIDDEN") {
        notifyDismissed();
      }

      onStateChange?.(event.nativeEvent);
    },
    [onStateChange, notifyDismissed],
  );

  const handleLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      setLayout(event.nativeEvent.layout);
    },
    [],
  );

  const handleDismissWithChanges = React.useCallback(() => {
    onDismissPrevented?.();
  }, [onDismissPrevented]);

  const isAutosized = React.useMemo(
    () => snapPoints.length === 0,
    [snapPoints],
  );

  const pointerEvents = React.useMemo(() => {
    return isOpen ? "auto" : "none";
  }, [isOpen]);

  const innerStyle = React.useMemo(
    () => (isAutosized ? undefined : StyleSheet.absoluteFill),
    [isAutosized],
  );

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents={pointerEvents}>
      <NativeSheetsView
        isOpen={computedIsOpen}
        canDismiss={canDismiss}
        initialIndex={initialIndex}
        onDismiss={handleOnDismiss}
        onStateChange={handleStateChange}
        onDismissPrevented={handleDismissWithChanges}
        snapPoints={computedSnapPoints}
        appearanceAndroid={appearanceAndroid}
        appearanceIOS={appearanceIOS}
      >
        <View style={style} collapsable={false}>
          <View onLayout={handleLayout} style={innerStyle} collapsable={false}>
            {children}
          </View>
        </View>
      </NativeSheetsView>
    </View>
  );
}
