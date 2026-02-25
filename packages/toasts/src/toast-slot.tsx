import * as React from "react";
import { RenderTreeNode, useStore } from "@rn-tools/core";
import {
  Animated,
  Easing,
  StyleSheet,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { ToastHost } from "./native-toast-view";
import {
  LaneDebugOverlay,
  type LaneDebugComparison,
  type LaneDebugSummary,
} from "./toast-debug-ui";
import {
  TOAST_TYPE,
  ToastEntryKeyContext,
  ToastsContext,
  ToastsStoreContext,
} from "./toasts-client";
import type { ToastEntry } from "./toasts-client";

const STACK_GAP = 6;
const ENTER_EXIT_DURATION_MS = 280;
const REFLOW_DURATION_MS = 240;
const ESTIMATED_TOAST_HEIGHT = 48;
const OFFSCREEN_OFFSET = 20;
const DEFAULT_LANE_VISIBLE_HEIGHT = 280;
const TOP_LANE_TEST_ID = "rn-tools-toasts-lane-top";
const BOTTOM_LANE_TEST_ID = "rn-tools-toasts-lane-bottom";

type LanePosition = "top" | "bottom";

type LaneAnimItem = {
  y: Animated.Value;
  opacity: Animated.Value;
  hasEntered: boolean;
  isExiting: boolean;
  didMarkShow: boolean;
  targetY: number | null;
};

export const ToastSlot = React.memo(function ToastSlot({
  debugLayout = false,
}: {
  debugLayout?: boolean;
}) {
  const store = React.useContext(ToastsStoreContext);
  const toasts = React.useContext(ToastsContext);
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

  const [topSummary, setTopSummary] = React.useState<LaneDebugSummary | null>(
    null,
  );
  const [bottomSummary, setBottomSummary] =
    React.useState<LaneDebugSummary | null>(null);

  const handleLaneSummary = React.useCallback((summary: LaneDebugSummary) => {
    if (summary.lane === "top") {
      setTopSummary(summary);
      return;
    }
    setBottomSummary(summary);
  }, []);

  return (
    <ToastHost debugLayout={debugLayout}>
      <AnimatedLane
        lane="top"
        laneTestID={TOP_LANE_TEST_ID}
        debugLayout={debugLayout}
        entries={topEntries}
        activeKey={activeKey}
        toasts={toasts}
        onDebugSummary={handleLaneSummary}
        debugComparison={{
          top: topSummary,
          bottom: bottomSummary,
        }}
      />
      <AnimatedLane
        lane="bottom"
        laneTestID={BOTTOM_LANE_TEST_ID}
        debugLayout={debugLayout}
        entries={bottomEntries}
        activeKey={activeKey}
        toasts={toasts}
        onDebugSummary={handleLaneSummary}
      />
    </ToastHost>
  );
});

const AnimatedLane = React.memo(function AnimatedLane({
  lane,
  laneTestID,
  debugLayout,
  entries,
  activeKey,
  toasts,
  onDebugSummary,
  debugComparison,
}: {
  lane: LanePosition;
  laneTestID: string;
  debugLayout: boolean;
  entries: ToastEntry[];
  activeKey: string | null;
  toasts: React.ContextType<typeof ToastsContext>;
  onDebugSummary: (summary: LaneDebugSummary) => void;
  debugComparison?: LaneDebugComparison;
}) {
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
          lane === "top" ? -(ESTIMATED_TOAST_HEIGHT + OFFSCREEN_OFFSET) : 0,
        ),
        opacity: new Animated.Value(0),
        hasEntered: false,
        isExiting: false,
        didMarkShow: false,
        targetY: null,
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

  const targetOffsets = React.useMemo(() => {
    const renderedEntries = entries.filter(
      (entry) => entry.status !== "closing",
    );
    const next = new Map<string, number>();

    if (renderedEntries.length === 0) {
      return next;
    }

    const heights = renderedEntries.map(
      (entry) => measuredHeights[entry.key] ?? ESTIMATED_TOAST_HEIGHT,
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

    let cursor = Math.max(0, laneVisibleHeight - stackHeight);
    for (let i = 0; i < renderedEntries.length; i++) {
      const entry = renderedEntries[i];
      next.set(entry.key, cursor);
      cursor += heights[i] + STACK_GAP;
    }

    return next;
  }, [entries, lane, laneLayout?.height, measuredHeights]);

  React.useEffect(() => {
    if (!debugLayout) {
      return;
    }

    const summary: LaneDebugSummary = {
      lane,
      count: entries.length,
      layout: laneLayout,
      rows: entries.map((entry) => ({
        key: entry.key,
        status: entry.status,
        measuredHeight: measuredHeights[entry.key] ?? ESTIMATED_TOAST_HEIGHT,
        targetY: targetOffsets.get(entry.key) ?? null,
      })),
    };
    onDebugSummary(summary);

    if (!__DEV__) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`[toasts][${lane}] entries`, summary.rows);
  }, [
    debugLayout,
    entries,
    lane,
    laneLayout,
    measuredHeights,
    onDebugSummary,
    targetOffsets,
  ]);

  React.useEffect(() => {
    for (const entry of entries) {
      const key = entry.key;
      const item = getOrCreateAnimItem(key);

      const knownHeight = measuredHeights[key] ?? ESTIMATED_TOAST_HEIGHT;
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
        if (item.isExiting) {
          continue;
        }
        item.isExiting = true;
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
            toasts?.markDidDismiss(key);
          }
        });
        continue;
      }

      if (typeof targetY !== "number") {
        continue;
      }

      if (!item.hasEntered) {
        item.hasEntered = true;
        item.isExiting = false;
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
          if (finished && entry.status === "opening" && !item.didMarkShow) {
            item.didMarkShow = true;
            toasts?.markDidShow(key);
          }
        });
        continue;
      }

      if (item.targetY === targetY && !item.isExiting) {
        continue;
      }

      item.isExiting = false;
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
        if (finished && entry.status === "opening" && !item.didMarkShow) {
          item.didMarkShow = true;
          toasts?.markDidShow(key);
        }
      });
    }
  }, [
    entries,
    getOrCreateAnimItem,
    lane,
    measuredHeights,
    targetOffsets,
    toasts,
  ]);

  const handleToastLayout = React.useCallback((key: string, height: number) => {
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
      style={[
        styles.lane,
        debugLayout &&
          (lane === "top" ? styles.laneTopDebug : styles.laneBottomDebug),
      ]}
      testID={laneTestID}
      onLayout={handleLaneLayout}
    >
      <LaneDebugOverlay
        enabled={debugLayout}
        lane={lane}
        entriesCount={entries.length}
        laneLayout={laneLayout}
        debugComparison={debugComparison}
      />
      {entries.map((entry) => {
        const item = getOrCreateAnimItem(entry.key);

        return (
          <Animated.View
            key={entry.key}
            pointerEvents="box-none"
            style={[
              styles.toastItem,
              styles.toastItemTop,
              {
                opacity: item.opacity,
                transform: [{ translateY: item.y }],
              },
            ]}
            onLayout={(event) =>
              handleToastLayout(entry.key, event.nativeEvent.layout.height)
            }
          >
            <ToastSlotEntry entry={entry} active={entry.key === activeKey} />
          </Animated.View>
        );
      })}
    </View>
  );
});

const ToastSlotEntry = React.memo(function ToastSlotEntry({
  entry,
  active,
}: {
  entry: ToastEntry;
  active: boolean;
}) {
  return (
    <RenderTreeNode type={TOAST_TYPE} id={entry.key} active={active}>
      <ToastEntryKeyContext.Provider value={entry.key}>
        {entry.element}
      </ToastEntryKeyContext.Provider>
    </RenderTreeNode>
  );
});

const styles = StyleSheet.create({
  lane: {
    ...StyleSheet.absoluteFillObject,
  },
  toastItem: {
    left: 0,
    position: "absolute",
    right: 0,
  },
  toastItemTop: {
    top: 0,
  },
  laneTopDebug: {
    borderColor: "rgba(255, 59, 48, 0.7)",
    borderWidth: 1,
  },
  laneBottomDebug: {
    borderColor: "rgba(10, 132, 255, 0.7)",
    borderWidth: 1,
  },
});
