import * as React from "react";
import { describe, expect, it } from "vitest";
import { createSheets } from "./sheets-client";

describe("createSheets", () => {
  it("returns the correct shape", () => {
    const sheets = createSheets();
    expect(sheets.store).toBeDefined();
    expect(typeof sheets.present).toBe("function");
    expect(typeof sheets.dismiss).toBe("function");
    expect(typeof sheets.dismissAll).toBe("function");
  });

  it("initializes with an empty sheets array", () => {
    const sheets = createSheets();
    expect(sheets.store.getState().sheets).toEqual([]);
  });
});

describe("present", () => {
  it("adds an entry with open=true and returns a unique key", () => {
    const sheets = createSheets();
    const key = sheets.present(<span>hello</span>);

    expect(typeof key).toBe("string");
    const state = sheets.store.getState();
    expect(state.sheets).toHaveLength(1);
    expect(state.sheets[0].key).toBe(key);
    expect(state.sheets[0].open).toBe(true);
  });

  it("stores the element and options", () => {
    const sheets = createSheets();
    const element = <span>content</span>;
    const options = { id: "my-sheet", snapPoints: [400, 600] };

    sheets.present(element, options);

    const entry = sheets.store.getState().sheets[0];
    expect(entry.element).toBe(element);
    expect(entry.options).toBe(options);
  });

  it("returns unique keys for each call", () => {
    const sheets = createSheets();
    const key1 = sheets.present(<span>a</span>);
    const key2 = sheets.present(<span>b</span>);

    expect(key1).not.toBe(key2);
    expect(sheets.store.getState().sheets).toHaveLength(2);
  });

  it("prevents duplicate by id", () => {
    const sheets = createSheets();
    sheets.present(<span>a</span>, { id: "edit" });
    sheets.present(<span>b</span>, { id: "edit" });

    expect(sheets.store.getState().sheets).toHaveLength(1);
  });

  it("allows re-present after full dismiss cycle", () => {
    const sheets = createSheets();
    sheets.present(<span>a</span>, { id: "edit" });

    // Phase 1: close
    sheets.dismiss("edit");
    expect(sheets.store.getState().sheets[0].open).toBe(false);

    // Phase 2: remove (simulates HIDDEN callback)
    sheets.dismiss("edit");
    expect(sheets.store.getState().sheets).toHaveLength(0);

    // Re-present works
    sheets.present(<span>b</span>, { id: "edit" });
    expect(sheets.store.getState().sheets).toHaveLength(1);
    expect(sheets.store.getState().sheets[0].open).toBe(true);
  });
});

describe("dismiss", () => {
  it("marks the top open sheet as closed (phase 1)", () => {
    const sheets = createSheets();
    sheets.present(<span>a</span>);
    sheets.present(<span>b</span>);

    sheets.dismiss();

    const state = sheets.store.getState();
    expect(state.sheets).toHaveLength(2);
    expect(state.sheets[0].open).toBe(true);
    expect(state.sheets[1].open).toBe(false);
  });

  it("removes a closed entry (phase 2)", () => {
    const sheets = createSheets();
    sheets.present(<span>a</span>);
    sheets.present(<span>b</span>);

    // Phase 1: close
    sheets.dismiss();
    // Phase 2: remove
    sheets.dismiss(sheets.store.getState().sheets[1].key);

    expect(sheets.store.getState().sheets).toHaveLength(1);
    expect(sheets.store.getState().sheets[0].element).toEqual(<span>a</span>);
  });

  it("closes a sheet by options.id", () => {
    const sheets = createSheets();
    sheets.present(<span>a</span>, { id: "first" });
    sheets.present(<span>b</span>, { id: "second" });

    sheets.dismiss("first");

    const state = sheets.store.getState();
    expect(state.sheets).toHaveLength(2);
    expect(state.sheets[0].open).toBe(false);
    expect(state.sheets[1].open).toBe(true);
  });

  it("closes a sheet by key", () => {
    const sheets = createSheets();
    const key = sheets.present(<span>a</span>);
    sheets.present(<span>b</span>);

    sheets.dismiss(key);

    expect(sheets.store.getState().sheets[0].open).toBe(false);
    expect(sheets.store.getState().sheets[1].open).toBe(true);
  });

  it("skips already-closing sheets for no-arg dismiss", () => {
    const sheets = createSheets();
    sheets.present(<span>a</span>);
    sheets.present(<span>b</span>);

    sheets.dismiss(); // closes b
    sheets.dismiss(); // closes a (skips b since already closing)

    expect(sheets.store.getState().sheets[0].open).toBe(false);
    expect(sheets.store.getState().sheets[1].open).toBe(false);
  });

  it("is a no-op when empty", () => {
    const sheets = createSheets();
    const before = sheets.store.getState();

    sheets.dismiss();

    expect(sheets.store.getState()).toBe(before);
  });

  it("is a no-op when no match", () => {
    const sheets = createSheets();
    sheets.present(<span>a</span>);
    const before = sheets.store.getState();

    sheets.dismiss("nonexistent");

    expect(sheets.store.getState()).toBe(before);
  });
});

describe("dismissAll", () => {
  it("marks all sheets as closed", () => {
    const sheets = createSheets();
    sheets.present(<span>a</span>);
    sheets.present(<span>b</span>);
    sheets.present(<span>c</span>);

    sheets.dismissAll();

    const state = sheets.store.getState();
    expect(state.sheets).toHaveLength(3);
    expect(state.sheets.every((e) => !e.open)).toBe(true);
  });

  it("is a no-op when empty", () => {
    const sheets = createSheets();
    const before = sheets.store.getState();

    sheets.dismissAll();

    expect(sheets.store.getState()).toBe(before);
  });
});
