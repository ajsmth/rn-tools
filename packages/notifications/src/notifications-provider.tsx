import * as React from "react";
import { RenderTree, RenderTreeStoreContext } from "@rn-tools/core";
import { NotificationsContext, NotificationsStoreContext } from "./notifications-client";
import type { NotificationsClient } from "./notifications-client";
import { NotificationSlot } from "./notification-slot";

export type NotificationsProviderProps = {
  notifications: NotificationsClient;
  children: React.ReactNode;
  debugLayout?: boolean;
};

export function NotificationsProvider({
  notifications,
  children,
  debugLayout = false,
}: NotificationsProviderProps) {
  const parentRenderTreeStore = React.useContext(RenderTreeStoreContext);

  if (parentRenderTreeStore) {
    notifications.setRenderTreeStore(parentRenderTreeStore);
  }

  const content = (
    <NotificationsContext.Provider value={notifications}>
      <NotificationsStoreContext.Provider value={notifications.store}>
        {children}
        <NotificationSlot debugLayout={debugLayout} />
      </NotificationsStoreContext.Provider>
    </NotificationsContext.Provider>
  );

  if (parentRenderTreeStore) {
    return content;
  }

  return <RenderTree store={notifications.renderTreeStore}>{content}</RenderTree>;
}
