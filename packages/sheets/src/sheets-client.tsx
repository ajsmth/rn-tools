import * as React from "react";
import { createOverlayStore, createRenderTreeStore } from "@rn-tools/core";
import type {
  Store,
  RenderTreeStore,
  BaseOverlayOptions,
  OverlayState,
} from "@rn-tools/core";
import type { NativeSheetViewProps } from "./native-sheets-view";

export type SheetOptions = BaseOverlayOptions & NativeSheetViewProps;

export type SheetsState = OverlayState<SheetOptions>;
export type SheetsStore = Store<SheetsState>;

export type SheetsClient = {
  store: SheetsStore;
  renderTreeStore: RenderTreeStore;
  setRenderTreeStore: (renderTreeStore: RenderTreeStore) => void;
  present: (
    element: string | React.ReactElement,
    options?: Partial<SheetOptions>,
  ) => string;
  mount: (id: string) => void;
  dismiss: (id?: string) => void;
  dismissAll: () => void;
  remove: (id: string) => void;
  markDidOpen: (key: string) => void;
  markDidDismiss: (key: string) => void;
};

export type SheetEntry = SheetsState["entries"][number];
export type SheetStatus = SheetEntry["status"];
export type SheetInjectedProps = {
  dismiss?: () => void;
};

export const SHEET_TYPE = "sheet";

export const SheetsContext = React.createContext<SheetsClient | null>(null);
export const SheetsStoreContext = React.createContext<SheetsStore | null>(null);
export const SheetEntryKeyContext = React.createContext<string | null>(null);

export function useSheetEntry() {
  const sheets = React.useContext(SheetsContext);
  const entryKey = React.useContext(SheetEntryKeyContext);

  const dismiss = React.useCallback(() => {
    if (entryKey) {
      sheets.dismiss(entryKey);
      return;
    }
    sheets.dismiss();
  }, [sheets, entryKey]);

  return React.useMemo(
    () => ({
      entryKey,
      dismiss,
      dismissAll: sheets.dismissAll,
    }),
    [entryKey, dismiss, sheets.dismissAll],
  );
}

export function createSheets(
  renderTreeStore: RenderTreeStore = createRenderTreeStore(),
): SheetsClient {
  const overlay = createOverlayStore<SheetOptions>({
    type: SHEET_TYPE,
    renderTreeStore,
  });

  function present(
    idOrElement: string | React.ReactElement,
    options?: SheetOptions,
  ) {
    if (typeof idOrElement === "string") {
      overlay.markOpening(idOrElement);
      return idOrElement;
    }

    return overlay.add(idOrElement, options);
  }

  function mount(id: string) {
    overlay.add(null, { id, status: "mounted" });
  }

  return {
    store: overlay.store,
    renderTreeStore: overlay.renderTreeStore,
    setRenderTreeStore: overlay.setRenderTreeStore,
    present,
    mount,
    dismiss: overlay.remove,
    dismissAll: overlay.removeAll,
    remove: overlay.destroy,
    markDidOpen: overlay.markOpened,
    markDidDismiss: overlay.markClosed,
  };
}
