import * as React from "react";
import { describe, expect, it } from "vitest";
import { createSheets, SHEET_TYPE } from "./sheets-client";
import { createRenderTreeStore } from "@rn-tools/core";

describe("createSheets", () => {
  it("returns the expected client API", () => {
    const sheets = createSheets(createRenderTreeStore());

    expect(sheets.store).toBeDefined();
    expect(typeof sheets.present).toBe("function");
    expect(typeof sheets.dismiss).toBe("function");
    expect(typeof sheets.dismissAll).toBe("function");
    expect(typeof sheets.remove).toBe("function");
    expect(typeof sheets.markDidOpen).toBe("function");
    expect(typeof sheets.markDidDismiss).toBe("function");
  });

  it("starts with empty state", () => {
    const sheets = createSheets(createRenderTreeStore());
    expect(sheets.store.getState().entries).toEqual([]);
  });

  it("uses sheet- prefix for keys", () => {
    const sheets = createSheets(createRenderTreeStore());
    const key = sheets.present(<span>hello</span>);
    expect(key).toMatch(/^sheet-/);
  });
});

describe("present", () => {
  it("adds a new sheet in opening state", () => {
    const sheets = createSheets(createRenderTreeStore());
    const key = sheets.present(<span>hello</span>);

    const entries = sheets.store.getState().entries;
    expect(typeof key).toBe("string");
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe(key);
    expect(entries[0].status).toBe("opening");
  });

  it("stores element and options", () => {
    const sheets = createSheets(createRenderTreeStore());
    const element = <span>content</span>;
    const options = { id: "edit", snapPoints: [300, 500] };

    sheets.present(element, options);

    const entry = sheets.store.getState().entries[0];
    expect(entry.element).toBe(element);
    expect(entry.options).toBe(options);
  });

  it("reuses key and replaces entry when id already exists", () => {
    const sheets = createSheets(createRenderTreeStore());

    const key1 = sheets.present(<span>a</span>, { id: "edit", snapPoints: [240] });
    sheets.markDidOpen(key1);

    const key2 = sheets.present(<span>b</span>, { id: "edit", snapPoints: [320] });

    const entries = sheets.store.getState().entries;
    expect(key2).toBe(key1);
    expect(entries).toHaveLength(1);
    expect(entries[0].key).toBe(key1);
    expect(entries[0].status).toBe("opening");
    expect(entries[0].options.snapPoints).toEqual([320]);
  });
});

describe("dismiss", () => {
  it("marks the top non-closing sheet as closing", () => {
    const sheets = createSheets(createRenderTreeStore());
    const keyA = sheets.present(<span>a</span>);
    const keyB = sheets.present(<span>b</span>);
    sheets.markDidOpen(keyA);
    sheets.markDidOpen(keyB);

    sheets.dismiss();

    const entries = sheets.store.getState().entries;
    expect(entries[0].status).toBe("open");
    expect(entries[1].status).toBe("closing");
  });

  it("uses render-tree active sheet for no-arg dismiss", () => {
    const renderTreeStore = createRenderTreeStore();
    const sheets = createSheets(renderTreeStore);
    const keyA = sheets.present(<span>a</span>);
    const keyB = sheets.present(<span>b</span>);
    sheets.markDidOpen(keyA);
    sheets.markDidOpen(keyB);

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
            type: SHEET_TYPE,
            parentId: "render-tree-root",
            active: true,
            children: [],
          },
        ],
        [
          keyB,
          {
            id: keyB,
            type: SHEET_TYPE,
            parentId: "render-tree-root",
            active: false,
            children: [],
          },
        ],
      ]),
    });

    sheets.dismiss();

    const entries = sheets.store.getState().entries;
    expect(entries.find((entry) => entry.key === keyA)?.status).toBe("closing");
    expect(entries.find((entry) => entry.key === keyB)?.status).toBe("open");
  });
});

describe("markDidDismiss", () => {
  it("removes a closing sheet", () => {
    const sheets = createSheets(createRenderTreeStore());
    const key = sheets.present(<span>a</span>);
    sheets.markDidOpen(key);
    sheets.dismiss(key);

    sheets.markDidDismiss(key);

    expect(sheets.store.getState().entries).toHaveLength(0);
  });
});

describe("dismissAll", () => {
  it("marks every non-closing sheet as closing", () => {
    const sheets = createSheets(createRenderTreeStore());
    const keyA = sheets.present(<span>a</span>);
    const keyB = sheets.present(<span>b</span>);
    const keyC = sheets.present(<span>c</span>);
    sheets.markDidOpen(keyA);
    sheets.markDidOpen(keyB);
    sheets.markDidOpen(keyC);
    sheets.dismiss(keyB);

    sheets.dismissAll();

    const entries = sheets.store.getState().entries;
    expect(entries).toHaveLength(3);
    expect(entries.every((entry) => entry.status === "closing")).toBe(true);
  });
});

describe("remove", () => {
  it("removes by key", () => {
    const sheets = createSheets(createRenderTreeStore());
    const key = sheets.present(<span>a</span>);

    sheets.remove(key);

    expect(sheets.store.getState().entries).toHaveLength(0);
  });
});
