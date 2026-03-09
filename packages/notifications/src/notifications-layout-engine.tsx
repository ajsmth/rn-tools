import { TransitionItemEntry, STATUSES } from "@rn-tools/core";

type LayoutNode = { toY: number; fromY?: number };

function normalizeZero(value: number) {
  return Object.is(value, -0) ? 0 : value;
}

export function createLayoutEngine(position: "top" | "bottom") {
  let prevLayout: Record<string, LayoutNode> = {};

  function computeLayouts({
    entries,
    heights,
  }: {
    entries: TransitionItemEntry[];
    heights: Record<string, number>;
  }): Record<string, LayoutNode> {
    const layout: Record<string, LayoutNode> = {};

    const flow = entries.filter(
      (entry) =>
        entry.status === STATUSES.OPEN || entry.status === STATUSES.OPENING,
    );

    const exiting = entries.filter(
      (entry) =>
        entry.status === STATUSES.CLOSING || entry.status === STATUSES.CLOSED,
    );

    const stack = [...flow].reverse();
    let cursor = 0;

    for (const entry of stack) {
      const measuredHeight = heights[entry.id];
      if (measuredHeight == null) {
        continue;
      }

      const y = normalizeZero(position === "bottom" ? -cursor : cursor);

      const previous = prevLayout[entry.id];
      const fromY =
        entry.status === STATUSES.OPENING && previous == null
          ? normalizeZero(
              y + (position === "bottom" ? measuredHeight : -measuredHeight),
            )
          : undefined;

      layout[entry.id] = {
        toY: y,
        ...(fromY == null ? {} : { fromY }),
      };
      cursor += measuredHeight;
    }

    for (const entry of exiting) {
      const previous = prevLayout[entry.id] ?? { toY: 0 };
      const measuredHeight = heights[entry.id];
      const exitDelta =
        measuredHeight == null
          ? 0
          : position === "bottom"
            ? measuredHeight
            : -measuredHeight;

      layout[entry.id] =
        entry.status === STATUSES.CLOSING
          ? { toY: normalizeZero(previous.toY + exitDelta) }
          : previous;
    }

    prevLayout = layout;
    return layout;
  }
  return {
    computeLayouts,
  };
}
