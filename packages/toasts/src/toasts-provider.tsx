import * as React from "react";
import { ToastsContext, ToastsStoreContext } from "./toasts-client";
import type { ToastsClient } from "./toasts-client";
import { ToastSlot } from "./toast-slot";

export type ToastsProviderProps = {
  toasts: ToastsClient;
  children: React.ReactNode;
};

export function ToastsProvider({ toasts, children }: ToastsProviderProps) {
  return (
    <ToastsContext.Provider value={toasts}>
      <ToastsStoreContext.Provider value={toasts.store}>
        {children}
        <ToastSlot />
      </ToastsStoreContext.Provider>
    </ToastsContext.Provider>
  );
}
