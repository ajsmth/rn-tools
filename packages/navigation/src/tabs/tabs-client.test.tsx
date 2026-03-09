import { createTree } from "@rn-tools/core";
import { createStack } from "../stack/stack-client";
import { act, render, screen } from "@testing-library/react-native";
import { Stack } from "../stack/stack";
import { Text, View } from "react-native";
import { createTabs } from "./tabs-client";
import { Tabs } from "./tabs";

jest.mock("react-native-screens", () => {
  const { View } = jest.requireActual("react-native");

  return {
    ScreenStack: ({ children }) => <>{children}</>,
    ScreenContainer: ({ children }) => <>{children}</>,
    Screen: ({ children, activityState }) => {
      if (activityState == 0) {
        return null;
      }

      return <>{children}</>;
    },
  };
});

describe("createTabs()", () => {
  test("it exists", () => {
    expect(createTabs()).toBeDefined();
  });

  test("updating tab index", () => {
    const tabs = createTabs();

    const screens = [
      { id: "1", element: <Text>Screen 1</Text> },
      { id: "2", element: <Text>Screen 2 </Text> },
    ];

    render(
      <tabs.Provider>
        <Tabs screens={screens} />
      </tabs.Provider>,
    );

    expect(screen.queryByText(/screen 2/i)).toBe(null);
    screen.getByText(/screen 1/i);

    act(() => {
      tabs.tab(1);
    });

    expect(screen.queryByText(/screen 2/i)).not.toBe(null);
    expect(screen.queryByText(/screen 1/i)).toBe(null);
  });

  test("nested tabs target the right active nodes", () => {
    const tabs = createTabs();

    const screens2 = [
      { id: "3", element: <Text>Screen 3</Text> },
      { id: "4", element: <Text>Screen 4</Text> },
    ];

    const screens1 = [
      { id: "1", element: <Text>Screen 1</Text> },
      { id: "2", element: <Tabs screens={screens2} /> },
    ];

    render(
      <tabs.Provider>
        <Tabs screens={screens1} />
      </tabs.Provider>,
    );

    act(() => {
      tabs.tab(1);
    });

    expect(screen.queryByText(/screen 4/i)).toBe(null);
    screen.getByText(/screen 3/i);

    act(() => {
      tabs.tab(1);
    });

    screen.getByText(/screen 4/i);
    expect(screen.queryByText(/screen 3/i)).toBe(null);
  });

  test("stack nested in tabs is targeted based on active index", () => {
    const tree = createTree();
    const tabs = createTabs(tree);
    const stack = createStack(tree);

    const screens = [
      {
        id: "tab-1",
        element: (
          <View testID="tab-1">
            <Stack id="tab-1-stack" />
          </View>
        ),
      },
      {
        id: "tab-2",
        element: (
          <View testID="tab-2">
            <Stack id="tab-2-stack" />
          </View>
        ),
      },
    ];

    render(
      <tabs.Provider>
        <stack.Provider>
          <Tabs screens={screens} />
        </stack.Provider>
      </tabs.Provider>,
    );

    act(() => {
      stack.push(<Text>Tab 1 entry</Text>);
    });

    screen.getByText(/tab 1 entry/i);

    act(() => {
      tabs.tab(1);
    });

    expect(screen.queryByText(/tab 1 entry/i)).toBe(null);

    act(() => {
      stack.push(<Text>Tab 2 entry</Text>);
    });

    screen.getByText(/tab 2 entry/i);

    act(() => {
      tabs.tab(0);
    });

    screen.getByText(/tab 1 entry/i);
    expect(screen.queryByText(/tab 2 entry/i)).toBe(null);

    act(() => {
      tabs.tab(1);
    });

    screen.getByText(/tab 2 entry/i);
    expect(screen.queryByText(/tab 1 entry/i)).toBe(null);
  });
});
