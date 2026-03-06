import {
  Tree,
  createTransitionStore,
  createTree,
  EVENTS,
  TreeProvider,
  createNodeRegistry,
  NodeRegistryProvider,
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

export function createSheets(
  tree: Tree = createTree(),
  registry = createNodeRegistry(),
) {
  let counter = 0;

  const store = createTransitionStore();

  function push(
    element: React.ReactElement<unknown>,
    options: Partial<SheetOptions> = {},
  ) {
    const id = options.id ?? `sheet-${counter++}`;

    store.add(id, element, options);
    store.transition(id, EVENTS.OPEN);
  }

  function show(id: string) {
    if (!store.getEntry(id)) {
      // Warn?
    }

    store.transition(id, EVENTS.OPEN);
  }

  function dismiss(id?: string) {
    if (id == null) {
      const activeNodeId = tree.getActiveNode(SHEET_NODE)?.id;
      id = registry.nodes[activeNodeId];
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
        <NodeRegistryProvider registry={registry}>
          <SheetStoreContext.Provider value={store}>
            {children}
            <SheetsSlot store={store} />
          </SheetStoreContext.Provider>
        </NodeRegistryProvider>
      </TreeProvider>
    );
  });

  return {
    push,
    show,
    dismiss,
    dismissAll,
    Provider,
  };
}
