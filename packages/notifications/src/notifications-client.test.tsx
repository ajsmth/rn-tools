import * as React from "react";
import { Text } from "react-native";
import { createRenderTreeStore } from "@rn-tools/core";
import { createNotifications } from "./notifications-client";

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
});
