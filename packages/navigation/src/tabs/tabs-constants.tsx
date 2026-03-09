import { createStore } from "@rn-tools/core";
import * as React from "react";

export const TABS_NODE = "tabs";
export const TABS_SCREEN_NODE = "tabs-screen";

export type TabStore = {
  activeById: Record<string, number>;
};

export const TabStoreContext = React.createContext(
  createStore<TabStore>({ activeById: {} }),
);
