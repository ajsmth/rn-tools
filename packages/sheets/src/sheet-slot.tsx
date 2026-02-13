import * as React from "react";
import { RenderTreeNode, useStore } from "@rn-tools/core";
import { BottomSheet } from "./native-sheets-view";
import type { SheetChangeEvent } from "./native-sheets-view";
import { SheetsContext, SheetsStoreContext } from "./sheets-client";
import type { SheetEntry } from "./sheets-client";

function SheetSlotEntry({
  entry,
  active,
}: {
  entry: SheetEntry;
  active: boolean;
}) {
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
    <RenderTreeNode type="sheet" id={entry.key} active={active}>
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
    </RenderTreeNode>
  );
}

export function SheetSlot() {
  const store = React.useContext(SheetsStoreContext);
  const sheets = useStore(store, (state) => state.sheets);
  const activeKey = React.useMemo(() => {
    for (let i = sheets.length - 1; i >= 0; i--) {
      if (sheets[i].status !== "closing") {
        return sheets[i].key;
      }
    }
    return null;
  }, [sheets]);

  return (
    <>
      {sheets.map((entry) => (
        <SheetSlotEntry
          key={entry.key}
          entry={entry}
          active={entry.key === activeKey}
        />
      ))}
    </>
  );
}
