import * as React from "react";
import { describe, expect, it } from "vitest";
import { createOverlayStore } from "./overlay-store";
import { createRenderTreeStore } from "./render-tree";

type TestOptions = { id?: string; label?: string };

function makeOverlay(renderTreeStore = createRenderTreeStore()) {
  return createOverlayStore<TestOptions>({
    type: "test",
    renderTreeStore,
  });
}

function el(text: string) {
  return React.createElement("span", null, text);
}

describe("createOverlayStore", () => {
  it("returns the expected API", () => {
    const overlay = makeOverlay();

    expect(overlay.store).toBeDefined();
    expect(typeof overlay.add).toBe("function");
    expect(typeof overlay.remove).toBe("function");
    expect(typeof overlay.removeAll).toBe("function");
    expect(typeof overlay.destroy).toBe("function");
    expect(typeof overlay.markOpened).toBe("function");
    expect(typeof overlay.markClosed).toBe("function");
  });

  it("starts with empty entries", () => {
    const overlay = makeOverlay();
    expect(overlay.store.getState().entries).toEqual([]);
  });
});

describe("add", () => {
  it("adds a new entry in opening state", () => {
    const overlay = makeOverlay();
    const key = overlay.add(el("hello"));

    const entries = overlay.store.getState().entries;
    expect(typeof key).toBe("string");
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe(key);
    expect(entries[0].status).toBe("opening");
  });

  it("uses config type as key prefix", () => {
    const overlay = makeOverlay();
    const key = overlay.add(el("hello"));
    expect(key).toMatch(/^test-/);
  });

  it("stores element and options", () => {
    const overlay = makeOverlay();
    const element = el("content");
    const options = { id: "edit", label: "Edit" };

    overlay.add(element, options);

    const entry = overlay.store.getState().entries[0];
    expect(entry.element).toBe(element);
    expect(entry.options).toBe(options);
  });

  it("reuses key and replaces entry when id already exists", () => {
    const overlay = makeOverlay();

    const key1 = overlay.add(el("a"), { id: "edit", label: "v1" });
    overlay.markOpened(key1);

    const key2 = overlay.add(el("b"), { id: "edit", label: "v2" });

    const entries = overlay.store.getState().entries;
    expect(key2).toBe(key1);
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe(key1);
    expect(entries[0].status).toBe("opening");
    expect(entries[0].options.label).toBe("v2");
  });
});

describe("markOpened", () => {
  it("transitions opening to open", () => {
    const overlay = makeOverlay();
    const key = overlay.add(el("a"));

    overlay.markOpened(key);

    expect(overlay.store.getState().entries[0].status).toBe("open");
  });

  it("is a no-op for closing entries", () => {
    const overlay = makeOverlay();
    const key = overlay.add(el("a"));
    overlay.remove(key);

    const before = overlay.store.getState();
    overlay.markOpened(key);

    expect(overlay.store.getState()).toBe(before);
  });

  it("is a no-op for unknown key", () => {
    const overlay = makeOverlay();
    const before = overlay.store.getState();

    overlay.markOpened("missing");

    expect(overlay.store.getState()).toBe(before);
  });
});

describe("remove", () => {
  it("marks the top non-closing entry as closing", () => {
    const overlay = makeOverlay();
    const keyA = overlay.add(el("a"));
    const keyB = overlay.add(el("b"));
    overlay.markOpened(keyA);
    overlay.markOpened(keyB);

    overlay.remove();

    const entries = overlay.store.getState().entries;
    expect(entries[0].status).toBe("open");
    expect(entries[1].status).toBe("closing");
  });

  it("can remove by id", () => {
    const overlay = makeOverlay();
    const key = overlay.add(el("a"), { id: "edit" });
    overlay.markOpened(key);

    overlay.remove("edit");

    expect(overlay.store.getState().entries[0].status).toBe("closing");
  });

  it("can remove by key", () => {
    const overlay = makeOverlay();
    const key = overlay.add(el("a"));
    overlay.markOpened(key);

    overlay.remove(key);

    expect(overlay.store.getState().entries[0].status).toBe("closing");
  });

  it("is a no-op when empty", () => {
    const overlay = makeOverlay();
    const before = overlay.store.getState();

    overlay.remove();

    expect(overlay.store.getState()).toBe(before);
  });

  it("is a no-op for unknown id", () => {
    const overlay = makeOverlay();
    overlay.add(el("a"));
    const before = overlay.store.getState();

    overlay.remove("missing");

    expect(overlay.store.getState()).toBe(before);
  });

  it("uses render-tree active node for no-arg remove", () => {
    const renderTreeStore = createRenderTreeStore();
    const overlay = makeOverlay(renderTreeStore);
    const keyA = overlay.add(el("a"));
    const keyB = overlay.add(el("b"));
    overlay.markOpened(keyA);
    overlay.markOpened(keyB);

    renderTreeStore.setState({
      nodes: new Map([
        [
          "render-tree-root",
          {
            id: "render-tree-root",
            type: "root",
            parentId: null,
            active: true,
            children: [keyA, keyB],
          },
        ],
        [
          keyA,
          {
            id: keyA,
            type: "test",
            parentId: "render-tree-root",
            active: true,
            children: [],
          },
        ],
        [
          keyB,
          {
            id: keyB,
            type: "test",
            parentId: "render-tree-root",
            active: false,
            children: [],
          },
        ],
      ]),
    });

    overlay.remove();

    const entries = overlay.store.getState().entries;
    expect(entries.find((e) => e.key === keyA)?.status).toBe("closing");
    expect(entries.find((e) => e.key === keyB)?.status).toBe("open");
  });
});

describe("markClosed", () => {
  it("removes a closing entry", () => {
    const overlay = makeOverlay();
    const key = overlay.add(el("a"));
    overlay.markOpened(key);
    overlay.remove(key);

    overlay.markClosed(key);

    expect(overlay.store.getState().entries).toHaveLength(0);
  });

  it("does not remove opening entry", () => {
    const overlay = makeOverlay();
    const key = overlay.add(el("a"));
    const before = overlay.store.getState();

    overlay.markClosed(key);

    expect(overlay.store.getState()).toBe(before);
  });

  it("is a no-op for unknown key", () => {
    const overlay = makeOverlay();
    const before = overlay.store.getState();

    overlay.markClosed("missing");

    expect(overlay.store.getState()).toBe(before);
  });
});

describe("removeAll", () => {
  it("marks every non-closing entry as closing", () => {
    const overlay = makeOverlay();
    const keyA = overlay.add(el("a"));
    const keyB = overlay.add(el("b"));
    const keyC = overlay.add(el("c"));
    overlay.markOpened(keyA);
    overlay.markOpened(keyB);
    overlay.markOpened(keyC);
    overlay.remove(keyB);

    overlay.removeAll();

    const entries = overlay.store.getState().entries;
    expect(entries).toHaveLength(3);
    expect(entries.every((e) => e.status === "closing")).toBe(true);
  });

  it("is a no-op when empty", () => {
    const overlay = makeOverlay();
    const before = overlay.store.getState();

    overlay.removeAll();

    expect(overlay.store.getState()).toBe(before);
  });
});

describe("destroy", () => {
  it("destroys by key", () => {
    const overlay = makeOverlay();
    const key = overlay.add(el("a"));

    overlay.destroy(key);

    expect(overlay.store.getState().entries).toHaveLength(0);
  });

  it("destroys by id", () => {
    const overlay = makeOverlay();
    overlay.add(el("a"), { id: "edit" });

    overlay.destroy("edit");

    expect(overlay.store.getState().entries).toHaveLength(0);
  });

  it("is a no-op when no match", () => {
    const overlay = makeOverlay();
    overlay.add(el("a"));
    const before = overlay.store.getState();

    overlay.destroy("missing");

    expect(overlay.store.getState()).toBe(before);
  });
});
