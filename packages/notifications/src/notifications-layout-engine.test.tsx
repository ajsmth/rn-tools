import { STATUSES, TransitionItemEntry } from "@rn-tools/core";
import { createLayoutEngine } from "./notifications-layout-engine";

function entry(
  id: string,
  status: TransitionItemEntry["status"],
): TransitionItemEntry {
  return { id, status };
}

describe("createLayoutEngine()", () => {
  test("top lane stacks items downward and seeds opening items from above", () => {
    const engine = createLayoutEngine("top");

    const layout = engine.computeLayouts({
      heights: {
        first: 40,
        second: 20,
      },
      entries: [
        entry("first", STATUSES.OPEN),
        entry("second", STATUSES.OPENING),
      ],
    });

    expect(layout).toEqual({
      first: { toY: 20 },
      second: { toY: 0, fromY: -20 },
    });
  });

  test("bottom lane stacks items upward and seeds opening items from below", () => {
    const engine = createLayoutEngine("bottom");

    const layout = engine.computeLayouts({
      heights: {
        first: 40,
        second: 20,
      },
      entries: [
        entry("first", STATUSES.OPEN),
        entry("second", STATUSES.OPENING),
      ],
    });

    expect(layout).toEqual({
      first: { toY: -20 },
      second: { toY: 0, fromY: 20 },
    });
  });

  test("opening items only get fromY on first appearance", () => {
    const engine = createLayoutEngine("top");

    engine.computeLayouts({
      heights: {
        notice: 30,
      },
      entries: [entry("notice", STATUSES.OPENING)],
    });

    const layout = engine.computeLayouts({
      heights: {
        notice: 30,
      },
      entries: [entry("notice", STATUSES.OPENING)],
    });

    expect(layout).toEqual({
      notice: { toY: 0 },
    });
  });

  test("closing items keep moving out while siblings reflow immediately", () => {
    const engine = createLayoutEngine("top");

    engine.computeLayouts({
      heights: {
        first: 40,
        second: 20,
      },
      entries: [
        entry("first", STATUSES.OPEN),
        entry("second", STATUSES.OPEN),
      ],
    });

    const layout = engine.computeLayouts({
      heights: {
        first: 40,
        second: 20,
      },
      entries: [
        entry("first", STATUSES.CLOSING),
        entry("second", STATUSES.OPEN),
      ],
    });

    expect(layout).toEqual({
      first: { toY: -20 },
      second: { toY: 0 },
    });
  });

  test("unmeasured flow items are omitted until they have a height", () => {
    const engine = createLayoutEngine("top");

    const layout = engine.computeLayouts({
      heights: {
        first: 40,
      },
      entries: [
        entry("first", STATUSES.OPEN),
        entry("second", STATUSES.OPENING),
      ],
    });

    expect(layout).toEqual({
      first: { toY: 0 },
    });
  });

  test("measuring a previously unmeasured opening item adds its entry layout", () => {
    const engine = createLayoutEngine("top");

    engine.computeLayouts({
      heights: {
        first: 40,
      },
      entries: [
        entry("first", STATUSES.OPEN),
        entry("second", STATUSES.OPENING),
      ],
    });

    const layout = engine.computeLayouts({
      heights: {
        first: 40,
        second: 20,
      },
      entries: [
        entry("first", STATUSES.OPEN),
        entry("second", STATUSES.OPENING),
      ],
    });

    expect(layout).toEqual({
      first: { toY: 20 },
      second: { toY: 0, fromY: -20 },
    });
  });

  test("unmeasured closing items keep their previous layout position", () => {
    const engine = createLayoutEngine("bottom");

    engine.computeLayouts({
      heights: {
        first: 40,
        second: 20,
      },
      entries: [
        entry("first", STATUSES.OPEN),
        entry("second", STATUSES.OPEN),
      ],
    });

    const layout = engine.computeLayouts({
      heights: {
        first: 40,
      },
      entries: [
        entry("first", STATUSES.OPEN),
        entry("second", STATUSES.CLOSING),
      ],
    });

    expect(layout).toEqual({
      first: { toY: 0 },
      second: { toY: 0 },
    });
  });

  test("closed items keep their previous exit position until unmounted", () => {
    const engine = createLayoutEngine("bottom");

    engine.computeLayouts({
      heights: {
        notice: 30,
      },
      entries: [entry("notice", STATUSES.OPEN)],
    });

    engine.computeLayouts({
      heights: {
        notice: 30,
      },
      entries: [entry("notice", STATUSES.CLOSING)],
    });

    const layout = engine.computeLayouts({
      heights: {
        notice: 30,
      },
      entries: [entry("notice", STATUSES.CLOSED)],
    });

    expect(layout).toEqual({
      notice: { toY: 30 },
    });
  });
});
