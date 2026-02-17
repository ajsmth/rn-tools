import * as React from "react";
import { describe, expect, it } from "vitest";
import { act, render } from "@testing-library/react";
import { RenderTree, createRenderTreeStore } from "@rn-tools/core";
import { createSheets } from "./sheets-client";
import { SheetsProvider } from "./sheets-provider";

function renderWithProviders() {
  const renderTreeStore = createRenderTreeStore();
  const sheets = createSheets(renderTreeStore);
  const result = render(
    <RenderTree store={renderTreeStore}>
      <SheetsProvider sheets={sheets}>
        <span>app</span>
      </SheetsProvider>
    </RenderTree>,
  );
  return { sheets, result };
}

describe("SheetSlot wrapped option", () => {
  it("renders content inside BottomSheet wrapper by default", () => {
    const { sheets, result } = renderWithProviders();

    act(() => {
      sheets.present(<span>wrapped-content</span>);
    });

    expect(result.getByText("wrapped-content")).toBeTruthy();
    // NativeSheetsView mocks as <div>, so a wrapped entry has a <div> ancestor
    const el = result.getByText("wrapped-content");
    expect(el.closest("div")).not.toBeNull();
  });

  it("renders content without BottomSheet wrapper when wrapped is false", () => {
    const { sheets, result } = renderWithProviders();

    act(() => {
      sheets.present(<span data-testid="unwrapped">unwrapped-content</span>, {
        wrapped: false,
      });
    });

    const el = result.getByText("unwrapped-content");
    expect(el).toBeTruthy();
    // The only <div> should be the testing-library container, not a NativeSheetsView wrapper.
    // The element's parentElement chain should not include a <div> between it and the container root.
    const parentDiv = el.parentElement?.closest("div");
    expect(parentDiv).toBe(result.container);
  });

  it("renders both wrapped and unwrapped entries simultaneously", () => {
    const { sheets, result } = renderWithProviders();

    act(() => {
      sheets.present(<span>default-sheet</span>);
      sheets.present(<span>bare-sheet</span>, { wrapped: false });
    });

    expect(result.getByText("default-sheet")).toBeTruthy();
    expect(result.getByText("bare-sheet")).toBeTruthy();
  });
});
