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
  enabled,
  lane,
  entriesCount,
  laneLayout,
  debugComparison,
}: {
  enabled: boolean;
  lane: LanePosition;
  entriesCount: number;
  laneLayout: LaneDebugLayout;
  debugComparison?: LaneDebugComparison;
}) {
  if (!enabled) {
    return null;
  }

  return (
    <>
      <View pointerEvents="none" style={[styles.laneDebugBadge, styles.laneBadgeTop]}>
        <Text style={styles.laneDebugBadgeText}>
          {lane.toUpperCase()} entries: {entriesCount}{" "}
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
