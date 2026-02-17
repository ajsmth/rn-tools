import * as React from "react";
import { createOverlayStore } from "@rn-tools/core";
import type {
  Store,
  RenderTreeStore,
  BaseOverlayOptions,
  OverlayState,
} from "@rn-tools/core";
import type {
  AppearanceAndroid,
  AppearanceIOS,
  SheetChangeEvent,
} from "./native-sheets-view";
import type { ViewStyle } from "react-native";

export type SheetOptions = BaseOverlayOptions & {
  snapPoints?: number[];
  initialIndex?: number;
  canDismiss?: boolean;
  onDismissPrevented?: () => void;
  onStateChange?: (event: SheetChangeEvent) => void;
  containerStyle?: ViewStyle;
  appearanceAndroid?: AppearanceAndroid;
  appearanceIOS?: AppearanceIOS;
};

export type SheetsState = OverlayState<SheetOptions>;
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

export type SheetEntry = SheetsState["entries"][number];
export type SheetStatus = SheetEntry["status"];

export const SHEET_TYPE = "sheet";

export const SheetsContext = React.createContext<SheetsClient | null>(null);
export const SheetsStoreContext = React.createContext<SheetsStore | null>(null);

export function createSheets(renderTreeStore: RenderTreeStore): SheetsClient {
  const overlay = createOverlayStore<SheetOptions>({
    type: SHEET_TYPE,
    renderTreeStore,
  });

  return {
    store: overlay.store,
    present: overlay.add,
    dismiss: overlay.remove,
    dismissAll: overlay.removeAll,
    remove: overlay.destroy,
    markDidOpen: overlay.markOpened,
    markDidDismiss: overlay.markClosed,
  };
}
