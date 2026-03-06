import * as React from "react";
import {
  EVENTS,
  NodeRegistryItem,
  STATUSES,
  TransitionStore,
  TreeNode,
} from "@rn-tools/core";
import { SHEET_NODE } from "./sheets-context";
import { NativeBottomSheet, SheetChangeEvent } from "./native-bottom-sheet";

type SheetsSlotProps = {
  store: TransitionStore;
};

export const SheetsSlot = React.memo(function SheetsSlot({
  store,
}: SheetsSlotProps) {
  const entries = store.useEntries();

  return (
    <>
      {entries.map((entry, index, arr) => (
        <TreeNode
          key={entry.id}
          type={SHEET_NODE}
          active={index === arr.length - 1}
        >
          <NodeRegistryItem id={entry.id}>
            <SheetEntry
              id={entry.id}
              status={entry.status}
              transition={store.transition}
              useEntry={store.useEntry}
            />
          </NodeRegistryItem>
        </TreeNode>
      ))}
    </>
  );
});

type SheetEntryProps = {
  id: string;
  status: string;
  transition: TransitionStore["transition"];
  useEntry: TransitionStore["useEntry"];
};

const SheetEntry = React.memo(function SheetEntry({
  id,
  status,
  transition,
  useEntry,
}: SheetEntryProps) {
  const { element = null, props = {} } = useEntry(id);

  const isOpen = React.useMemo(
    () => status !== STATUSES.CLOSING && status !== STATUSES.CLOSED,
    [status],
  );

  const handleSheetStateChange = React.useCallback(
    (event: SheetChangeEvent) => {
      if (event.type === "OPEN") {
        transition(id, EVENTS.OPENED);
      }

      if (event.type === "HIDDEN") {
        switch (status) {
          case STATUSES.CLOSED: {
            transition(id, EVENTS.UNMOUNT);
          }

          case STATUSES.OPEN: {
            transition(id, EVENTS.CLOSE);
            transition(id, EVENTS.CLOSED);
            transition(id, EVENTS.UNMOUNT);
          }

          case STATUSES.CLOSING: {
            transition(id, EVENTS.CLOSED);
          }
        }
      }

      props.onStateChange?.(event);
    },
    [transition, id, props, status],
  );

  const handleOpenChange = React.useCallback(
    (isOpen: boolean) => {
      if (!isOpen) {
        transition(id, EVENTS.UNMOUNT);
      }
    },
    [id, transition],
  );

  return (
    <NativeBottomSheet
      {...props}
      isOpen={isOpen}
      onStateChange={handleSheetStateChange}
      setIsOpen={handleOpenChange}
    >
      {element}
    </NativeBottomSheet>
  );
});
