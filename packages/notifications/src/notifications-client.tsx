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
  durationMs?: number | null;
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
export const DEFAULT_NOTIFICATION_DURATION_MS = 3000;

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
  const autoDismissTimers = new Map<string, ReturnType<typeof setTimeout>>();

  const clearAutoDismissTimer = (key: string) => {
    const timer = autoDismissTimers.get(key);
    if (timer == null) {
      return;
    }
    clearTimeout(timer);
    autoDismissTimers.delete(key);
  };

  const clearTimersForClosingTransitions = (
    beforeEntries: NotificationsState["entries"],
    afterEntries: NotificationsState["entries"],
  ) => {
    const beforeByKey = new Map(beforeEntries.map((entry) => [entry.key, entry]));
    for (const after of afterEntries) {
      const before = beforeByKey.get(after.key);
      if (!before) {
        continue;
      }
      if (before.status !== "closing" && after.status === "closing") {
        clearAutoDismissTimer(after.key);
      }
    }
  };

  const resolveDurationMs = (options?: NotificationOptions) => {
    if (options?.durationMs === null) {
      return null;
    }
    if (typeof options?.durationMs === "number") {
      return options.durationMs;
    }
    return DEFAULT_NOTIFICATION_DURATION_MS;
  };

  const scheduleAutoDismiss = (key: string, options?: NotificationOptions) => {
    clearAutoDismissTimer(key);
    const duration = resolveDurationMs(options);
    if (duration == null || !Number.isFinite(duration) || duration <= 0) {
      return;
    }

    const timeout = setTimeout(() => {
      autoDismissTimers.delete(key);
      dismiss(key);
    }, duration);
    autoDismissTimers.set(key, timeout);
  };

  const show: NotificationsClient["show"] = (element, options) => {
    const key = fns.add(element, options);
    scheduleAutoDismiss(key, options);
    return key;
  };

  const dismiss: NotificationsClient["dismiss"] = (target) => {
    const beforeEntries = store.getState().entries;
    if (target === "top" || target === "bottom") {
      for (let i = beforeEntries.length - 1; i >= 0; i--) {
        const entry = beforeEntries[i];
        if (entry.status === "closing") {
          continue;
        }
        const position = entry.options.position ?? "top";
        if (position === target) {
          clearAutoDismissTimer(entry.key);
          fns.remove(entry.key);
          return;
        }
      }
      return;
    }

    fns.remove(target);
    const afterEntries = store.getState().entries;
    clearTimersForClosingTransitions(beforeEntries, afterEntries);
  };

  const dismissAll: NotificationsClient["dismissAll"] = () => {
    const beforeEntries = store.getState().entries;
    fns.removeAll();
    const afterEntries = store.getState().entries;
    clearTimersForClosingTransitions(beforeEntries, afterEntries);
  };

  const remove: NotificationsClient["remove"] = (id) => {
    const target = store
      .getState()
      .entries.find((entry) => entry.key === id || entry.options.id === id);
    if (target) {
      clearAutoDismissTimer(target.key);
    }
    fns.destroy(id);
  };

  const markDidDismiss: NotificationsClient["markDidDismiss"] = (key) => {
    // Native dismissal (e.g. auto-dismiss timer) can fire without JS first
    // transitioning the entry to "closing". Ensure the lifecycle is valid.
    clearAutoDismissTimer(key);
    fns.remove(key);
    fns.markClosed(key);
  };

  return {
    store: store,
    get renderTreeStore() {
      return overlay.renderTreeStore;
    },
    setRenderTreeStore: overlay.setRenderTreeStore,
    show,
    dismiss,
    dismissAll,
    remove,
    markDidShow: fns.markOpened,
    markDidDismiss,
  };
}
