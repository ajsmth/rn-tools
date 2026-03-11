import {
  EVENTS,
  STATUSES,
  TransitionItemEntry,
  TransitionStore,
  TreeNode,
} from "@rn-tools/core";
import * as React from "react";
import { NOTIFICATION_NODE } from "./notification-constants";
import {
  Animated,
  LayoutChangeEvent,
  Pressable,
  ViewStyle,
} from "react-native";
import { createLayoutEngine } from "./notifications-layout-engine";

type NotificationsSlotProps = {
  store: TransitionStore;
  position: "top" | "bottom";
  onContentHeightChange?: (height: number) => void;
};

export const NotificationsSlot = React.memo(function NotificationsSlot(
  props: NotificationsSlotProps,
) {
  const { store, position } = props;
  const { onContentHeightChange } = props;

  const entries = store
    .useEntries()
    .filter((e) => e.props.position === position);

  const [heights, setHeights] = React.useState<Record<string, number>>({});

  const handleItemLayout = React.useCallback((id: string, height: number) => {
    setHeights((prev) => {
      const previousHeight = prev[id] ?? 0;
      const nextHeight = Math.max(previousHeight, height);

      if (nextHeight === previousHeight) {
        return prev;
      }

      return {
        ...prev,
        [id]: nextHeight,
      };
    });
  }, []);

  const engine = React.useRef(createLayoutEngine(position));

  React.useEffect(() => {
    engine.current = createLayoutEngine(position);
  }, [position]);

  const layout = React.useMemo(() => {
    return engine.current.computeLayouts({
      entries,
      heights,
    });
  }, [entries, heights]);

  React.useEffect(() => {
    if (!onContentHeightChange) {
      return;
    }

    // TODO - udpate this to just measure heights? Limit how much this rerenders
    const nextHeight = entries.reduce((maxHeight, entry) => {
      const measuredHeight = heights[entry.id];
      const node = layout[entry.id];

      if (measuredHeight == null || node == null) {
        return maxHeight;
      }

      const start = Math.max(
        Math.abs(node.toY),
        Math.abs(node.fromY ?? node.toY),
      );

      return Math.max(maxHeight, start + measuredHeight);
    }, 0);

    onContentHeightChange(nextHeight);
  }, [entries, heights, layout, onContentHeightChange]);

  return (
    <>
      {entries.map((e, index, arr) => (
        <TreeNode
          key={e.id}
          type={NOTIFICATION_NODE}
          id={e.id}
          active={index === arr.length - 1}
        >
          <SlotItemAnimatedContainer
            id={e.id}
            status={e.status}
            durationMs={e.props.durationMs}
            height={heights[e.id]}
            offsetY={layout[e.id]?.toY}
            fromY={layout[e.id]?.fromY}
            position={position}
            store={store}
          >
            <SlotItem id={e.id} store={store} onLayout={handleItemLayout} />
          </SlotItemAnimatedContainer>
        </TreeNode>
      ))}
    </>
  );
});

type SlotItemProps = {
  id: string;
  store: TransitionStore;
  onLayout: (id: string, height: number) => void;
};

const SlotItem = React.memo(function SlotItem({
  id,
  store,
  onLayout,
}: SlotItemProps) {
  const { element, props = {} } = store.useEntry(id);
  const { onPress } = props;

  const handlePress = React.useCallback(() => {
    store.transition(id, EVENTS.CLOSE);
    onPress?.();
  }, [store, id, onPress]);

  const handleLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      onLayout(id, event.nativeEvent.layout.height);
    },
    [id, onLayout],
  );

  return (
    <Pressable onPress={handlePress} onLayout={handleLayout}>
      {element}
    </Pressable>
  );
});

type SlotItemAnimatedContainerProps = {
  id: string;
  children: React.ReactNode;
  status: TransitionItemEntry["status"];
  store: TransitionStore;
  durationMs?: number | null;
  height?: number;
  offsetY?: number;
  fromY?: number;
  position: NotificationsSlotProps["position"];
};

const SlotItemAnimatedContainer = React.memo(function SlotItemAnimatedContainer(
  props: SlotItemAnimatedContainerProps,
) {
  const {
    id,
    status,
    children,
    durationMs,
    height,
    offsetY,
    fromY,
    position,
    store,
  } = props;
  const animatedOffset = React.useRef(new Animated.Value(0)).current;
  const animatedPresence = React.useRef(new Animated.Value(0)).current;
  const hasInitializedLayoutRef = React.useRef(false);

  React.useLayoutEffect(() => {
    if (offsetY == null) {
      return;
    }

    if (!hasInitializedLayoutRef.current) {
      animatedOffset.setValue(fromY ?? offsetY);
      hasInitializedLayoutRef.current = true;
    }

    Animated.timing(animatedOffset, {
      toValue: offsetY,
      duration: 220,
      useNativeDriver: true,
    }).start();

    return () => {
      (animatedOffset as { stopAnimation?: () => void }).stopAnimation?.();
    };
  }, [animatedOffset, offsetY, status]);

  React.useLayoutEffect(() => {
    switch (status) {
      case STATUSES.OPENING: {
        animatedPresence.setValue(0);
        Animated.timing(animatedPresence, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }).start(() => {
          if (store.getEntry(id)?.status === STATUSES.OPENING) {
            store.transition(id, EVENTS.OPENED);
          }
        });
        break;
      }

      case STATUSES.CLOSING: {
        Animated.timing(animatedPresence, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }).start(() => {
          if (store.getEntry(id)?.status === STATUSES.CLOSING) {
            store.transition(id, EVENTS.CLOSED);
          }
        });
        break;
      }

      case STATUSES.CLOSED: {
        store.transition(id, EVENTS.UNMOUNT);
        break;
      }

      case STATUSES.OPEN: {
        if (offsetY != null) {
          hasInitializedLayoutRef.current = true;
        }
        animatedPresence.setValue(1);
        break;
      }
    }
  }, [status, store, id, animatedPresence]);

  React.useEffect(() => {
    if (status !== STATUSES.OPEN || durationMs == null) {
      return;
    }

    const timeoutId = setTimeout(() => {
      if (store.getEntry(id)?.status === STATUSES.OPEN) {
        store.transition(id, EVENTS.CLOSE);
      }
    }, durationMs);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [durationMs, id, status, store]);

  const style: ViewStyle = React.useMemo(() => {
    const zIndex = status === STATUSES.CLOSING ? -1 : 1;

    return {
      position: "absolute",
      height,
      left: 0,
      right: 0,
      zIndex,
      top: position === "top" ? 0 : undefined,
      bottom: position === "bottom" ? 0 : undefined,
      opacity: animatedPresence,
      transform: [{ translateY: animatedOffset }],
    };
  }, [height, position, status]);

  const contentStyle = React.useMemo(
    () => ({
      transform: [
        {
          scale: Animated.add(0.96, Animated.multiply(animatedPresence, 0.04)),
        },
      ],
    }),
    [animatedPresence],
  );

  return (
    <Animated.View style={style}>
      <Animated.View style={contentStyle}>{children}</Animated.View>
    </Animated.View>
  );
});
