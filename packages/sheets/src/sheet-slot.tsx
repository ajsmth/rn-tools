import * as React from "react";
import { useStore } from "@rn-tools/core";
import { BottomSheet } from "./native-sheets-view";
import type { SheetChangeEvent } from "./native-sheets-view";
import { SheetsContext, SheetsStoreContext } from "./sheets-client";
import type { SheetEntry } from "./sheets-client";

function SheetSlotEntry({ entry }: { entry: SheetEntry }) {
  const sheets = React.useContext(SheetsContext);
  const isOpen = entry.status !== "closing";

  const handleStateChange = React.useCallback(
    (event: SheetChangeEvent) => {
      if (event.type === "OPEN") {
        sheets?.markDidOpen(entry.key);
      }

      if (event.type === "HIDDEN") {
        sheets?.markDidDismiss(entry.key);
      }

      entry.options.onStateChange?.(event);
    },
    [sheets, entry.key, entry.options.onStateChange],
  );

  const handleSetIsOpen = React.useCallback(
    (nextIsOpen: boolean) => {
      if (!nextIsOpen) {
        sheets?.dismiss(entry.key);
      }
    },
    [sheets, entry.key],
  );

  const handleDismissed = React.useCallback(() => {
    sheets?.markDidDismiss(entry.key);
  }, [sheets, entry.key]);

  return (
    <BottomSheet
      isOpen={isOpen}
      setIsOpen={handleSetIsOpen}
      onDismissed={handleDismissed}
      snapPoints={entry.options.snapPoints}
      initialIndex={entry.options.initialIndex}
      canDismiss={entry.options.canDismiss}
      onDismissPrevented={entry.options.onDismissPrevented}
      onStateChange={handleStateChange}
      containerStyle={entry.options.containerStyle}
      appearanceAndroid={entry.options.appearanceAndroid}
      appearanceIOS={entry.options.appearanceIOS}
    >
      {entry.element}
    </BottomSheet>
  );
}

export function SheetSlot() {
  const store = React.useContext(SheetsStoreContext);
  const sheets = useStore(store, (state) => state.sheets);

  return (
    <>
      {sheets.map((entry) => (
        <SheetSlotEntry key={entry.key} entry={entry} />
      ))}
    </>
  );
}
