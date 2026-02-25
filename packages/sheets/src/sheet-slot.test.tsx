import * as React from "react";
import { act, render } from "@testing-library/react-native";
import { Text, View } from "react-native";
import { RenderTree, createRenderTreeStore } from "@rn-tools/core";
import { createSheets } from "./sheets-client";
import { SheetsProvider } from "./sheets-provider";

jest.mock("./native-sheets-view", () => {
  const React = require("react");
  const { View } = require("react-native");
  const actual = jest.requireActual<typeof import("./native-sheets-view")>(
    "./native-sheets-view",
  );

  return {
    ...actual,
    BottomSheet: jest.fn((props: { children?: React.ReactNode }) => (
      React.createElement(View, { testID: "bottom-sheet" }, props.children)
    )),
  };
});

function renderWithProviders() {
  const renderTreeStore = createRenderTreeStore();
  const sheets = createSheets(renderTreeStore);
  const result = render(
    <RenderTree store={renderTreeStore}>
      <SheetsProvider sheets={sheets}>
        <Text>app</Text>
      </SheetsProvider>
    </RenderTree>,
  );
  return { sheets, result };
}

describe("SheetSlot wrapped option", () => {
  it("renders content inside BottomSheet wrapper by default", () => {
    const { sheets, result } = renderWithProviders();

    act(() => {
      sheets.present(<Text>wrapped-content</Text>);
    });

    expect(result.getByText("wrapped-content")).toBeTruthy();
    expect(result.queryByTestId("bottom-sheet")).not.toBeNull();
  });

  it("renders content without BottomSheet wrapper when wrapped is false", () => {
    const { sheets, result } = renderWithProviders();

    act(() => {
      sheets.present(<Text>unwrapped-content</Text>, { wrapped: false });
    });

    expect(result.getByText("unwrapped-content")).toBeTruthy();
    expect(result.queryByTestId("bottom-sheet")).toBeNull();
  });

  it("renders both wrapped and unwrapped entries simultaneously", () => {
    const { sheets, result } = renderWithProviders();

    act(() => {
      sheets.present(<Text>default-sheet</Text>);
      sheets.present(<Text>bare-sheet</Text>, { wrapped: false });
    });

    expect(result.getByText("default-sheet")).toBeTruthy();
    expect(result.getByText("bare-sheet")).toBeTruthy();
    expect(result.queryAllByTestId("bottom-sheet")).toHaveLength(1);
  });
});
