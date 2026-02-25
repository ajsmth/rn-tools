import * as React from "react";
import { Text } from "react-native";
import { createRenderTreeStore } from "@rn-tools/core";
import { createToasts } from "./toasts-client";

describe("createToasts", () => {
  it("returns the expected client API", () => {
    const toasts = createToasts(createRenderTreeStore());

    expect(toasts.store).toBeDefined();
    expect(typeof toasts.show).toBe("function");
    expect(typeof toasts.dismiss).toBe("function");
    expect(typeof toasts.dismissAll).toBe("function");
    expect(typeof toasts.remove).toBe("function");
    expect(typeof toasts.markDidShow).toBe("function");
    expect(typeof toasts.markDidDismiss).toBe("function");
  });

  it("starts with empty state", () => {
    const toasts = createToasts(createRenderTreeStore());
    expect(toasts.store.getState().entries).toEqual([]);
  });
});

describe("show", () => {
  it("adds entries with lane options and defaults to top", () => {
    const toasts = createToasts(createRenderTreeStore());
    const topDefaultKey = toasts.show(<Text>top-default</Text>);
    const bottomKey = toasts.show(<Text>bottom</Text>, { position: "bottom" });

    const entries = toasts.store.getState().entries;
    expect(entries).toHaveLength(2);
    expect(entries[0].key).toBe(topDefaultKey);
    expect(entries[0].options.position).toBeUndefined();
    expect(entries[1].key).toBe(bottomKey);
    expect(entries[1].options.position).toBe("bottom");
  });
});

describe("dismiss", () => {
  it("dismisses the latest non-closing toast in the requested top lane", () => {
    const toasts = createToasts(createRenderTreeStore());
    const topA = toasts.show(<Text>top-a</Text>);
    const bottomA = toasts.show(<Text>bottom-a</Text>, { position: "bottom" });
    const topB = toasts.show(<Text>top-b</Text>);

    toasts.markDidShow(topA);
    toasts.markDidShow(bottomA);
    toasts.markDidShow(topB);

    toasts.dismiss("top");

    const entries = toasts.store.getState().entries;
    expect(entries.find((entry) => entry.key === topA)?.status).toBe("open");
    expect(entries.find((entry) => entry.key === bottomA)?.status).toBe("open");
    expect(entries.find((entry) => entry.key === topB)?.status).toBe("closing");
  });

  it("dismisses the latest non-closing toast in the requested bottom lane", () => {
    const toasts = createToasts(createRenderTreeStore());
    const topA = toasts.show(<Text>top-a</Text>);
    const bottomA = toasts.show(<Text>bottom-a</Text>, { position: "bottom" });
    const bottomB = toasts.show(<Text>bottom-b</Text>, { position: "bottom" });

    toasts.markDidShow(topA);
    toasts.markDidShow(bottomA);
    toasts.markDidShow(bottomB);

    toasts.dismiss("bottom");

    const entries = toasts.store.getState().entries;
    expect(entries.find((entry) => entry.key === topA)?.status).toBe("open");
    expect(entries.find((entry) => entry.key === bottomA)?.status).toBe("open");
    expect(entries.find((entry) => entry.key === bottomB)?.status).toBe(
      "closing",
    );
  });
});

describe("markDidDismiss", () => {
  it("removes a toast from the store after lane-targeted dismiss", () => {
    const toasts = createToasts(createRenderTreeStore());
    const topKey = toasts.show(<Text>top</Text>);
    const bottomKey = toasts.show(<Text>bottom</Text>, { position: "bottom" });
    toasts.markDidShow(topKey);
    toasts.markDidShow(bottomKey);

    toasts.dismiss("bottom");
    toasts.markDidDismiss(bottomKey);

    const entries = toasts.store.getState().entries;
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe(topKey);
    expect(entries[0].status).toBe("open");
  });

  it("removes a toast when native dismissal callback fires directly", () => {
    const toasts = createToasts(createRenderTreeStore());
    const key = toasts.show(<Text>toast</Text>);
    toasts.markDidShow(key);

    toasts.markDidDismiss(key);

    expect(toasts.store.getState().entries).toHaveLength(0);
  });
});
