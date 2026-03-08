import {
  createTree,
  createTransitionStore,
  EVENTS,
  TreeProvider,
} from "@rn-tools/core";
import * as React from "react";
import { STACK_SLOT, StackStoreContext } from "./stack-context";
import { NativeScreenProps } from "./native-stack";

type BaseOptions = {
  id?: string;
  stackId?: string;
};

type ScreenOptions = BaseOptions &
  Partial<Omit<NativeScreenProps, "children" | "active">>;

export function createStack(tree = createTree()) {
  let counter = 0;
  const store = createTransitionStore();

  function push(element: React.ReactElement, options: ScreenOptions = {}) {
    const id = options.id ?? `stack-${counter++}`;
    let slotId = options.stackId ?? "";

    if (!slotId) {
      const activeNode = tree.getActiveNode(STACK_SLOT);
      slotId = activeNode?.extraId;
    }

    store.add(id, element, { ...options, id, slotId });
    store.transition(id, EVENTS.OPEN);
  }

  function pop(amount = 1, options: BaseOptions = {}) {
    let slotId = options.stackId ?? "";

    if (!slotId) {
      const activeNode = tree.getActiveNode(STACK_SLOT);
      slotId = activeNode?.extraId;
    }

    if (slotId) {
      const slotEntries = store
        .getEntries(store.getState())
        .filter((e) => e.props.slotId === slotId);

      const max = Math.min(slotEntries.length, amount);

      for (let i = 0; i < max; i++) {
        const entry = slotEntries[slotEntries.length - 1 - i];
        store.transition(entry.id, EVENTS.CLOSE);
      }
    }
  }

  const Provider = React.memo(function Provider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <TreeProvider tree={tree}>
        <StackStoreContext.Provider value={store}>
          {children}
        </StackStoreContext.Provider>
      </TreeProvider>
    );
  });

  return {
    push,
    pop,
    Provider,
  };
}
