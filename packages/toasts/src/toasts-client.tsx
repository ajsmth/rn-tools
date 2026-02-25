import * as React from "react";
import { createOverlayStore, createRenderTreeStore } from "@rn-tools/core";
import type {
  Store,
  RenderTreeStore,
  BaseOverlayOptions,
  OverlayState,
} from "@rn-tools/core";

export type ToastOptions = BaseOverlayOptions & {
  position?: "top" | "bottom";
  durationMs?: number;
};

export type ToastsState = OverlayState<ToastOptions>;
export type ToastsStore = Store<ToastsState>;
export type ToastPosition = "top" | "bottom";
export type ToastDismissTarget = string | ToastPosition;

export type ToastsClient = {
  store: ToastsStore;
  renderTreeStore: RenderTreeStore;
  setRenderTreeStore: (renderTreeStore: RenderTreeStore) => void;
  show: (element: React.ReactElement, options?: ToastOptions) => string;
  dismiss: (target?: ToastDismissTarget) => void;
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
export const ToastEntryKeyContext = React.createContext<string | null>(null);

export function useToasts(): ToastsClient {
  const toasts = React.useContext(ToastsContext);
  if (!toasts) {
    throw new Error("ToastsProvider is missing from the component tree.");
  }
  return toasts;
}

export function useToastEntry() {
  const toasts = useToasts();
  const entryKey = React.useContext(ToastEntryKeyContext);

  const dismiss = React.useCallback(() => {
    if (entryKey) {
      toasts.dismiss(entryKey);
      return;
    }
    toasts.dismiss();
  }, [toasts, entryKey]);

  return React.useMemo(
    () => ({
      entryKey,
      dismiss,
      dismissAll: toasts.dismissAll,
    }),
    [entryKey, dismiss, toasts.dismissAll],
  );
}

export function createToasts(
  renderTreeStore: RenderTreeStore = createRenderTreeStore(),
): ToastsClient {
  const overlay = createOverlayStore<ToastOptions>({
    type: TOAST_TYPE,
    renderTreeStore,
  });
  const { store, ...fns } = overlay;

  const dismiss: ToastsClient["dismiss"] = (target) => {
    if (target === "top" || target === "bottom") {
      const entries = store.getState().entries;
      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        if (entry.status === "closing") {
          continue;
        }
        const position = entry.options.position ?? "top";
        if (position === target) {
          fns.remove(entry.key);
          return;
        }
      }
      return;
    }

    fns.remove(target);
  };

  const markDidDismiss: ToastsClient["markDidDismiss"] = (key) => {
    // Native dismissal (e.g. auto-dismiss timer) can fire without JS first
    // transitioning the entry to "closing". Ensure the lifecycle is valid.
    fns.remove(key);
    fns.markClosed(key);
  };

  return {
    store: store,
    get renderTreeStore() {
      return overlay.renderTreeStore;
    },
    setRenderTreeStore: overlay.setRenderTreeStore,
    show: fns.add,
    dismiss,
    dismissAll: fns.removeAll,
    remove: fns.destroy,
    markDidShow: fns.markOpened,
    markDidDismiss,
  };
}
