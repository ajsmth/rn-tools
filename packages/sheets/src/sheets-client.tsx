import {
  Tree,
  createTransitionStore,
  createTree,
  EVENTS,
  TreeProvider,
} from "@rn-tools/core";
import * as React from "react";
import { SHEET_NODE, SheetStoreContext } from "./sheets-context";
import { SheetsSlot } from "./sheets-slot";
import { BottomSheetProps } from "./native-bottom-sheet";

type SheetOptions = {
  id?: string;
} & Pick<
  BottomSheetProps,
  | "snapPoints"
  | "initialIndex"
  | "appearanceIOS"
  | "appearanceAndroid"
  | "containerStyle"
>;

type ProviderProps = {
  children: React.ReactNode;
};

export function createSheets(tree: Tree = createTree()) {
  let counter = 0;

  const store = createTransitionStore();

  function open(
    element: React.ReactElement<unknown>,
    options: Partial<SheetOptions> = {},
  ) {
    const id = options.id ?? `sheet-${counter++}`;

    store.add(id, element, options);
    store.transition(id, EVENTS.OPEN);

    return id;
  }

  function show(id: string) {
    if (!store.getEntry(id)) {
      // Warn?
    }

    store.transition(id, EVENTS.OPEN);
  }

  function dismiss(id?: string) {
    if (id == null) {
      const activeNode = tree.getActiveNode(SHEET_NODE);
      id = activeNode?.extraId;
    }

    const entry = store.getEntry(id);

    if (id != null && entry != null) {
      store.transition(id, EVENTS.CLOSE);
    }
  }

  function dismissAll() {
    store.getState().entries.forEach((e) => dismiss(e.id));
  }

  // TODO - handle multiple slots - register nodes and add target to entries
  const Provider = React.memo(function Provider({ children }: ProviderProps) {
    return (
      <TreeProvider tree={tree}>
        <SheetStoreContext.Provider value={store}>
          {children}
          <SheetsSlot store={store} />
        </SheetStoreContext.Provider>
      </TreeProvider>
    );
  });

  return {
    open,
    show,
    dismiss,
    dismissAll,
    Provider,
  };
}
