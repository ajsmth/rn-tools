import * as React from "react";
import { Text } from "react-native";
import { createRenderTreeStore } from "@rn-tools/core";
import {
  createNotifications,
  DEFAULT_NOTIFICATION_DURATION_MS,
} from "./notifications-client";

beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

describe("createNotifications", () => {
  it("returns the expected client API", () => {
    const notifications = createNotifications(createRenderTreeStore());

    expect(notifications.store).toBeDefined();
    expect(typeof notifications.show).toBe("function");
    expect(typeof notifications.dismiss).toBe("function");
    expect(typeof notifications.dismissAll).toBe("function");
    expect(typeof notifications.remove).toBe("function");
    expect(typeof notifications.markDidShow).toBe("function");
    expect(typeof notifications.markDidDismiss).toBe("function");
  });

  it("starts with empty state", () => {
    const notifications = createNotifications(createRenderTreeStore());
    expect(notifications.store.getState().entries).toEqual([]);
  });
});

describe("show", () => {
  it("adds entries with lane options and defaults to top", () => {
    const notifications = createNotifications(createRenderTreeStore());
    const topDefaultKey = notifications.show(<Text>top-default</Text>);
    const bottomKey = notifications.show(<Text>bottom</Text>, { position: "bottom" });

    const entries = notifications.store.getState().entries;
    expect(entries).toHaveLength(2);
    expect(entries[0].key).toBe(topDefaultKey);
    expect(entries[0].options.position).toBeUndefined();
    expect(entries[1].key).toBe(bottomKey);
    expect(entries[1].options.position).toBe("bottom");
  });

  it("auto-dismisses after durationMs", () => {
    const notifications = createNotifications(createRenderTreeStore());
    const key = notifications.show(<Text>auto</Text>, { durationMs: 1000 });

    expect(notifications.store.getState().entries[0]?.status).toBe("opening");

    jest.advanceTimersByTime(999);
    expect(notifications.store.getState().entries[0]?.status).toBe("opening");

    jest.advanceTimersByTime(1);
    expect(
      notifications.store.getState().entries.find((entry) => entry.key === key)?.status,
    ).toBe("closing");
  });

  it("auto-dismisses at the default duration when durationMs is omitted", () => {
    const notifications = createNotifications(createRenderTreeStore());
    const key = notifications.show(<Text>auto</Text>);

    jest.advanceTimersByTime(DEFAULT_NOTIFICATION_DURATION_MS - 1);
    expect(
      notifications.store.getState().entries.find((entry) => entry.key === key)?.status,
    ).toBe("opening");

    jest.advanceTimersByTime(1);
    expect(
      notifications.store.getState().entries.find((entry) => entry.key === key)?.status,
    ).toBe("closing");
  });

  it("does not auto-dismiss when durationMs is null", () => {
    const notifications = createNotifications(createRenderTreeStore());
    const key = notifications.show(<Text>persistent</Text>, { durationMs: null });

    jest.advanceTimersByTime(10_000);
    expect(
      notifications.store.getState().entries.find((entry) => entry.key === key)?.status,
    ).toBe("opening");
  });

  it("replaces the auto-dismiss timer when a duplicate id is shown again", () => {
    const notifications = createNotifications(createRenderTreeStore());
    const keyA = notifications.show(<Text>a</Text>, { id: "welcome", durationMs: 1000 });
    const keyB = notifications.show(<Text>b</Text>, {
      id: "welcome",
      durationMs: DEFAULT_NOTIFICATION_DURATION_MS,
    });

    expect(keyB).toBe(keyA);

    jest.advanceTimersByTime(1000);
    expect(
      notifications.store.getState().entries.find((entry) => entry.key === keyB)?.status,
    ).toBe("opening");

    jest.advanceTimersByTime(DEFAULT_NOTIFICATION_DURATION_MS - 1000);
    expect(
      notifications.store.getState().entries.find((entry) => entry.key === keyB)?.status,
    ).toBe("closing");
  });
});

describe("dismiss", () => {
  it("dismisses the latest non-closing notification in the requested top lane", () => {
    const notifications = createNotifications(createRenderTreeStore());
    const topA = notifications.show(<Text>top-a</Text>);
    const bottomA = notifications.show(<Text>bottom-a</Text>, { position: "bottom" });
    const topB = notifications.show(<Text>top-b</Text>);

    notifications.markDidShow(topA);
    notifications.markDidShow(bottomA);
    notifications.markDidShow(topB);

    notifications.dismiss("top");

    const entries = notifications.store.getState().entries;
    expect(entries.find((entry) => entry.key === topA)?.status).toBe("open");
    expect(entries.find((entry) => entry.key === bottomA)?.status).toBe("open");
    expect(entries.find((entry) => entry.key === topB)?.status).toBe("closing");
  });

  it("dismisses the latest non-closing notification in the requested bottom lane", () => {
    const notifications = createNotifications(createRenderTreeStore());
    const topA = notifications.show(<Text>top-a</Text>);
    const bottomA = notifications.show(<Text>bottom-a</Text>, { position: "bottom" });
    const bottomB = notifications.show(<Text>bottom-b</Text>, { position: "bottom" });

    notifications.markDidShow(topA);
    notifications.markDidShow(bottomA);
    notifications.markDidShow(bottomB);

    notifications.dismiss("bottom");

    const entries = notifications.store.getState().entries;
    expect(entries.find((entry) => entry.key === topA)?.status).toBe("open");
    expect(entries.find((entry) => entry.key === bottomA)?.status).toBe("open");
    expect(entries.find((entry) => entry.key === bottomB)?.status).toBe(
      "closing",
    );
  });
});

describe("markDidDismiss", () => {
  it("removes a notification from the store after lane-targeted dismiss", () => {
    const notifications = createNotifications(createRenderTreeStore());
    const topKey = notifications.show(<Text>top</Text>);
    const bottomKey = notifications.show(<Text>bottom</Text>, { position: "bottom" });
    notifications.markDidShow(topKey);
    notifications.markDidShow(bottomKey);

    notifications.dismiss("bottom");
    notifications.markDidDismiss(bottomKey);

    const entries = notifications.store.getState().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe(topKey);
    expect(entries[0].status).toBe("open");
  });

  it("removes a notification when native dismissal callback fires directly", () => {
    const notifications = createNotifications(createRenderTreeStore());
    const key = notifications.show(<Text>notification</Text>);
    notifications.markDidShow(key);

    notifications.markDidDismiss(key);

    expect(notifications.store.getState().entries).toHaveLength(0);
  });

  it("clears auto-dismiss when dismissAll is called", () => {
    const notifications = createNotifications(createRenderTreeStore());
    const keyA = notifications.show(<Text>a</Text>, { durationMs: 1000 });
    const keyB = notifications.show(<Text>b</Text>, { durationMs: 2000 });

    notifications.dismissAll();
    notifications.markDidDismiss(keyA);
    notifications.markDidDismiss(keyB);

    jest.advanceTimersByTime(5000);
    expect(notifications.store.getState().entries).toHaveLength(0);
  });
});
