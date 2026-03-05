import * as React from "react";
import type { SheetsClient, SheetsStore } from "./sheets-client";

export const SHEET_TYPE = "sheet";

export const SheetsContext = React.createContext<SheetsClient | null>(null);
export const SheetsStoreContext = React.createContext<SheetsStore | null>(null);
export const SheetEntryKeyContext = React.createContext<string | null>(null);

export function useSheetsStore(): SheetsStore {
  const store = React.useContext(SheetsStoreContext);

  if (!store) {
    throw new Error(
      "SheetsStoreContext is unavailable. Wrap this tree in createSheets().Provider.",
    );
  }

  return store;
}
