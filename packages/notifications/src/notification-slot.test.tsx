import * as React from "react";
import { act, fireEvent, render, waitFor } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { RenderTree, createRenderTreeStore } from "@rn-tools/core";
import { NOTIFICATION_TYPE, createNotifications, useNotificationEntry } from "./notifications-client";
import { NotificationsProvider } from "./notifications-provider";

function DismissibleNotification() {
  const notificationEntry = useNotificationEntry();

  return (
    <Pressable testID="dismiss-notification-button" onPress={notificationEntry.dismiss}>
      <Text>dismiss-me-notification</Text>
    </Pressable>
  );
}

function DismissibleViaInjectedProp({
  dismiss,
}: {
  dismiss?: () => void;
}) {
  return (
    <Pressable testID="dismiss-notification-button-injected" onPress={dismiss}>
      <Text>dismiss-via-injected-prop</Text>
    </Pressable>
  );
}

function renderWithProviders() {
  const renderTreeStore = createRenderTreeStore();
  const notifications = createNotifications(renderTreeStore);
  const result = render(
    <RenderTree store={renderTreeStore}>
      <NotificationsProvider notifications={notifications}>
        <Text>app</Text>
      </NotificationsProvider>
    </RenderTree>,
  );
  return { notifications, result };
}

describe("NotificationSlot dismiss interaction", () => {
  it("removes notification from UI and store when dismiss button is pressed", async () => {
    const { notifications, result } = renderWithProviders();

    act(() => {
      notifications.show(<DismissibleNotification />);
    });

    expect(result.getByText("dismiss-me-notification")).toBeTruthy();
    expect(notifications.store.getState().entries).toHaveLength(1);

    act(() => {
      fireEvent.press(result.getByTestId("dismiss-notification-button"));
    });

    await waitFor(() => {
      expect(result.queryByText("dismiss-me-notification")).toBeNull();
      expect(notifications.store.getState().entries).toHaveLength(0);
    });
  });

  it("removes notification when using injected dismiss prop", async () => {
    const { notifications, result } = renderWithProviders();

    act(() => {
      notifications.show(<DismissibleViaInjectedProp />);
    });

    expect(result.getByText("dismiss-via-injected-prop")).toBeTruthy();
    expect(notifications.store.getState().entries).toHaveLength(1);

    act(() => {
      fireEvent.press(result.getByTestId("dismiss-notification-button-injected"));
    });

    await waitFor(() => {
      expect(result.queryByText("dismiss-via-injected-prop")).toBeNull();
      expect(notifications.store.getState().entries).toHaveLength(0);
    });
  });
});

describe("NotificationsProvider render-tree behavior", () => {
  it("works without an explicit RenderTree wrapper", () => {
    const notifications = createNotifications();
    const result = render(
      <NotificationsProvider notifications={notifications}>
        <Text>app</Text>
      </NotificationsProvider>,
    );

    act(() => {
      notifications.show(<Text>auto-tree-notification</Text>);
    });

    expect(result.getByText("auto-tree-notification")).toBeTruthy();
  });

  it("uses parent RenderTree when stores differ", () => {
    const parentStore = createRenderTreeStore();
    const notifications = createNotifications();

    const result = render(
      <RenderTree store={parentStore}>
        <NotificationsProvider notifications={notifications}>
          <Text>app</Text>
        </NotificationsProvider>
      </RenderTree>,
    );

    act(() => {
      notifications.show(<Text>parent-tree-notification</Text>);
    });

    expect(result.getByText("parent-tree-notification")).toBeTruthy();
  });

  it("dismiss() follows parent RenderTree active notification when stores differ", () => {
    const parentStore = createRenderTreeStore();
    const notifications = createNotifications();

    render(
      <RenderTree store={parentStore}>
        <NotificationsProvider notifications={notifications}>
          <Text>app</Text>
        </NotificationsProvider>
      </RenderTree>,
    );

    let keyA = "";
    let keyB = "";

    act(() => {
      keyA = notifications.show(<Text>a</Text>);
      keyB = notifications.show(<Text>b</Text>);
      notifications.markDidShow(keyA);
      notifications.markDidShow(keyB);
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
              type: NOTIFICATION_TYPE,
              parentId: "render-tree-root",
              active: true,
              children: [],
            },
          ],
          [
            keyB,
            {
              id: keyB,
              type: NOTIFICATION_TYPE,
              parentId: "render-tree-root",
              active: false,
              children: [],
            },
          ],
        ]),
      });
    });

    act(() => {
      notifications.dismiss();
    });

    const entries = notifications.store.getState().entries;
    const entryA = entries.find((entry) => entry.key === keyA);
    expect(entryA?.status === "closing" || entryA == null).toBe(true);
    expect(entries.find((entry) => entry.key === keyB)?.status).toBe("open");
  });
});
