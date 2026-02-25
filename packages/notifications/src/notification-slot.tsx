import * as React from "react";
import { RenderTreeNode, useStore } from "@rn-tools/core";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { NativeBottomLane, NativeTopLane, NotificationHost } from "./native-notification-view";
import { LaneDebugProvider, LaneDebugOverlay } from "./notification-debug-ui";
import {
  NOTIFICATION_TYPE,
  NotificationEntryKeyContext,
  NotificationsContext,
  NotificationsStoreContext,
} from "./notifications-client";
import type { NotificationEntry } from "./notifications-client";

const STACK_GAP = 6;
const ENTER_EXIT_DURATION_MS = 280;
const REFLOW_DURATION_MS = 240;
const ESTIMATED_NOTIFICATION_HEIGHT = 48;
const OFFSCREEN_OFFSET = 20;
const DEFAULT_LANE_VISIBLE_HEIGHT = 280;

type LanePosition = "top" | "bottom";

type LaneAnimItem = {
  y: Animated.Value;
  opacity: Animated.Value;
  targetY: number | null | undefined;
};

type NotificationLaneItemProps = {
  entryKey: string;
  element: React.ReactNode;
  active: boolean;
  opacity: Animated.Value;
  translateY: Animated.Value;
  onMeasureHeight: (key: string, height: number) => void;
};

export const NotificationSlot = React.memo(function NotificationSlot({
  debugLayout = false,
}: {
  debugLayout?: boolean;
}) {
  const store = React.useContext(NotificationsStoreContext);
  const notifications = React.useContext(NotificationsContext);
  const entries = useStore(store, (state) => state.entries);

  const activeKey = React.useMemo(() => {
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].status !== "closing") {
        return entries[i].key;
      }
    }
    return null;
  }, [entries]);

  const topEntries = React.useMemo(
    () =>
      entries.filter((entry) => (entry.options.position ?? "top") === "top"),
    [entries],
  );

  const bottomEntries = React.useMemo(
    () => entries.filter((entry) => entry.options.position === "bottom"),
    [entries],
  );

  return (
    <NotificationHost debugLayout={debugLayout}>
      <LaneDebugProvider enabled={debugLayout}>
        <NativeTopLane>
          <AnimatedLane
            lane="top"
            debugLayout={debugLayout}
            entries={topEntries}
            activeKey={activeKey}
            notifications={notifications}
          />
        </NativeTopLane>
        <NativeBottomLane>
          <AnimatedLane
            lane="bottom"
            debugLayout={debugLayout}
            entries={bottomEntries}
            activeKey={activeKey}
            notifications={notifications}
          />
        </NativeBottomLane>
      </LaneDebugProvider>
    </NotificationHost>
  );
});
type AnimatedLaneProps = {
  lane: LanePosition;
  debugLayout: boolean;
  entries: NotificationEntry[];
  activeKey: string | null;
  notifications: React.ContextType<typeof NotificationsContext>;
};

const AnimatedLane = React.memo(function AnimatedLane({
  lane,
  debugLayout,
  entries,
  activeKey,
  notifications,
}: AnimatedLaneProps) {
  const [measuredHeights, setMeasuredHeights] = React.useState<
    Record<string, number>
  >({});

  const [laneLayout, setLaneLayout] = React.useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);

  const animItemsRef = React.useRef(new Map<string, LaneAnimItem>());

  const activeKeysSet = React.useMemo(
    () => new Set(entries.map((entry) => entry.key)),
    [entries],
  );

  const getOrCreateAnimItem = React.useCallback(
    (key: string) => {
      const existing = animItemsRef.current.get(key);

      if (existing) {
        return existing;
      }

      const item: LaneAnimItem = {
        y: new Animated.Value(
          lane === "top" ? -(ESTIMATED_NOTIFICATION_HEIGHT + OFFSCREEN_OFFSET) : 0,
        ),
        opacity: new Animated.Value(0),
        targetY: undefined,
      };

      animItemsRef.current.set(key, item);
      return item;
    },
    [lane],
  );

  React.useEffect(() => {
    for (const key of Array.from(animItemsRef.current.keys())) {
      if (!activeKeysSet.has(key)) {
        animItemsRef.current.delete(key);
      }
    }
  }, [activeKeysSet]);

  // Measures the heights of sibling items and gaps between them to determine the target offset for each item. This is used to drive the animations.
  const targetOffsets = React.useMemo(() => {
    const renderedEntries = entries.filter(
      (entry) => entry.status !== "closing",
    );

    const next = new Map<string, number>();

    if (renderedEntries.length === 0) {
      return next;
    }

    const heights = renderedEntries.map(
      (entry) => measuredHeights[entry.key] ?? ESTIMATED_NOTIFICATION_HEIGHT,
    );

    if (lane === "top") {
      let cursor = 0;
      for (let i = renderedEntries.length - 1; i >= 0; i--) {
        const entry = renderedEntries[i];
        next.set(entry.key, cursor);
        cursor += heights[i] + STACK_GAP;
      }
      return next;
    }

    const stackHeight =
      heights.reduce((sum, height) => sum + height, 0) +
      Math.max(0, renderedEntries.length - 1) * STACK_GAP;

    const laneVisibleHeight = Math.min(
      laneLayout?.height ?? DEFAULT_LANE_VISIBLE_HEIGHT,
      DEFAULT_LANE_VISIBLE_HEIGHT,
    );

    // Position animated containers starting from the bottom of the lane and stacking upwards
    let cursor = Math.max(0, laneVisibleHeight - stackHeight);
    for (let i = 0; i < renderedEntries.length; i++) {
      const entry = renderedEntries[i];
      next.set(entry.key, cursor);
      cursor += heights[i] + STACK_GAP;
    }

    return next;
  }, [entries, lane, laneLayout?.height, measuredHeights]);

  React.useEffect(() => {
    for (const entry of entries) {
      const key = entry.key;
      const item = getOrCreateAnimItem(key);

      const knownHeight = measuredHeights[key] ?? ESTIMATED_NOTIFICATION_HEIGHT;
      const targetY = targetOffsets.get(key);
      const enterFromY =
        lane === "top"
          ? -(knownHeight + OFFSCREEN_OFFSET)
          : DEFAULT_LANE_VISIBLE_HEIGHT + OFFSCREEN_OFFSET;
      const exitY =
        lane === "top"
          ? -(knownHeight + OFFSCREEN_OFFSET)
          : DEFAULT_LANE_VISIBLE_HEIGHT + knownHeight + OFFSCREEN_OFFSET;

      if (entry.status === "closing") {
        if (item.targetY === null) {
          continue;
        }
        item.targetY = null;

        Animated.parallel([
          Animated.timing(item.opacity, {
            toValue: 0,
            duration: ENTER_EXIT_DURATION_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(item.y, {
            toValue: exitY,
            duration: ENTER_EXIT_DURATION_MS,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished) {
            notifications?.markDidDismiss(key);
          }
        });
        continue;
      }

      if (typeof targetY !== "number") {
        continue;
      }

      if (typeof item.targetY !== "number") {
        item.y.setValue(enterFromY);
        item.opacity.setValue(0);
        item.targetY = targetY;

        Animated.parallel([
          Animated.timing(item.opacity, {
            toValue: 1,
            duration: ENTER_EXIT_DURATION_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(item.y, {
            toValue: targetY,
            duration: ENTER_EXIT_DURATION_MS,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished) {
            notifications?.markDidShow(key);
          }
        });
        continue;
      }

      if (item.targetY === targetY) {
        continue;
      }

      item.targetY = targetY;

      Animated.parallel([
        Animated.timing(item.opacity, {
          toValue: 1,
          duration: REFLOW_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(item.y, {
          toValue: targetY,
          duration: REFLOW_DURATION_MS,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (finished) {
          notifications?.markDidShow(key);
        }
      });
    }
  }, [
    entries,
    getOrCreateAnimItem,
    lane,
    measuredHeights,
    targetOffsets,
    notifications,
  ]);

  const handleNotificationLayout = React.useCallback((key: string, height: number) => {
    const nextHeight = Math.round(height);

    setMeasuredHeights((current) => {
      if (current[key] === nextHeight) {
        return current;
      }

      return {
        ...current,
        [key]: nextHeight,
      };
    });
  }, []);

  const handleLaneLayout = React.useCallback((event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout;
    setLaneLayout((current) => {
      if (
        current &&
        current.x === next.x &&
        current.y === next.y &&
        current.width === next.width &&
        current.height === next.height
      ) {
        return current;
      }
      return next;
    });
  }, []);

  return (
    <View
      pointerEvents="box-none"
      collapsable={false}
      style={styles.lane}
      onLayout={handleLaneLayout}
    >
      {debugLayout ? (
        <LaneDebugOverlay
          lane={lane}
          entries={entries}
          laneLayout={laneLayout}
          measuredHeights={measuredHeights}
          targetOffsets={targetOffsets}
          estimatedHeight={ESTIMATED_NOTIFICATION_HEIGHT}
        />
      ) : null}

      {entries.map((entry) => {
        const item = getOrCreateAnimItem(entry.key);

        return (
          <NotificationLaneItem
            key={entry.key}
            entryKey={entry.key}
            element={entry.element}
            active={entry.key === activeKey}
            opacity={item.opacity}
            translateY={item.y}
            onMeasureHeight={handleNotificationLayout}
          />
        );
      })}
    </View>
  );
});

const NotificationLaneItem = React.memo(function NotificationLaneItem({
  entryKey,
  element,
  active,
  opacity,
  translateY,
  onMeasureHeight,
}: NotificationLaneItemProps) {
  const handleLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      onMeasureHeight(entryKey, event.nativeEvent.layout.height);
    },
    [entryKey, onMeasureHeight],
  );

  const style = React.useMemo(() => {
    return [
      styles.notificationItem,
      {
        opacity,
        transform: [{ translateY }],
      },
    ];
  }, [opacity, translateY]);

  return (
    <Animated.View
      pointerEvents="box-none"
      style={style}
      onLayout={handleLayout}
    >
      <NotificationSlotEntry entryKey={entryKey} element={element} active={active} />
    </Animated.View>
  );
});

const NotificationSlotEntry = React.memo(function NotificationSlotEntry({
  entryKey,
  element,
  active,
}: {
  entryKey: string;
  element: React.ReactNode;
  active: boolean;
}) {
  return (
    <RenderTreeNode type={NOTIFICATION_TYPE} id={entryKey} active={active}>
      <NotificationEntryKeyContext.Provider value={entryKey}>
        {element}
      </NotificationEntryKeyContext.Provider>
    </RenderTreeNode>
  );
});

const styles = StyleSheet.create({
  lane: {
    ...StyleSheet.absoluteFillObject,
  },
  notificationItem: {
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
});
