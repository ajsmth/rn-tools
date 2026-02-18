import * as React from "react";
import { createOverlayStore } from "@rn-tools/core";
import type {
  Store,
  RenderTreeStore,
  BaseOverlayOptions,
  OverlayState,
} from "@rn-tools/core";

export type ToastOptions = BaseOverlayOptions & {
  position?: "top" | "bottom";
  duration?: number;
};

export type ToastsState = OverlayState<ToastOptions>;
export type ToastsStore = Store<ToastsState>;

export type ToastsClient = {
  store: ToastsStore;
  show: (element: React.ReactElement, options?: ToastOptions) => string;
  dismiss: (id?: string) => void;
  dismissAll: () => void;
  remove: (id: string) => void;
  markDidShow: (key: string) => void;
  markDidDismiss: (key: string) => void;
};

export type ToastEntry = ToastsState["entries"][number];
export type ToastStatus = ToastEntry["status"];

export const TOAST_TYPE = "toast";

export const ToastsContext = React.createContext<ToastsClient | null>(null);
export const ToastsStoreContext = React.createContext<ToastsStore | null>(null);

export function createToasts(renderTreeStore: RenderTreeStore): ToastsClient {
  const overlay = createOverlayStore<ToastOptions>({
    type: TOAST_TYPE,
    renderTreeStore,
  });

  return {
    store: overlay.store,
    show: overlay.add,
    dismiss: overlay.remove,
    dismissAll: overlay.removeAll,
    remove: overlay.destroy,
    markDidShow: overlay.markOpened,
    markDidDismiss: overlay.markClosed,
  };
}
