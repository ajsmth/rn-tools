import * as React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { RenderTree, createRenderTreeStore } from "@rn-tools/core";
import { createToasts, useToastEntry } from "./toasts-client";
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
