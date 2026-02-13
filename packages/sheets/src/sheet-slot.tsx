import * as React from "react";
import { useStore } from "@rn-tools/core";
import { BottomSheet } from "./native-sheets-view";
import type { SheetChangeEvent } from "./native-sheets-view";
import { SheetsContext, SheetsStoreContext } from "./sheets-client";
import type { SheetEntry } from "./sheets-client";

function SheetSlotEntry({ entry }: { entry: SheetEntry }) {
  const sheets = React.useContext(SheetsContext);
  const hasOpened = React.useRef(false);

  // If the sheet was closed before it ever opened (e.g. rapid dismiss),
  // there is no close animation to wait for — remove immediately.
  React.useEffect(() => {
    if (!entry.open && !hasOpened.current) {
      console.log(
        `[SheetSlotEntry] zombie cleanup key="${entry.key}" — removing (never opened)`,
      );
      sheets?.dismiss(entry.key);
    }
  }, [entry.open, sheets, entry.key]);

  const handleStateChange = React.useCallback(
    (event: SheetChangeEvent) => {
      console.log(
        `[SheetSlotEntry] onStateChange key="${entry.key}" type=${event.type} hasOpened=${hasOpened.current}`,
      );

      if (event.type === "OPEN") {
        hasOpened.current = true;
      }

      if (event.type === "HIDDEN" && hasOpened.current) {
        // Animation complete — remove entry from store
        sheets?.dismiss(entry.key);
      }

      entry.options.onStateChange?.(event);
    },
    [sheets, entry.key, entry.options.onStateChange],
  );

  const handleSetIsOpen = React.useCallback(
    (nextIsOpen: boolean) => {
      console.log(
        `[SheetSlotEntry] setIsOpen key="${entry.key}" nextIsOpen=${nextIsOpen} hasOpened=${hasOpened.current}`,
      );
      // Ignore the spurious onDismiss the native view fires when
      // it mounts with computedIsOpen=false (auto-sized sheets).
      // Only act on dismiss after the sheet has truly opened.
      if (!nextIsOpen && hasOpened.current) {
        sheets?.dismiss(entry.key);
      }
    },
    [sheets, entry.key],
  );

  console.log(
    `[SheetSlotEntry] render key="${entry.key}" open=${entry.open} hasOpened=${hasOpened.current} snapPoints=${JSON.stringify(entry.options.snapPoints)}`,
  );

  return (
    <BottomSheet
      isOpen={entry.open}
      setIsOpen={handleSetIsOpen}
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

  console.log(`[SheetSlot] render: ${sheets.length} sheet(s)`);

  return (
    <>
      {sheets.map((entry) => (
        <SheetSlotEntry key={entry.key} entry={entry} />
      ))}
    </>
  );
}
