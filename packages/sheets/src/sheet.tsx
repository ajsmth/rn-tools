import * as React from "react";
import { RenderTreeNode, useStore } from "@rn-tools/core";
import { NativeBottomSheet } from "./native-sheets-view";
import type { SheetChangeEvent } from "./native-sheets-view";
import {
  SHEET_TYPE,
  SheetEntryKeyContext,
  useSheetsStore,
} from "./sheets-context";
import type { ViewStyle } from "react-native";
import type { AppearanceAndroid, AppearanceIOS } from "./native-sheets-view";

// TODO - dedupe prop
type SheetProps = {
  id: string;
  children?: React.ReactNode;
  snapPoints?: number[];
  initialIndex?: number;
  canDismiss?: boolean;
  onDismissPrevented?: () => void;
  onStateChange?: (event: SheetChangeEvent) => void;
  containerStyle?: ViewStyle;
  appearanceAndroid?: AppearanceAndroid;
  appearanceIOS?: AppearanceIOS;
};

export const Sheet = React.memo(function Sheet(props: SheetProps) {
  const sheets = useSheetsStore();

  const sheet = useStore(sheets.store, (s) =>
    s.entries.find((e) => e.options?.id === props.id),
  );

  const isOpen =
    Boolean(sheet) &&
    sheet?.status !== "closing" &&
    sheet?.status !== "mounted";

  React.useEffect(() => {
    sheets.mount(props.id);

    return () => {
      sheets.remove(props.id);
    };
  }, [props.id]);

  const handleStateChange = React.useCallback(
    (event: SheetChangeEvent) => {
      if (event.type === "OPEN") {
        sheets?.markOpened(props.id);
      }

      if (event.type === "HIDDEN") {
        sheets?.markClosed(props.id);
      }

      props.onStateChange?.(event);
    },
    [sheets, props.id, props.onStateChange],
  );

  const handleSetIsOpen = React.useCallback(
    (nextIsOpen: boolean) => {
      if (!nextIsOpen) {
        sheets?.remove(props.id);
      }
    },
    [sheets, props.id],
  );

  const handleDismissed = React.useCallback(() => {
    sheets?.remove(props.id);
  }, [sheets, props.id]);

  return (
    <RenderTreeNode type={SHEET_TYPE} id={props.id} active={isOpen}>
      <NativeBottomSheet
        isOpen={isOpen}
        setIsOpen={handleSetIsOpen}
        onDismissed={handleDismissed}
        snapPoints={props.snapPoints}
        initialIndex={props.initialIndex}
        canDismiss={props.canDismiss}
        onDismissPrevented={props.onDismissPrevented}
        onStateChange={handleStateChange}
        containerStyle={props.containerStyle}
        appearanceAndroid={props.appearanceAndroid}
        appearanceIOS={props.appearanceIOS}
      >
        <SheetEntryKeyContext.Provider value={props.id}>
          {props.children}
        </SheetEntryKeyContext.Provider>
      </NativeBottomSheet>
    </RenderTreeNode>
  );
});
