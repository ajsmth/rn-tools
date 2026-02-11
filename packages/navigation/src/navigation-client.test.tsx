import * as React from "react";
import { describe, expect, it } from "vitest";
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
        "stack-a": [{ element: <span>a</span> }],
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
      ["stack-a", [{ element: <span>a</span> }]],
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
    expect(typeof nav.pushScreen).toBe("function");
    expect(typeof nav.popScreen).toBe("function");
    expect(typeof nav.setActiveTab).toBe("function");
  });

  it("initializes with empty state by default", () => {
    const nav = createNavigation();
    const state = nav.store.getState();
    expect(state.stacks.size).toBe(0);
    expect(state.tabs.size).toBe(0);
  });

  it("initializes with the provided state", () => {
    const nav = createNavigation({
      stacks: { "stack-a": [{ element: <span>a</span> }] },
      tabs: { "my-tabs": { activeIndex: 1 } },
    });
    const state = nav.store.getState();
    expect(state.stacks.get("stack-a")).toHaveLength(1);
    expect(state.tabs.get("my-tabs")).toEqual({ activeIndex: 1 });
  });
});

describe("loadNavigationState", () => {
  it("replaces the store state with normalized input", () => {
    const nav = createNavigation({
      stacks: { "stack-a": [{ element: <span>old</span> }] },
    });

    loadNavigationState(nav.store, {
      stacks: { "stack-b": [{ element: <span>new</span> }] },
    });

    const state = nav.store.getState();
    expect(state.stacks.has("stack-a")).toBe(false);
    expect(state.stacks.get("stack-b")).toHaveLength(1);
  });
});

describe("pushScreen", () => {
  it("pushes a screen to the specified stack", () => {
    const nav = createNavigation({
      stacks: { "stack-a": [] },
    });

    nav.pushScreen(<span>pushed</span>, { stackId: "stack-a" });

    const screens = nav.store.getState().stacks.get("stack-a");
    expect(screens).toHaveLength(1);
  });

  it("creates the stack entry if it did not exist", () => {
    const nav = createNavigation();

    nav.pushScreen(<span>pushed</span>, { stackId: "stack-new" });

    const screens = nav.store.getState().stacks.get("stack-new");
    expect(screens).toHaveLength(1);
  });

  it("does not push a duplicate screen with the same id", () => {
    const nav = createNavigation({
      stacks: {
        "stack-a": [{ element: <span>a</span>, options: { id: "screen-1" } }],
      },
    });

    nav.pushScreen(<span>dup</span>, { id: "screen-1", stackId: "stack-a" });

    expect(nav.store.getState().stacks.get("stack-a")).toHaveLength(1);
  });

  it("allows pushing after a screen with the same id was popped", () => {
    const nav = createNavigation({
      stacks: {
        "stack-a": [{ element: <span>a</span>, options: { id: "screen-1" } }],
      },
    });

    nav.popScreen({ stackId: "stack-a" });
    expect(nav.store.getState().stacks.get("stack-a")).toHaveLength(0);

    nav.pushScreen(<span>new</span>, { id: "screen-1", stackId: "stack-a" });
    expect(nav.store.getState().stacks.get("stack-a")).toHaveLength(1);
  });

  it("throws when no stackId is provided and no stack is mounted", () => {
    const nav = createNavigation();
    expect(() => nav.pushScreen(<span>x</span>)).toThrow(
      "could not resolve stackId",
    );
  });
});

describe("popScreen", () => {
  it("removes the top screen from the specified stack", () => {
    const nav = createNavigation({
      stacks: {
        "stack-a": [
          { element: <span>a</span> },
          { element: <span>b</span> },
        ],
      },
    });

    nav.popScreen({ stackId: "stack-a" });

    expect(nav.store.getState().stacks.get("stack-a")).toHaveLength(1);
  });

  it("is a no-op when the stack is empty", () => {
    const nav = createNavigation({
      stacks: { "stack-a": [] },
    });

    const before = nav.store.getState();
    nav.popScreen({ stackId: "stack-a" });
    const after = nav.store.getState();

    expect(before).toBe(after);
  });

  it("throws when no stackId is provided and no stack is mounted", () => {
    const nav = createNavigation();
    expect(() => nav.popScreen()).toThrow("could not resolve stackId");
  });
});

describe("setActiveTab", () => {
  it("sets the active index for the specified tabs", () => {
    const nav = createNavigation({
      tabs: { "my-tabs": { activeIndex: 0 } },
    });

    nav.setActiveTab(2, { tabsId: "my-tabs" });

    expect(nav.store.getState().tabs.get("my-tabs")).toEqual({
      activeIndex: 2,
    });
  });

  it("creates the tabs entry if it did not exist", () => {
    const nav = createNavigation();

    nav.setActiveTab(1, { tabsId: "new-tabs" });

    expect(nav.store.getState().tabs.get("new-tabs")).toEqual({
      activeIndex: 1,
    });
  });

  it("throws when no tabsId is provided and no tabs are mounted", () => {
    const nav = createNavigation();
    expect(() => nav.setActiveTab(0)).toThrow("could not resolve tabsId");
  });
});
