import * as React from "react";
import {
  RenderTree,
  RenderTreeStoreContext,
  createRenderTreeStore,
  createOverlayStore,
} from "@rn-tools/core";
import type {
  RenderTreeStore,
  BaseOverlayOptions,
  OverlayState,
  OverlayStore,
} from "@rn-tools/core";
import type { NativeSheetViewProps } from "./native-sheets-view";
import { SheetSlot } from "./sheet-slot";
import { SHEET_TYPE, SheetsStoreContext } from "./sheets-context";

export type SheetOptions = BaseOverlayOptions & NativeSheetViewProps;

export type SheetsState = OverlayState<SheetOptions>;
export type SheetsStore = OverlayStore<SheetOptions>;

export type SheetsClient = {
  present(element: React.ReactElement, options?: Partial<SheetOptions>): string;
  present(id: string): string;

  dismiss: (id?: string) => void;
  dismissAll: () => void;
};

export type SheetEntry = SheetsState["entries"][number];
export type SheetStatus = SheetEntry["status"];

export {
  SHEET_TYPE,
  SheetEntryKeyContext,
  SheetsContext,
  SheetsStoreContext,
} from "./sheets-context";

type SheetsProviderProps = {
  store: SheetsStore;
  children: React.ReactNode;
};

const SheetsProvider = React.memo(function SheetsProvider({
  store,
  children,
}: SheetsProviderProps) {
  const parentRenderTreeStore = React.useContext(RenderTreeStoreContext);

  if (parentRenderTreeStore) {
    store.setRenderTreeStore(parentRenderTreeStore);
  }

  const content = (
    <SheetsStoreContext.Provider value={store}>
      {children}
      <SheetSlot />
    </SheetsStoreContext.Provider>
  );

  if (parentRenderTreeStore) {
    return content;
  }

  return <RenderTree store={store.renderTreeStore}>{content}</RenderTree>;
});

export function createSheets(
  renderTreeStore: RenderTreeStore = createRenderTreeStore(),
) {
  const store = createOverlayStore<SheetOptions>({
    type: SHEET_TYPE,
    renderTreeStore,
  });

  function present(
    element: React.ReactElement,
    options?: Partial<SheetOptions>,
  ): string;
  function present(id: string): string;
  function present(
    idOrElement: string | React.ReactElement,
    options?: SheetOptions,
  ) {
    if (typeof idOrElement === "string") {
      store.markOpening(idOrElement);
      return idOrElement;
    }

    return store.add(idOrElement, options);
  }

  const Provider = React.memo(function Provider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return <SheetsProvider store={store}>{children}</SheetsProvider>;
  });

  const client: SheetsClient = {
    present,
    dismiss: store.remove,
    dismissAll: store.removeAll,
  };

  return {
    ...client,
    Provider,
  };
}
