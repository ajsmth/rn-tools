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
import {
  NativeTopLane,
  NativeBottomLane,
} from "./notifications-native-view";

type NotificationOptions = {
  id?: string;
  position?: "top" | "bottom";
};

export function createNotifications(tree = createTree()) {
  let counter = 0;
  const store = createTransitionStore();

  function present(
    element: React.ReactElement,
    options: NotificationOptions = {},
  ) {
    let { id, position = "top", ...props } = options;
    id = options.id ?? `notification-${counter++}`;

    store.add(id, element, { position, ...props });

    store.transition(id, EVENTS.OPEN);
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
          <NativeTopLane>
            <NotificationsSlot position="top" store={store} />
          </NativeTopLane>

          <NativeBottomLane>
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
