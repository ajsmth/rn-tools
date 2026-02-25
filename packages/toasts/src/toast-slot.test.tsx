import * as React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { RenderTree, createRenderTreeStore } from "@rn-tools/core";
import { TOAST_TYPE, createToasts, useToastEntry } from "./toasts-client";
import { ToastsProvider } from "./toasts-provider";

function DismissibleToast() {
  const toastEntry = useToastEntry();

  return (
    <Pressable testID="dismiss-toast-button" onPress={toastEntry.dismiss}>
      <Text>dismiss-me-toast</Text>
    </Pressable>
  );
}

function renderWithProviders() {
  const renderTreeStore = createRenderTreeStore();
  const toasts = createToasts(renderTreeStore);
  const result = render(
    <RenderTree store={renderTreeStore}>
      <ToastsProvider toasts={toasts}>
        <Text>app</Text>
      </ToastsProvider>
    </RenderTree>,
  );
  return { toasts, result };
}

describe("ToastSlot dismiss interaction", () => {
  it("removes toast from UI and store when dismiss button is pressed", async () => {
    const { toasts, result } = renderWithProviders();

    act(() => {
      toasts.show(<DismissibleToast />);
    });

    expect(result.getByText("dismiss-me-toast")).toBeTruthy();
    expect(toasts.store.getState().entries).toHaveLength(1);

    act(() => {
      fireEvent.press(result.getByTestId("dismiss-toast-button"));
    });

    await waitFor(() => {
      expect(result.queryByText("dismiss-me-toast")).toBeNull();
      expect(toasts.store.getState().entries).toHaveLength(0);
    });
  });
});

describe("ToastsProvider render-tree behavior", () => {
  it("works without an explicit RenderTree wrapper", () => {
    const toasts = createToasts();
    const result = render(
      <ToastsProvider toasts={toasts}>
        <Text>app</Text>
      </ToastsProvider>,
    );

    act(() => {
      toasts.show(<Text>auto-tree-toast</Text>);
    });

    expect(result.getByText("auto-tree-toast")).toBeTruthy();
  });

  it("uses parent RenderTree when stores differ", () => {
    const parentStore = createRenderTreeStore();
    const toasts = createToasts();

    const result = render(
      <RenderTree store={parentStore}>
        <ToastsProvider toasts={toasts}>
          <Text>app</Text>
        </ToastsProvider>
      </RenderTree>,
    );

    act(() => {
      toasts.show(<Text>parent-tree-toast</Text>);
    });

    expect(result.getByText("parent-tree-toast")).toBeTruthy();
  });

  it("dismiss() follows parent RenderTree active toast when stores differ", () => {
    const parentStore = createRenderTreeStore();
    const toasts = createToasts();

    render(
      <RenderTree store={parentStore}>
        <ToastsProvider toasts={toasts}>
          <Text>app</Text>
        </ToastsProvider>
      </RenderTree>,
    );

    let keyA = "";
    let keyB = "";

    act(() => {
      keyA = toasts.show(<Text>a</Text>);
      keyB = toasts.show(<Text>b</Text>);
      toasts.markDidShow(keyA);
      toasts.markDidShow(keyB);
    });

    act(() => {
      parentStore.setState({
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
              type: TOAST_TYPE,
              parentId: "render-tree-root",
              active: true,
              children: [],
            },
          ],
          [
            keyB,
            {
              id: keyB,
              type: TOAST_TYPE,
              parentId: "render-tree-root",
              active: false,
              children: [],
            },
          ],
        ]),
      });
    });

    act(() => {
      toasts.dismiss();
    });

    const entries = toasts.store.getState().entries;
    const entryA = entries.find((entry) => entry.key === keyA);
    expect(entryA?.status === "closing" || entryA == null).toBe(true);
    expect(entries.find((entry) => entry.key === keyB)?.status).toBe("open");
  });
});
