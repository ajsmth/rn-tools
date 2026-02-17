import * as React from "react";
import { RenderTreeNode, useStore } from "@rn-tools/core";
import type { OverlayStatus } from "@rn-tools/core";
import { BottomSheet } from "./native-sheets-view";
import type { SheetChangeEvent } from "./native-sheets-view";
import { SHEET_TYPE, SheetsContext, SheetsStoreContext } from "./sheets-client";
import type { ViewStyle } from "react-native";
import type {
  AppearanceAndroid,
  AppearanceIOS,
} from "./native-sheets-view";

type SheetSlotEntryProps = {
  entryKey: string;
  element: React.ReactElement;
  status: OverlayStatus;
  active: boolean;
  wrapped: boolean;
  snapPoints?: number[];
  initialIndex?: number;
  canDismiss?: boolean;
  onDismissPrevented?: () => void;
  onStateChange?: (event: SheetChangeEvent) => void;
  containerStyle?: ViewStyle;
  appearanceAndroid?: AppearanceAndroid;
  appearanceIOS?: AppearanceIOS;
};

const SheetSlotEntry = React.memo(function SheetSlotEntry(
  props: SheetSlotEntryProps,
) {
  const sheets = React.useContext(SheetsContext);
  const isOpen = props.status !== "closing";

  const handleStateChange = React.useCallback(
    (event: SheetChangeEvent) => {
      if (event.type === "OPEN") {
        sheets?.markDidOpen(props.entryKey);
      }

      if (event.type === "HIDDEN") {
        sheets?.markDidDismiss(props.entryKey);
      }

      props.onStateChange?.(event);
    },
    [sheets, props.entryKey, props.onStateChange],
  );

  const handleSetIsOpen = React.useCallback(
    (nextIsOpen: boolean) => {
      if (!nextIsOpen) {
        sheets?.dismiss(props.entryKey);
      }
    },
    [sheets, props.entryKey],
  );

  const handleDismissed = React.useCallback(() => {
    sheets?.markDidDismiss(props.entryKey);
  }, [sheets, props.entryKey]);

  if (!props.wrapped) {
    return (
      <RenderTreeNode type={SHEET_TYPE} id={props.entryKey} active={props.active}>
        {props.element}
      </RenderTreeNode>
    );
  }

  return (
    <RenderTreeNode type={SHEET_TYPE} id={props.entryKey} active={props.active}>
      <BottomSheet
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
        {props.element}
      </BottomSheet>
    </RenderTreeNode>
  );
});

export const SheetSlot = React.memo(function SheetSlot() {
  const store = React.useContext(SheetsStoreContext);
  const entries = useStore(store, (state) => state.entries);
  const activeKey = React.useMemo(() => {
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].status !== "closing") {
        return entries[i].key;
      }
    }
    return null;
  }, [entries]);

  return (
    <>
      {entries.map((entry) => (
        <SheetSlotEntry
          key={entry.key}
          entryKey={entry.key}
          element={entry.element}
          status={entry.status}
          active={entry.key === activeKey}
          wrapped={entry.options.wrapped !== false}
          snapPoints={entry.options.snapPoints}
          initialIndex={entry.options.initialIndex}
          canDismiss={entry.options.canDismiss}
          onDismissPrevented={entry.options.onDismissPrevented}
          onStateChange={entry.options.onStateChange}
          containerStyle={entry.options.containerStyle}
          appearanceAndroid={entry.options.appearanceAndroid}
          appearanceIOS={entry.options.appearanceIOS}
        />
      ))}
    </>
  );
});
