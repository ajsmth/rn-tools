import * as React from "react";
import { SheetsContext, SheetsStoreContext } from "./sheets-client";
import type { SheetsClient } from "./sheets-client";
import { SheetSlot } from "./sheet-slot";

export type SheetsProviderProps = {
  sheets: SheetsClient;
  children: React.ReactNode;
};

export function SheetsProvider({ sheets, children }: SheetsProviderProps) {
  return (
    <SheetsContext.Provider value={sheets}>
      <SheetsStoreContext.Provider value={sheets.store}>
        {children}
        <SheetSlot />
      </SheetsStoreContext.Provider>
    </SheetsContext.Provider>
  );
}
