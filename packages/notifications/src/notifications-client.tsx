import * as React from "react";
import { createOverlayStore, createRenderTreeStore } from "@rn-tools/core";
import type {
  Store,
  RenderTreeStore,
  BaseOverlayOptions,
  OverlayState,
} from "@rn-tools/core";

export type NotificationOptions = BaseOverlayOptions & {
  position?: "top" | "bottom";
  durationMs?: number;
};

export type NotificationsState = OverlayState<NotificationOptions>;
export type NotificationsStore = Store<NotificationsState>;
export type NotificationPosition = "top" | "bottom";
export type NotificationDismissTarget = string | NotificationPosition;
export type NotificationInjectedProps = {
  dismiss?: () => void;
};

export type NotificationsClient = {
  store: NotificationsStore;
  renderTreeStore: RenderTreeStore;
  setRenderTreeStore: (renderTreeStore: RenderTreeStore) => void;
  show: (element: React.ReactElement, options?: NotificationOptions) => string;
  dismiss: (target?: NotificationDismissTarget) => void;
  dismissAll: () => void;
  remove: (id: string) => void;
  markDidShow: (key: string) => void;
  markDidDismiss: (key: string) => void;
};

export type NotificationEntry = NotificationsState["entries"][number];
export type NotificationStatus = NotificationEntry["status"];

export const NOTIFICATION_TYPE = "notification";

export const NotificationsContext = React.createContext<NotificationsClient | null>(null);
export const NotificationsStoreContext = React.createContext<NotificationsStore | null>(null);
export const NotificationEntryKeyContext = React.createContext<string | null>(null);

export function useNotifications(): NotificationsClient {
  const notifications = React.useContext(NotificationsContext);
  if (!notifications) {
    throw new Error("NotificationsProvider is missing from the component tree.");
  }
  return notifications;
}

export function useNotificationEntry() {
  const notifications = useNotifications();
  const entryKey = React.useContext(NotificationEntryKeyContext);

  const dismiss = React.useCallback(() => {
    if (entryKey) {
      notifications.dismiss(entryKey);
      return;
    }
    notifications.dismiss();
  }, [notifications, entryKey]);

  return React.useMemo(
    () => ({
      entryKey,
      dismiss,
      dismissAll: notifications.dismissAll,
    }),
    [entryKey, dismiss, notifications.dismissAll],
  );
}

export function createNotifications(
  renderTreeStore: RenderTreeStore = createRenderTreeStore(),
): NotificationsClient {
  const overlay = createOverlayStore<NotificationOptions>({
    type: NOTIFICATION_TYPE,
    renderTreeStore,
  });
  const { store, ...fns } = overlay;

  const dismiss: NotificationsClient["dismiss"] = (target) => {
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

  const markDidDismiss: NotificationsClient["markDidDismiss"] = (key) => {
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
