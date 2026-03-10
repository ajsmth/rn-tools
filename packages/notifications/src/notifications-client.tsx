import {
  EVENTS,
  Overlay,
  TreeProvider,
  createTransitionStore,
  createTree,
} from "@rn-tools/core";
import * as React from "react";
import { NotificationsSlot } from "./notifications-slot";
import { NOTIFICATION_NODE } from "./notification-constants";
import { NativeTopLane, NativeBottomLane } from "./notifications-native-view";

type NotificationOptions = {
  id?: string;
  position?: "top" | "bottom";
  durationMs?: number | null;
  onPress?: () => void;
};

const LANE_HEIGHT = 280;

export function createNotifications(tree = createTree()) {
  let counter = 0;
  const store = createTransitionStore();

  function present(
    element: React.ReactElement,
    options: NotificationOptions = {},
  ) {
    let { id, position = "top", durationMs = 3000, ...props } = options;
    id = options.id ?? `notification-${counter++}`;

    store.add(id, element, { position, durationMs, ...props });
    store.transition(id, EVENTS.OPEN);
    return id;
  }

  function dismiss(id?: string) {
    if (!id) {
      const activeNode = tree.getActiveNode(NOTIFICATION_NODE);
      id = activeNode?.extraId ?? "";
    }

    if (id) {
      store.transition(id, EVENTS.CLOSE);
    }
  }

  function dismissAll() {
    store
      .getEntries(store.getState())
      .forEach((e) => store.transition(e.id, EVENTS.CLOSE));
  }

  const Provider = React.memo(function Provider({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <TreeProvider tree={tree}>
        <Overlay>
          <NativeTopLane height={LANE_HEIGHT}>
            <NotificationsSlot position="top" store={store} />
          </NativeTopLane>

          <NativeBottomLane height={LANE_HEIGHT}>
            <NotificationsSlot position="bottom" store={store} />
          </NativeBottomLane>
        </Overlay>
        {children}
      </TreeProvider>
    );
  });

  return {
    present,
    dismiss,
    dismissAll,
    Provider,
  };
}
