import * as React from "react";
import { describe, expect, it } from "vitest";
import { createSheets } from "./sheets-client";

describe("createSheets", () => {
  it("returns the expected client API", () => {
    const sheets = createSheets();

    expect(sheets.store).toBeDefined();
    expect(typeof sheets.present).toBe("function");
    expect(typeof sheets.dismiss).toBe("function");
    expect(typeof sheets.dismissAll).toBe("function");
    expect(typeof sheets.remove).toBe("function");
    expect(typeof sheets.markDidOpen).toBe("function");
    expect(typeof sheets.markDidDismiss).toBe("function");
  });

  it("starts with empty state", () => {
    const sheets = createSheets();
    expect(sheets.store.getState().sheets).toEqual([]);
  });
});

describe("present", () => {
  it("adds a new sheet in opening state", () => {
    const sheets = createSheets();
    const key = sheets.present(<span>hello</span>);

    const state = sheets.store.getState().sheets;
    expect(typeof key).toBe("string");
    expect(state).toHaveLength(1);
    expect(state[0].key).toBe(key);
    expect(state[0].status).toBe("opening");
  });

  it("stores element and options", () => {
    const sheets = createSheets();
    const element = <span>content</span>;
    const options = { id: "edit", snapPoints: [300, 500] };

    sheets.present(element, options);

    const entry = sheets.store.getState().sheets[0];
    expect(entry.element).toBe(element);
    expect(entry.options).toBe(options);
  });

  it("reuses key and replaces entry when id already exists", () => {
    const sheets = createSheets();

    const key1 = sheets.present(<span>a</span>, { id: "edit", snapPoints: [240] });
    sheets.markDidOpen(key1);

    const key2 = sheets.present(<span>b</span>, { id: "edit", snapPoints: [320] });

    const state = sheets.store.getState().sheets;
    expect(key2).toBe(key1);
    expect(state).toHaveLength(1);
    expect(state[0].key).toBe(key1);
    expect(state[0].status).toBe("opening");
    expect(state[0].options.snapPoints).toEqual([320]);
  });
});

describe("markDidOpen", () => {
  it("transitions opening to open", () => {
    const sheets = createSheets();
    const key = sheets.present(<span>a</span>);

    sheets.markDidOpen(key);

    expect(sheets.store.getState().sheets[0].status).toBe("open");
  });

  it("is a no-op for closing sheets", () => {
    const sheets = createSheets();
    const key = sheets.present(<span>a</span>);
    sheets.dismiss(key);

    const before = sheets.store.getState();
    sheets.markDidOpen(key);

    expect(sheets.store.getState()).toBe(before);
  });

  it("is a no-op for unknown key", () => {
    const sheets = createSheets();
    const before = sheets.store.getState();

    sheets.markDidOpen("missing");

    expect(sheets.store.getState()).toBe(before);
  });
});

describe("dismiss", () => {
  it("marks the top non-closing sheet as closing", () => {
    const sheets = createSheets();
    const keyA = sheets.present(<span>a</span>);
    const keyB = sheets.present(<span>b</span>);
    sheets.markDidOpen(keyA);
    sheets.markDidOpen(keyB);

    sheets.dismiss();

    const state = sheets.store.getState().sheets;
    expect(state[0].status).toBe("open");
    expect(state[1].status).toBe("closing");
  });

  it("can dismiss by id", () => {
    const sheets = createSheets();
    const key = sheets.present(<span>a</span>, { id: "edit" });
    sheets.markDidOpen(key);

    sheets.dismiss("edit");

    expect(sheets.store.getState().sheets[0].status).toBe("closing");
  });

  it("can dismiss by key", () => {
    const sheets = createSheets();
    const key = sheets.present(<span>a</span>);
    sheets.markDidOpen(key);

    sheets.dismiss(key);

    expect(sheets.store.getState().sheets[0].status).toBe("closing");
  });

  it("is a no-op when empty", () => {
    const sheets = createSheets();
    const before = sheets.store.getState();

    sheets.dismiss();

    expect(sheets.store.getState()).toBe(before);
  });

  it("is a no-op for unknown id", () => {
    const sheets = createSheets();
    sheets.present(<span>a</span>);
    const before = sheets.store.getState();

    sheets.dismiss("missing");

    expect(sheets.store.getState()).toBe(before);
  });
});

describe("markDidDismiss", () => {
  it("removes a closing sheet", () => {
    const sheets = createSheets();
    const key = sheets.present(<span>a</span>);
    sheets.markDidOpen(key);
    sheets.dismiss(key);

    sheets.markDidDismiss(key);

    expect(sheets.store.getState().sheets).toHaveLength(0);
  });

  it("does not remove opening sheet", () => {
    const sheets = createSheets();
    const key = sheets.present(<span>a</span>);
    const before = sheets.store.getState();

    sheets.markDidDismiss(key);

    expect(sheets.store.getState()).toBe(before);
  });

  it("is a no-op for unknown key", () => {
    const sheets = createSheets();
    const before = sheets.store.getState();

    sheets.markDidDismiss("missing");

    expect(sheets.store.getState()).toBe(before);
  });
});

describe("dismissAll", () => {
  it("marks every non-closing sheet as closing", () => {
    const sheets = createSheets();
    const keyA = sheets.present(<span>a</span>);
    const keyB = sheets.present(<span>b</span>);
    const keyC = sheets.present(<span>c</span>);
    sheets.markDidOpen(keyA);
    sheets.markDidOpen(keyB);
    sheets.markDidOpen(keyC);
    sheets.dismiss(keyB);

    sheets.dismissAll();

    const state = sheets.store.getState().sheets;
    expect(state).toHaveLength(3);
    expect(state.every((entry) => entry.status === "closing")).toBe(true);
  });

  it("is a no-op when empty", () => {
    const sheets = createSheets();
    const before = sheets.store.getState();

    sheets.dismissAll();

    expect(sheets.store.getState()).toBe(before);
  });
});

describe("remove", () => {
  it("removes by key", () => {
    const sheets = createSheets();
    const key = sheets.present(<span>a</span>);

    sheets.remove(key);

    expect(sheets.store.getState().sheets).toHaveLength(0);
  });

  it("removes by id", () => {
    const sheets = createSheets();
    sheets.present(<span>a</span>, { id: "edit" });

    sheets.remove("edit");

    expect(sheets.store.getState().sheets).toHaveLength(0);
  });

  it("is a no-op when no match", () => {
    const sheets = createSheets();
    sheets.present(<span>a</span>);
    const before = sheets.store.getState();

    sheets.remove("missing");

    expect(sheets.store.getState()).toBe(before);
  });
});
