import { TreeProvider, createStore, createTree } from "@rn-tools/core";
import * as React from "react";
import { TABS_NODE, TabStore, TabStoreContext } from "./tabs-constants";

type Options = {
  tabId?: string;
};

export function createTabs(tree = createTree()) {
  const store = createStore<TabStore>({ activeById: {} });

  function tab(index: number, options: Options = {}) {
    const targetId = options.tabId ?? tree.getActiveNode(TABS_NODE)?.extraId;

    if (targetId) {
      store.setState((prev) => {
        return {
          activeById: {
            ...prev.activeById,
            [targetId]: index,
          },
        };
      });
    }
  }

  const Provider = React.memo(function Provider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <TreeProvider tree={tree}>
        <TabStoreContext.Provider value={store}>
          {children}
        </TabStoreContext.Provider>
      </TreeProvider>
    );
  });

  return {
    tab,
    Provider,
  };
}
