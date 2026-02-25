import * as React from "react";
import { RenderTree, RenderTreeStoreContext } from "@rn-tools/core";
import { ToastsContext, ToastsStoreContext } from "./toasts-client";
import type { ToastsClient } from "./toasts-client";
import { ToastSlot } from "./toast-slot";

export type ToastsProviderProps = {
  toasts: ToastsClient;
  children: React.ReactNode;
  debugLayout?: boolean;
};

export function ToastsProvider({
  toasts,
  children,
  debugLayout = false,
}: ToastsProviderProps) {
  const parentRenderTreeStore = React.useContext(RenderTreeStoreContext);

  if (parentRenderTreeStore) {
    toasts.setRenderTreeStore(parentRenderTreeStore);
  }

  const content = (
    <ToastsContext.Provider value={toasts}>
      <ToastsStoreContext.Provider value={toasts.store}>
        {children}
        <ToastSlot debugLayout={debugLayout} />
      </ToastsStoreContext.Provider>
    </ToastsContext.Provider>
  );

  if (parentRenderTreeStore) {
    return content;
  }

  return <RenderTree store={toasts.renderTreeStore}>{content}</RenderTree>;
}
