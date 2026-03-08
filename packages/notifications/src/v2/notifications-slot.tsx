import { EVENTS, STATUSES, TransitionStore, TreeNode } from "@rn-tools/core";
import * as React from "react";
import { NOTIFICATION_NODE } from "./notification-constants";

type NotificationsSlotProps = {
  store: TransitionStore;
  position: "top" | "bottom";
};

export const NotificationsSlot = React.memo(function NotificationsSlot(
  props: NotificationsSlotProps,
) {
  const { store, position } = props;

  const entries = store
    .useEntries()
    .filter((e) => e.props.position === position);

  return (
    <SlotContainer position={position}>
      {entries.map((e, index, arr) => (
        <TreeNode
          type={NOTIFICATION_NODE}
          id={e.id}
          key={e.id}
          active={index === arr.length - 1}
        >
          <SlotItem id={e.id} store={store} />
        </TreeNode>
      ))}
    </SlotContainer>
  );
});

type SlotContainerProps = {
  position: NotificationsSlotProps["position"];
  children: React.ReactNode;
};

const SlotContainer = React.memo(function SlotContainer(
  props: SlotContainerProps,
) {
  const { children } = props;

  return <React.Fragment>{children}</React.Fragment>;
});

type SlotItemProps = {
  id: string;
  store: TransitionStore;
};

const SlotItem = React.memo(function SlotItem({ id, store }: SlotItemProps) {
  const { status, element, props } = store.useEntry(id);

  React.useEffect(() => {
    switch (status) {
      case STATUSES.CLOSING: {
        store.transition(id, EVENTS.CLOSED);
        break;
      }

      case STATUSES.OPENING: {
        store.transition(id, EVENTS.OPENED);
        break;
      }

      case STATUSES.CLOSED: {
        store.transition(id, EVENTS.UNMOUNT);
        break;
      }
    }
  }, [status, id]);

  return <>{element}</>;
});
