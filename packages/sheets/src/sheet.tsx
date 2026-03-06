import * as React from "react";
import { SHEET_NODE, SheetStoreContext } from "./sheets-context";
import { EVENTS, NodeRegistryItem, STATUSES, TreeNode } from "@rn-tools/core";
import {
  BottomSheetProps,
  NativeBottomSheet,
  SheetChangeEvent,
} from "./native-bottom-sheet";

export type SheetProps = {
  id: string;
} & Omit<BottomSheetProps, "isOpen">;

export const Sheet = React.memo(function Sheet({
  id,
  children,
  onStateChange: _onStateChange,
  ...props
}: SheetProps) {
  const store = React.useContext(SheetStoreContext);

  React.useEffect(() => {
    if (!store.getEntry(id)) {
      store.add(id);
    }

    return () => {
      store.transition(id, EVENTS.UNMOUNT);
    };
  }, [store, id]);

  const { status } = store.useEntry(id);

  const isOpen = React.useMemo(
    () => status === STATUSES.OPEN || status === STATUSES.OPENING,
    [status],
  );

  const handleSheetStateChange = React.useCallback(
    (event: SheetChangeEvent) => {
      if (event.type === "OPEN") {
        store.transition(id, EVENTS.OPENED);
      }

      if (event.type === "HIDDEN") {
        store.transition(id, EVENTS.CLOSE);
        store.transition(id, EVENTS.CLOSED);
      }

      _onStateChange?.(event);
    },
    [store, _onStateChange],
  );

  return (
    <TreeNode type={SHEET_NODE}>
      <NodeRegistryItem id={id}>
        <NativeBottomSheet
          isOpen={isOpen}
          onStateChange={handleSheetStateChange}
          {...props}
        >
          {children}
        </NativeBottomSheet>
      </NodeRegistryItem>
    </TreeNode>
  );
});
