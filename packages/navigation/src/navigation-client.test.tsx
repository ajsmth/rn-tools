import * as React from "react";
import { Text } from "react-native";
import {
  createNavigation,
  createNavigationState,
  loadNavigationState,
} from "./navigation-client";

describe("createNavigationState", () => {
  it("returns empty maps by default", () => {
    const state = createNavigationState();
    expect(state.stacks).toBeInstanceOf(Map);
    expect(state.tabs).toBeInstanceOf(Map);
    expect(state.stacks.size).toBe(0);
    expect(state.tabs.size).toBe(0);
  });

  it("normalizes Record inputs into Maps", () => {
    const state = createNavigationState({
      stacks: {
        "stack-a": [{ element: <Text>a</Text> }],
      },
      tabs: {
        "my-tabs": { activeIndex: 2 },
      },
    });

    expect(state.stacks).toBeInstanceOf(Map);
    expect(state.stacks.get("stack-a")).toHaveLength(1);
    expect(state.tabs).toBeInstanceOf(Map);
    expect(state.tabs.get("my-tabs")).toEqual({ activeIndex: 2 });
  });

  it("accepts Map inputs directly", () => {
    const stacks = new Map([
      ["stack-a", [{ element: <Text>a</Text> }]],
    ]);
    const tabs = new Map([["my-tabs", { activeIndex: 1 }]]);
    const state = createNavigationState({ stacks, tabs });

    expect(state.stacks.get("stack-a")).toHaveLength(1);
    expect(state.tabs.get("my-tabs")).toEqual({ activeIndex: 1 });
  });
});

describe("createNavigation", () => {
  it("returns a client with the expected shape", () => {
    const nav = createNavigation();
    expect(nav.store).toBeDefined();
    expect(nav.renderTreeStore).toBeDefined();
    expect(nav.sheetsStore).toBeDefined();
    expect(typeof nav.push).toBe("function");
    expect(typeof nav.pop).toBe("function");
    expect(typeof nav.tab).toBe("function");
    expect(typeof nav.present).toBe("function");
    expect(typeof nav.dismiss).toBe("function");
    expect(typeof nav.dismissAll).toBe("function");
    expect(typeof nav.notify).toBe("function");
    expect(typeof nav.dismissNotification).toBe("function");
  });

  it("initializes with empty state by default", () => {
    const nav = createNavigation();
    const state = nav.store.getState();
    expect(state.stacks.size).toBe(0);
    expect(state.tabs.size).toBe(0);
  });

  it("initializes with the provided state", () => {
    const nav = createNavigation({
      stacks: { "stack-a": [{ element: <Text>a</Text> }] },
      tabs: { "my-tabs": { activeIndex: 1 } },
    });
    const state = nav.store.getState();
    expect(state.stacks.get("stack-a")).toHaveLength(1);
    expect(state.tabs.get("my-tabs")).toEqual({ activeIndex: 1 });
  });
});

describe("sheet methods", () => {
  it("present returns a key", () => {
    const nav = createNavigation();
    const key = nav.present(<Text>sheet</Text>);

    expect(typeof key).toBe("string");
  });

  it("present reuses key when id is reused", () => {
    const nav = createNavigation();
    const key1 = nav.present(<Text>sheet-a</Text>, { id: "edit" });
    const key2 = nav.present(<Text>sheet-b</Text>, { id: "edit" });

    expect(key2).toBe(key1);
  });

  it("dismiss and dismissAll are callable via public API", () => {
    const nav = createNavigation();
    nav.present(<Text>a</Text>);
    nav.present(<Text>b</Text>);

    expect(() => nav.dismiss()).not.toThrow();
    nav.dismissAll();
    expect(() => nav.dismissAll()).not.toThrow();
  });
});

describe("notification methods", () => {
  it("notify returns a key", () => {
    const nav = createNavigation();
    const key = nav.notify(<Text>notification</Text>);

    expect(typeof key).toBe("string");
  });

  it("notify reuses key when id is reused", () => {
    const nav = createNavigation();
    const key1 = nav.notify(<Text>notification-a</Text>, { id: "welcome" });
    const key2 = nav.notify(<Text>notification-b</Text>, { id: "welcome" });

    expect(key2).toBe(key1);
  });

  it("dismissNotification is callable via public API", () => {
    const nav = createNavigation();
    nav.notify(<Text>a</Text>);
    nav.notify(<Text>b</Text>, { position: "bottom" });

    expect(() => nav.dismissNotification()).not.toThrow();
    expect(() => nav.dismissNotification("bottom")).not.toThrow();
  });
});

describe("loadNavigationState", () => {
  it("replaces the store state with normalized input", () => {
    const nav = createNavigation({
      stacks: { "stack-a": [{ element: <Text>old</Text> }] },
    });

    loadNavigationState(nav.store, {
      stacks: { "stack-b": [{ element: <Text>new</Text> }] },
    });

    const state = nav.store.getState();
    expect(state.stacks.has("stack-a")).toBe(false);
    expect(state.stacks.get("stack-b")).toHaveLength(1);
  });
});

describe("push", () => {
  it("pushes a screen to the specified stack", () => {
    const nav = createNavigation({
      stacks: { "stack-a": [] },
    });

    nav.push(<Text>pushed</Text>, { stack: "stack-a" });

    const screens = nav.store.getState().stacks.get("stack-a");
    expect(screens).toHaveLength(1);
  });

  it("creates the stack entry if it did not exist", () => {
    const nav = createNavigation();

    nav.push(<Text>pushed</Text>, { stack: "stack-new" });

    const screens = nav.store.getState().stacks.get("stack-new");
    expect(screens).toHaveLength(1);
  });

  it("does not push a duplicate screen with the same id", () => {
    const nav = createNavigation({
      stacks: {
        "stack-a": [{ element: <Text>a</Text>, options: { id: "screen-1" } }],
      },
    });

    nav.push(<Text>dup</Text>, { id: "screen-1", stack: "stack-a" });

    expect(nav.store.getState().stacks.get("stack-a")).toHaveLength(1);
  });

  it("allows pushing after a screen with the same id was popped", () => {
    const nav = createNavigation({
      stacks: {
        "stack-a": [{ element: <Text>a</Text>, options: { id: "screen-1" } }],
      },
    });

    nav.pop({ stack: "stack-a" });
    expect(nav.store.getState().stacks.get("stack-a")).toHaveLength(0);

    nav.push(<Text>new</Text>, { id: "screen-1", stack: "stack-a" });
    expect(nav.store.getState().stacks.get("stack-a")).toHaveLength(1);
  });

  it("throws when no stack is provided and no stack is mounted", () => {
    const nav = createNavigation();
    expect(() => nav.push(<Text>x</Text>)).toThrow(
      "could not resolve stack",
    );
  });
});

describe("pop", () => {
  it("removes the top screen from the specified stack", () => {
    const nav = createNavigation({
      stacks: {
        "stack-a": [
          { element: <Text>a</Text> },
          { element: <Text>b</Text> },
        ],
      },
    });

    nav.pop({ stack: "stack-a" });

    expect(nav.store.getState().stacks.get("stack-a")).toHaveLength(1);
  });

  it("is a no-op when the stack is empty", () => {
    const nav = createNavigation({
      stacks: { "stack-a": [] },
    });

    const before = nav.store.getState();
    nav.pop({ stack: "stack-a" });
    const after = nav.store.getState();

    expect(before).toBe(after);
  });

  it("throws when no stack is provided and no stack is mounted", () => {
    const nav = createNavigation();
    expect(() => nav.pop()).toThrow("could not resolve stack");
  });
});

describe("tab", () => {
  it("sets the active index for the specified tabs", () => {
    const nav = createNavigation({
      tabs: { "my-tabs": { activeIndex: 0 } },
    });

    nav.tab(2, { tabs: "my-tabs" });

    expect(nav.store.getState().tabs.get("my-tabs")).toEqual({
      activeIndex: 2,
    });
  });

  it("creates the tabs entry if it did not exist", () => {
    const nav = createNavigation();

    nav.tab(1, { tabs: "new-tabs" });

    expect(nav.store.getState().tabs.get("new-tabs")).toEqual({
      activeIndex: 1,
    });
  });

  it("throws when no tabs is provided and no tabs are mounted", () => {
    const nav = createNavigation();
    expect(() => nav.tab(0)).toThrow("could not resolve tabs");
  });
});
