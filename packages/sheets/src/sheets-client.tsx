import * as React from "react";
import {
  createStore,
  getRenderNodeActive,
  getRenderNodeDepth,
} from "@rn-tools/core";
import type { Store, RenderTreeStore } from "@rn-tools/core";
import type {
  AppearanceAndroid,
  AppearanceIOS,
  SheetChangeEvent,
} from "./native-sheets-view";
import type { ViewStyle } from "react-native";

export type SheetOptions = {
  id?: string;
  snapPoints?: number[];
  initialIndex?: number;
  canDismiss?: boolean;
  onDismissPrevented?: () => void;
  onStateChange?: (event: SheetChangeEvent) => void;
  containerStyle?: ViewStyle;
  appearanceAndroid?: AppearanceAndroid;
  appearanceIOS?: AppearanceIOS;
};

export type SheetStatus = "opening" | "open" | "closing";

export type SheetEntry = {
  key: string;
  element: React.ReactElement;
  options: SheetOptions;
  status: SheetStatus;
};

export type SheetsState = {
  sheets: SheetEntry[];
};

export type SheetsStore = Store<SheetsState>;

export type SheetsClient = {
  store: SheetsStore;
  present: (element: React.ReactElement, options?: SheetOptions) => string;
  dismiss: (id?: string) => void;
  dismissAll: () => void;
  remove: (id: string) => void;
  markDidOpen: (key: string) => void;
  markDidDismiss: (key: string) => void;
};

export const SheetsContext = React.createContext<SheetsClient | null>(null);
export const SheetsStoreContext = React.createContext<SheetsStore | null>(null);

let counter = 0;

export function createSheets(
  renderTreeStore: RenderTreeStore,
): SheetsClient {
  const store = createStore<SheetsState>({ sheets: [] });

  function getActiveSheetKeyFromRenderTree(): string | null {
    const tree = renderTreeStore.getState();
    let deepestId: string | null = null;
    let deepestDepth = -1;

    for (const [id, node] of tree.nodes) {
      if (node.type !== "sheet") continue;
      if (!getRenderNodeActive(tree, id)) continue;

      const depth = getRenderNodeDepth(tree, id);
      if (depth > deepestDepth) {
        deepestDepth = depth;
        deepestId = id;
      }
    }

    return deepestId;
  }

  function present(
    element: React.ReactElement,
    options: SheetOptions = {},
  ): string {
    const generatedKey = `sheet-${++counter}`;
    let presentedKey = generatedKey;

    store.setState((prev) => {
      if (options.id == null) {
        return {
          ...prev,
          sheets: [
            ...prev.sheets,
            { key: generatedKey, element, options, status: "opening" },
          ],
        };
      }

      const duplicateIndex = prev.sheets.findIndex(
        (entry) => entry.options.id === options.id,
      );

      if (duplicateIndex === -1) {
        return {
          ...prev,
          sheets: [
            ...prev.sheets,
            { key: generatedKey, element, options, status: "opening" },
          ],
        };
      }

      const duplicate = prev.sheets[duplicateIndex];
      presentedKey = duplicate.key;
      const nextEntry: SheetEntry = {
        key: duplicate.key,
        element,
        options,
        status: "opening",
      };

      const withoutDuplicate = prev.sheets.filter((_, i) => i !== duplicateIndex);
      return {
        ...prev,
        sheets: [...withoutDuplicate, nextEntry],
      };
    });

    return presentedKey;
  }

  function dismiss(id?: string) {
    store.setState((prev) => {
      if (prev.sheets.length === 0) return prev;

      let targetIndex = -1;

      if (id == null) {
        const activeSheetKey = getActiveSheetKeyFromRenderTree();
        if (activeSheetKey) {
          targetIndex = prev.sheets.findIndex(
            (entry) => entry.key === activeSheetKey,
          );
        }

        if (targetIndex !== -1) {
          const activeEntry = prev.sheets[targetIndex];
          if (activeEntry.status === "closing") {
            targetIndex = -1;
          }
        }

        if (targetIndex !== -1) {
          const sheets = [...prev.sheets];
          sheets[targetIndex] = { ...prev.sheets[targetIndex], status: "closing" };
          return { ...prev, sheets };
        }

        // Fallback: close latest non-closing entry when render-tree has no active sheet.
        for (let i = prev.sheets.length - 1; i >= 0; i--) {
          if (prev.sheets[i].status !== "closing") {
            targetIndex = i;
            break;
          }
        }
      } else {
        targetIndex = prev.sheets.findIndex(
          (entry) => entry.options.id === id || entry.key === id,
        );
      }

      if (targetIndex === -1) return prev;

      const entry = prev.sheets[targetIndex];
      if (entry.status === "closing") return prev;

      const sheets = [...prev.sheets];
      sheets[targetIndex] = { ...entry, status: "closing" };
      return { ...prev, sheets };
    });

  }

  function dismissAll() {
    store.setState((prev) => {
      if (prev.sheets.length === 0) return prev;

      let changed = false;
      const sheets = prev.sheets.map((entry) => {
        if (entry.status === "closing") return entry;
        changed = true;
        return { ...entry, status: "closing" as const };
      });

      if (!changed) return prev;

      return {
        ...prev,
        sheets,
      };
    });

  }

  function remove(id: string) {
    store.setState((prev) => {
      const targetIndex = prev.sheets.findIndex(
        (entry) => entry.options.id === id || entry.key === id,
      );
      if (targetIndex === -1) return prev;

      return {
        ...prev,
        sheets: prev.sheets.filter((_, i) => i !== targetIndex),
      };
    });

  }

  function markDidOpen(key: string) {
    store.setState((prev) => {
      const index = prev.sheets.findIndex((entry) => entry.key === key);
      if (index === -1) return prev;

      const entry = prev.sheets[index];
      if (entry.status !== "opening") return prev;

      const sheets = [...prev.sheets];
      sheets[index] = { ...entry, status: "open" };
      return { ...prev, sheets };
    });

  }

  function markDidDismiss(key: string) {
    store.setState((prev) => {
      const index = prev.sheets.findIndex((entry) => entry.key === key);
      if (index === -1) return prev;

      const entry = prev.sheets[index];
      if (entry.status !== "closing") {
        // Ignore dismiss notifications unless close was requested.
        return prev;
      }

      return {
        ...prev,
        sheets: prev.sheets.filter((_, i) => i !== index),
      };
    });

  }

  return {
    store,
    present,
    dismiss,
    dismissAll,
    remove,
    markDidOpen,
    markDidDismiss,
  };
}

export function useSheets(): SheetsClient {
  const sheets = React.useContext(SheetsContext);
  if (!sheets) {
    throw new Error("SheetsProvider is missing from the component tree.");
  }
  return sheets;
}

export function useSheetsStore(): SheetsStore {
  const store = React.useContext(SheetsStoreContext);
  if (!store) {
    throw new Error("SheetsProvider is missing from the component tree.");
  }
  return store;
}
