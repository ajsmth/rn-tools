import * as React from "react";
import { RenderTree, RenderTreeStoreContext } from "@rn-tools/core";
import { SheetsContext, SheetsStoreContext } from "./sheets-client";
import type { SheetsClient } from "./sheets-client";
import { SheetSlot } from "./sheet-slot";

export type SheetsProviderProps = {
  sheets: SheetsClient;
  children: React.ReactNode;
};

export function SheetsProvider({ sheets, children }: SheetsProviderProps) {
  const existingRenderTreeStore = React.useContext(RenderTreeStoreContext);
  const localRenderTreeStore = sheets.renderTreeStore;

  React.useEffect(() => {
    sheets.setRenderTreeStore(existingRenderTreeStore ?? localRenderTreeStore);
  }, [sheets, existingRenderTreeStore, localRenderTreeStore]);

  const content = (
    <SheetsContext.Provider value={sheets}>
      <SheetsStoreContext.Provider value={sheets.store}>
        {children}
        <SheetSlot />
      </SheetsStoreContext.Provider>
    </SheetsContext.Provider>
  );

  if (existingRenderTreeStore) {
    return content;
  }

  return <RenderTree store={sheets.renderTreeStore}>{content}</RenderTree>;
}
