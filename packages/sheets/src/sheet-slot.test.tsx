import * as React from "react";
import { describe, expect, it, vi } from "vitest";
import { act, render } from "@testing-library/react";
import { RenderTree, createRenderTreeStore } from "@rn-tools/core";
import { createSheets } from "./sheets-client";
import { SheetsProvider } from "./sheets-provider";

vi.mock("./native-sheets-view", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./native-sheets-view")>();
  return {
    ...actual,
    BottomSheet: vi.fn((props: { children?: React.ReactNode }) => (
      <div data-testid="bottom-sheet">{props.children}</div>
    )),
  };
});

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
    expect(result.queryByTestId("bottom-sheet")).not.toBeNull();
  });

  it("renders content without BottomSheet wrapper when wrapped is false", () => {
    const { sheets, result } = renderWithProviders();

    act(() => {
      sheets.present(<span>unwrapped-content</span>, { wrapped: false });
    });

    expect(result.getByText("unwrapped-content")).toBeTruthy();
    expect(result.queryByTestId("bottom-sheet")).toBeNull();
  });

  it("renders both wrapped and unwrapped entries simultaneously", () => {
    const { sheets, result } = renderWithProviders();

    act(() => {
      sheets.present(<span>default-sheet</span>);
      sheets.present(<span>bare-sheet</span>, { wrapped: false });
    });

    expect(result.getByText("default-sheet")).toBeTruthy();
    expect(result.getByText("bare-sheet")).toBeTruthy();
    expect(result.queryAllByTestId("bottom-sheet")).toHaveLength(1);
  });
});
