import * as React from "react";
import { createStore } from "@rn-tools/core";
import type { Store } from "@rn-tools/core";
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

export type SheetEntry = {
  key: string;
  element: React.ReactElement;
  options: SheetOptions;
  open: boolean;
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
};

export const SheetsContext = React.createContext<SheetsClient | null>(null);
export const SheetsStoreContext = React.createContext<SheetsStore | null>(null);

let counter = 0;

export function createSheets(): SheetsClient {
  const store = createStore<SheetsState>({ sheets: [] });

  function present(
    element: React.ReactElement,
    options: SheetOptions = {},
  ): string {
    const key = `sheet-${++counter}`;

    store.setState((prev) => {
      if (
        options.id &&
        prev.sheets.some((entry) => entry.options.id === options.id)
      ) {
        console.log(
          `[sheets] present: duplicate id="${options.id}", skipping`,
        );
        return prev;
      }

      const logId = options.id || "(none)";
      console.log(
        `[sheets] present: key="${key}" id="${logId}"`,
      );
      return {
        ...prev,
        sheets: [...prev.sheets, { key, element, options, open: true }],
      };
    });

    return key;
  }

  function dismiss(id?: string) {
    store.setState((prev) => {
      if (prev.sheets.length === 0) return prev;

      // Find target entry
      let targetIndex: number;

      if (id == null) {
        // Find topmost open sheet
        targetIndex = -1;
        for (let i = prev.sheets.length - 1; i >= 0; i--) {
          if (prev.sheets[i].open) {
            targetIndex = i;
            break;
          }
        }
        if (targetIndex === -1) return prev;
      } else {
        targetIndex = prev.sheets.findIndex(
          (entry) => entry.options.id === id || entry.key === id,
        );
        if (targetIndex === -1) return prev;
      }

      const entry = prev.sheets[targetIndex];

      if (entry.open) {
        // Phase 1: mark as closing (triggers close animation)
        console.log(`[sheets] dismiss: closing key="${entry.key}"`);
        const sheets = [...prev.sheets];
        sheets[targetIndex] = { ...entry, open: false };
        return { ...prev, sheets };
      } else {
        // Phase 2: remove after animation complete
        console.log(`[sheets] dismiss: removing key="${entry.key}"`);
        return {
          ...prev,
          sheets: prev.sheets.filter((_, i) => i !== targetIndex),
        };
      }
    });
  }

  function dismissAll() {
    store.setState((prev) => {
      if (prev.sheets.length === 0) return prev;

      const hasOpen = prev.sheets.some((e) => e.open);
      if (!hasOpen) return prev;

      console.log(`[sheets] dismissAll: closing ${prev.sheets.length} sheet(s)`);
      return {
        ...prev,
        sheets: prev.sheets.map((e) =>
          e.open ? { ...e, open: false } : e,
        ),
      };
    });
  }

  return { store, present, dismiss, dismissAll };
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
