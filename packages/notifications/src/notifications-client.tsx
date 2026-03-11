import {
  EVENTS,
  Overlay,
  TreeProvider,
  createTransitionStore,
  createTree,
  useSafeAreaInsets,
} from "@rn-tools/core";
import * as React from "react";
import { ViewStyle, useWindowDimensions } from "react-native";
import { NotificationsSlot } from "./notifications-slot";
import { NOTIFICATION_NODE } from "./notification-constants";
import { NativeTopLane, NativeBottomLane } from "./notifications-native-view";

type NotificationOptions = {
  id?: string;
  position?: "top" | "bottom";
  durationMs?: number | null;
  onPress?: () => void;
};

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
    const { top, bottom } = useSafeAreaInsets();
    const { height: windowHeight } = useWindowDimensions();

    const [topMeasuredHeight, setTopMeasuredHeight] = React.useState(0);
    const [bottomMeasuredHeight, setBottomMeasuredHeight] = React.useState(0);

    const bottomOffset = Math.max(
      0,
      windowHeight - bottom - bottomMeasuredHeight,
    );

    const topStyles: ViewStyle = React.useMemo(() => {
      return {
        position: "absolute",
        left: 0,
        right: 0,
        top: top,
        height: topMeasuredHeight,
      };
    }, [topMeasuredHeight, top]);

    const bottomStyles: ViewStyle = React.useMemo(() => {
      return {
        position: "absolute",
        left: 0,
        right: 0,
        top: bottomOffset,
        height: bottomMeasuredHeight,
      };
    }, [bottomOffset, bottomMeasuredHeight]);

    return (
      <TreeProvider tree={tree}>
        <Overlay
          contentHeight={topMeasuredHeight}
          offsetTop={top}
          style={topStyles}
        >
          <NativeTopLane height={topMeasuredHeight}>
            <NotificationsSlot
              position="top"
              store={store}
              onContentHeightChange={setTopMeasuredHeight}
            />
          </NativeTopLane>
        </Overlay>

        <Overlay
          contentHeight={bottomMeasuredHeight}
          offsetTop={bottomOffset}
          style={bottomStyles}
        >
          <NativeBottomLane height={bottomMeasuredHeight}>
            <NotificationsSlot
              position="bottom"
              store={store}
              onContentHeightChange={setBottomMeasuredHeight}
            />
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
