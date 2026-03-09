import { createTree } from "@rn-tools/core";
import { createNotifications } from "./notifications-client";
import { act, render, screen, within } from "@testing-library/react-native";
import * as React from "react";
import { Text } from "react-native";

jest.mock("./notifications-native-view.tsx", () => {
  const View = jest.requireActual("react-native").View;
  return {
    NativeContainer: ({ children }) => <>{children}</>,
    NativeTopLane: ({ children }) => <View testID="top-lane">{children}</View>,
    NativeBottomLane: ({ children }) => (
      <View testID="bottom-lane">{children}</View>
    ),
  };
});

function getLane(position: "top" | "bottom") {
  return screen.getByTestId(position + "-lane");
}

describe("createNotifications()", () => {
  test("rendering notifications in lanes", () => {
    const tree = createTree();
    const notifications = createNotifications(tree);
    render(
      <notifications.Provider>
        <Text>Root</Text>
      </notifications.Provider>,
    );

    act(() => {
      notifications.present(<Text>Hey</Text>);
    });

    within(getLane("top")).getByText(/hey/i);
    expect(within(getLane("bottom")).queryByText(/hey/i)).toBeNull();

    act(() => {
      notifications.present(<Text>Hello</Text>, { position: "bottom" });
    });

    within(getLane("bottom")).getByText(/hello/i);
    expect(within(getLane("top")).queryByText(/hello/i)).toBeNull();
  });

  test("dismiss works", () => {
    const tree = createTree();
    const notifications = createNotifications(tree);

    render(
      <notifications.Provider>
        <Text>Root</Text>
      </notifications.Provider>,
    );

    act(() => {
      notifications.present(<Text>Hey</Text>);
    });

    act(() => {
      notifications.dismiss();
    });

    expect(screen.queryByText(/hey/i)).toBeNull();
  });

  test("dismiss by id works", () => {
    const tree = createTree();
    const notifications = createNotifications(tree);

    render(
      <notifications.Provider>
        <Text>Root</Text>
      </notifications.Provider>,
    );

    act(() => {
      notifications.present(<Text>Hey</Text>, { id: "1" });
      notifications.present(<Text>Hello</Text>, { id: "2" });
    });

    act(() => {
      notifications.dismiss("1");
    });

    expect(screen.queryByText(/hey/i)).toBeNull();
  });

  test("dismiss all", () => {
    const tree = createTree();
    const notifications = createNotifications(tree);

    render(
      <notifications.Provider>
        <Text>Root</Text>
      </notifications.Provider>,
    );

    act(() => {
      notifications.present(<Text>Hey</Text>, { id: "1" });
      notifications.present(<Text>Hello</Text>, {
        id: "2",
        position: "bottom",
      });
    });

    within(getLane("bottom")).getByText(/hello/i);

    act(() => {
      notifications.dismissAll();
    });

    expect(screen.queryByText(/hey/i)).toBeNull();
    expect(screen.queryByText(/hey/i)).toBeNull();
  });
});

describe("notifications duration timer", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test("auto dismisses after durationMs", () => {
    const tree = createTree();
    const notifications = createNotifications(tree);

    render(
      <notifications.Provider>
        <Text>Root</Text>
      </notifications.Provider>,
    );

    act(() => {
      notifications.present(<Text>Note</Text>, { durationMs: 500 });
    });

    within(getLane("top")).getByText(/note/i);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    expect(screen.queryByText(/note/i)).toBeNull();
  });

  test("null duration keeps notification open", () => {
    const tree = createTree();
    const notifications = createNotifications(tree);

    render(
      <notifications.Provider>
        <Text>Root</Text>
      </notifications.Provider>,
    );

    act(() => {
      notifications.present(<Text>Persistent</Text>, { durationMs: null });
    });

    within(getLane("top")).getByText(/persistent/i);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    within(getLane("top")).getByText(/persistent/i);
  });
});
