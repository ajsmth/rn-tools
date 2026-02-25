import * as React from "react";
import { StyleSheet, Text, View } from "react-native";

type LanePosition = "top" | "bottom";

export type LaneDebugLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
} | null;

export type LaneDebugSummary = {
  lane: LanePosition;
  count: number;
  layout: LaneDebugLayout;
  rows: Array<{
    key: string;
    status: string;
    measuredHeight: number;
    targetY: number | null;
  }>;
};

export type LaneDebugComparison = {
  top: LaneDebugSummary | null;
  bottom: LaneDebugSummary | null;
};

const EMPTY_DEBUG_COMPARISON: LaneDebugComparison = {
  top: null,
  bottom: null,
};

const LaneDebugContext = React.createContext<{
  enabled: boolean;
  comparison: LaneDebugComparison;
  publishSummary: (summary: LaneDebugSummary) => void;
}>({
  enabled: false,
  comparison: EMPTY_DEBUG_COMPARISON,
  publishSummary: () => {},
});

export const LaneDebugProvider = React.memo(function LaneDebugProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [comparison, setComparison] = React.useState<LaneDebugComparison>(
    EMPTY_DEBUG_COMPARISON,
  );

  const publishSummary = React.useCallback(
    (summary: LaneDebugSummary) => {
      if (!enabled) {
        return;
      }

      setComparison((current) => {
        if (summary.lane === "top") {
          return {
            ...current,
            top: summary,
          };
        }
        return {
          ...current,
          bottom: summary,
        };
      });
    },
    [enabled],
  );

  React.useEffect(() => {
    if (!enabled) {
      setComparison(EMPTY_DEBUG_COMPARISON);
    }
  }, [enabled]);

  const value = React.useMemo(
    () => ({
      enabled,
      comparison,
      publishSummary,
    }),
    [comparison, enabled, publishSummary],
  );

  return (
    <LaneDebugContext.Provider value={value}>
      {children}
    </LaneDebugContext.Provider>
  );
});

export function createLaneDebugSummary({
  lane,
  entries,
  laneLayout,
  measuredHeights,
  targetOffsets,
  estimatedHeight,
}: {
  lane: LanePosition;
  entries: Array<{
    key: string;
    status: string;
  }>;
  laneLayout: LaneDebugLayout;
  measuredHeights: Record<string, number>;
  targetOffsets: Map<string, number>;
  estimatedHeight: number;
}): LaneDebugSummary {
  return {
    lane,
    count: entries.length,
    layout: laneLayout,
    rows: entries.map((entry) => ({
      key: entry.key,
      status: entry.status,
      measuredHeight: measuredHeights[entry.key] ?? estimatedHeight,
      targetY: targetOffsets.get(entry.key) ?? null,
    })),
  };
}

function formatLayout(layout: LaneDebugLayout): string {
  if (!layout) {
    return "none";
  }
  return `${Math.round(layout.width)}x${Math.round(layout.height)}`;
}

function formatLaneBadgeLayout(layout: LaneDebugLayout): string {
  if (!layout) {
    return "(no layout)";
  }
  return `(${Math.round(layout.width)}x${Math.round(layout.height)})`;
}

export const LaneDebugOverlay = React.memo(function LaneDebugOverlay({
  lane,
  entries,
  laneLayout,
  measuredHeights,
  targetOffsets,
  estimatedHeight,
}: {
  lane: LanePosition;
  entries: Array<{
    key: string;
    status: string;
  }>;
  laneLayout: LaneDebugLayout;
  measuredHeights: Record<string, number>;
  targetOffsets: Map<string, number>;
  estimatedHeight: number;
}) {
  const { enabled, comparison: debugComparison, publishSummary } =
    React.useContext(LaneDebugContext);

  const summary = React.useMemo(
    () =>
      createLaneDebugSummary({
        lane,
        entries,
        laneLayout,
        measuredHeights,
        targetOffsets,
        estimatedHeight,
      }),
    [entries, estimatedHeight, lane, laneLayout, measuredHeights, targetOffsets],
  );

  React.useEffect(() => {
    if (!enabled) {
      return;
    }

    publishSummary(summary);

    if (!__DEV__) {
      return;
    }

    // eslint-disable-next-line no-console
    console.log(`[toasts][${lane}] entries`, summary.rows);
  }, [enabled, lane, publishSummary, summary]);

  return (
    <>
      <View pointerEvents="none" style={[styles.laneDebugBadge, styles.laneBadgeTop]}>
        <Text style={styles.laneDebugBadgeText}>
          {lane.toUpperCase()} entries: {entries.length}{" "}
          {formatLaneBadgeLayout(laneLayout)}
        </Text>
      </View>
      {lane === "top" && debugComparison ? (
        <View pointerEvents="none" style={styles.debugPanel}>
          <Text style={styles.debugPanelTitle}>JS Lane Snapshot</Text>
          <Text style={styles.debugPanelLine}>
            TOP: {debugComparison.top?.count ?? 0}{" "}
            {debugComparison.top?.rows[0]
              ? `firstY=${debugComparison.top.rows[0].targetY ?? "na"}`
              : ""}
          </Text>
          <Text style={styles.debugPanelLine}>
            TOP layout: {formatLayout(debugComparison.top?.layout ?? null)}
          </Text>
          <Text style={styles.debugPanelLine}>
            BOTTOM: {debugComparison.bottom?.count ?? 0}{" "}
            {debugComparison.bottom?.rows[0]
              ? `firstY=${debugComparison.bottom.rows[0].targetY ?? "na"}`
              : ""}
          </Text>
          <Text style={styles.debugPanelLine}>
            BOTTOM layout: {formatLayout(debugComparison.bottom?.layout ?? null)}
          </Text>
          <Text style={styles.debugPanelLine}>
            Bottom keys:{" "}
            {debugComparison.bottom?.rows.map((row) => row.key).join(", ") ||
              "none"}
          </Text>
        </View>
      ) : null}
    </>
  );
});

const styles = StyleSheet.create({
  laneDebugBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    right: 8,
    zIndex: 1000,
  },
  laneBadgeTop: {
    top: 8,
  },
  laneDebugBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  debugPanel: {
    backgroundColor: "rgba(0, 0, 0, 0.72)",
    borderRadius: 8,
    left: 8,
    maxWidth: "92%",
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: "absolute",
    top: 36,
    zIndex: 1200,
  },
  debugPanelTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  debugPanelLine: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "500",
  },
});
