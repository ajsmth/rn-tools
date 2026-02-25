import * as React from "react";
import { act, render, waitFor, fireEvent } from "@testing-library/react-native";
import { Pressable, Text } from "react-native";
import { RenderNodeProbe } from "@rn-tools/core/mocks/render-node-probe";

import {
  createNavigation,
  type NavigationStateInput,
} from "./navigation-client";
import { Navigation } from "./navigation";
import { Tabs, type TabScreenOptions, type TabsHandle } from "./tabs";
import { Stack } from "./stack";

function collectTextNodes(node: unknown, output: string[]) {
  if (typeof node === "string") {
    output.push(node);
    return;
  }

  if (!node || typeof node !== "object") {
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((item) => collectTextNodes(item, output));
    return;
  }

  const children = (node as { children?: unknown[] }).children;
  if (children) {
    children.forEach((child) => collectTextNodes(child, output));
  }
}

function textOrder(renderer: ReturnType<typeof render>) {
  const text: string[] = [];
  collectTextNodes(renderer.toJSON(), text);
  return text;
}

function makeScreens(count: number): TabScreenOptions[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `tab-${i}`,
    screen: (
      <RenderNodeProbe
        render={(data) => (
          <Text>{`tab-${i}:${data.type}:${String(data.active)}`}</Text>
        )}
      />
    ),
    tab: ({ isActive, onPress }) => (
      <Pressable testID={`tab-btn-${i}`} onPress={onPress}>
        <Text>{`tab-btn-${i}:${String(isActive)}`}</Text>
      </Pressable>
    ),
  }));
}

function renderWithProviders(
  node: React.ReactNode,
  initialState?: NavigationStateInput,
) {
  const navigation = createNavigation(initialState);
  const renderer = render(
    <Navigation navigation={navigation}>{node}</Navigation>,
  );
  return { store: navigation.store, navigation, renderer };
}

describe("Tabs", () => {
  it("renders each screen inside a screen render tree node", () => {
    const screens = makeScreens(2);
    const { renderer } = renderWithProviders(
      <Tabs id="my-tabs" screens={screens} />,
    );

    expect(renderer.getByText("tab-0:tab-screen:true")).toBeTruthy();
    expect(renderer.getByText("tab-1:tab-screen:false")).toBeTruthy();
  });

  it("defaults active tab index to 0", () => {
    const screens = makeScreens(3);
    const { renderer } = renderWithProviders(
      <Tabs id="my-tabs" screens={screens} />,
    );

    expect(renderer.getByText("tab-0:tab-screen:true")).toBeTruthy();
    expect(renderer.getByText("tab-1:tab-screen:false")).toBeTruthy();
    expect(renderer.getByText("tab-2:tab-screen:false")).toBeTruthy();
  });

  it("tab changes which screen is active", async () => {
    const screens = makeScreens(3);
    const { navigation, renderer } = renderWithProviders(
      <Tabs id="my-tabs" screens={screens} />,
    );

    act(() => {
      navigation.tab(2);
    });

    await waitFor(() => {
      expect(renderer.getByText("tab-0:tab-screen:false")).toBeTruthy();
      expect(renderer.getByText("tab-1:tab-screen:false")).toBeTruthy();
      expect(renderer.getByText("tab-2:tab-screen:true")).toBeTruthy();
    });
  });

  it("respects the active flag from the tabs container", () => {
    const screens = makeScreens(1);
    const { renderer } = renderWithProviders(
      <Tabs id="my-tabs" active={false} screens={screens} />,
    );

    expect(renderer.getByText("tab-0:tab-screen:false")).toBeTruthy();
  });

  it("ref.setActive changes the active tab", async () => {
    const screens = makeScreens(3);
    const ref = React.createRef<TabsHandle>();
    const { renderer, store } = renderWithProviders(
      <Tabs ref={ref} id="my-tabs" screens={screens} />,
    );

    expect(renderer.getByText("tab-0:tab-screen:true")).toBeTruthy();

    act(() => {
      ref.current!.setActive(2);
    });

    await waitFor(() => {
      expect(renderer.getByText("tab-0:tab-screen:false")).toBeTruthy();
      expect(renderer.getByText("tab-1:tab-screen:false")).toBeTruthy();
      expect(renderer.getByText("tab-2:tab-screen:true")).toBeTruthy();
    });

    expect(store.getState().tabs.get("my-tabs")).toEqual({ activeIndex: 2 });
  });

  it("ref.setActive targets the correct tabs when id is not provided", async () => {
    const screens = makeScreens(3);
    const ref = React.createRef<TabsHandle>();
    const { renderer, store } = renderWithProviders(
      <Tabs ref={ref} screens={screens} />,
    );

    expect(renderer.getByText("tab-0:tab-screen:true")).toBeTruthy();

    act(() => {
      ref.current!.setActive(2);
    });

    await waitFor(() => {
      expect(renderer.getByText("tab-0:tab-screen:false")).toBeTruthy();
      expect(renderer.getByText("tab-1:tab-screen:false")).toBeTruthy();
      expect(renderer.getByText("tab-2:tab-screen:true")).toBeTruthy();
    });

    const state = store.getState();
    expect(state.tabs.size).toBe(1);
    const [, tabState] = [...state.tabs.entries()][0];
    expect(tabState).toEqual({ activeIndex: 2 });
  });

  it("ref.setActive targets the inner tabs when nested inside a stack without an explicit id", async () => {
    const ref = React.createRef<TabsHandle>();
    const navigation = createNavigation();

    const tabScreens: TabScreenOptions[] = [
      {
        id: "tab-a",
        screen: <Text>tab-a-content</Text>,
        tab: () => <Text>tab-a</Text>,
      },
      {
        id: "tab-b",
        screen: <Text>tab-b-content</Text>,
        tab: () => <Text>tab-b</Text>,
      },
    ];

    const result = render(
      <Navigation navigation={navigation}>
        <Stack
          id="outer-stack"
          rootScreen={<Tabs ref={ref} screens={tabScreens} />}
        />
      </Navigation>,
    );

    await waitFor(() => {
      expect(result.getByText("tab-a-content")).toBeTruthy();
    });

    act(() => {
      ref.current!.setActive(1);
    });

    const state = navigation.store.getState();
    expect(state.tabs.has("outer-stack")).toBe(false);
    expect(state.tabs.size).toBe(1);

    const [, tabState] = [...state.tabs.entries()][0];
    expect(tabState.activeIndex).toBe(1);
  });

  it("supports preloaded activeIndex from the navigation state", () => {
    const screens = makeScreens(3);
    const { renderer } = renderWithProviders(
      <Tabs id="my-tabs" screens={screens} />,
      { tabs: { "my-tabs": { activeIndex: 1 } } },
    );

    expect(renderer.getByText("tab-0:tab-screen:false")).toBeTruthy();
    expect(renderer.getByText("tab-1:tab-screen:true")).toBeTruthy();
    expect(renderer.getByText("tab-2:tab-screen:false")).toBeTruthy();
  });
});

describe("TabBar", () => {
  it("renders tab items with correct isActive state", () => {
    const screens = makeScreens(3);
    const { renderer } = renderWithProviders(
      <Tabs id="my-tabs" screens={screens} />,
    );

    expect(renderer.getByText("tab-btn-0:true")).toBeTruthy();
    expect(renderer.getByText("tab-btn-1:false")).toBeTruthy();
    expect(renderer.getByText("tab-btn-2:false")).toBeTruthy();
  });

  it("onPress switches the active tab", async () => {
    const screens = makeScreens(3);
    const { renderer } = renderWithProviders(
      <Tabs id="my-tabs" screens={screens} />,
    );

    fireEvent.press(renderer.getByTestId("tab-btn-2"));

    await waitFor(() => {
      expect(renderer.getByText("tab-btn-0:false")).toBeTruthy();
      expect(renderer.getByText("tab-btn-2:true")).toBeTruthy();
      expect(renderer.getByText("tab-2:tab-screen:true")).toBeTruthy();
      expect(renderer.getByText("tab-0:tab-screen:false")).toBeTruthy();
    });
  });

  it("renders tabbar at bottom by default", () => {
    const screens = makeScreens(1);
    const { renderer } = renderWithProviders(
      <Tabs id="my-tabs" screens={screens} />,
    );

    const order = textOrder(renderer);
    expect(order.indexOf("tab-0:tab-screen:true")).toBeLessThan(
      order.indexOf("tab-btn-0:true"),
    );
  });

  it("renders tabbar at top when tabbarPosition is top", () => {
    const screens = makeScreens(1);
    const { renderer } = renderWithProviders(
      <Tabs id="my-tabs" screens={screens} tabbarPosition="top" />,
    );

    const order = textOrder(renderer);
    expect(order.indexOf("tab-btn-0:true")).toBeLessThan(
      order.indexOf("tab-0:tab-screen:true"),
    );
  });
});

describe("Nested Stack + Tabs", () => {
  it("push targets the stack inside the active tab", async () => {
    const navigation = createNavigation();

    const screens: TabScreenOptions[] = [
      {
        id: "tab-a",
        screen: <Stack id="stack-a" rootScreen={<Text>stack-a-root</Text>} />,
        tab: () => <Text>tab-a</Text>,
      },
      {
        id: "tab-b",
        screen: <Stack id="stack-b" rootScreen={<Text>stack-b-root</Text>} />,
        tab: () => <Text>tab-b</Text>,
      },
    ];

    const result = render(
      <Navigation navigation={navigation}>
        <Tabs id="my-tabs" screens={screens} />
      </Navigation>,
    );

    await waitFor(() => {
      expect(result.getByText("stack-a-root")).toBeTruthy();
    });

    act(() => {
      navigation.push(<Text>pushed-to-a</Text>);
    });

    const stateAfterFirst = navigation.store.getState();
    expect(stateAfterFirst.stacks.get("stack-a")).toHaveLength(1);
    expect(stateAfterFirst.stacks.has("stack-b")).toBe(false);
  });

  it("switching tabs redirects push to the newly active stack", async () => {
    const navigation = createNavigation();

    const screens: TabScreenOptions[] = [
      {
        id: "tab-a",
        screen: <Stack id="stack-a" rootScreen={<Text>stack-a-root</Text>} />,
        tab: () => <Text>tab-a</Text>,
      },
      {
        id: "tab-b",
        screen: <Stack id="stack-b" rootScreen={<Text>stack-b-root</Text>} />,
        tab: () => <Text>tab-b</Text>,
      },
    ];

    render(
      <Navigation navigation={navigation}>
        <Tabs id="my-tabs" screens={screens} />
      </Navigation>,
    );

    act(() => {
      navigation.tab(1);
    });

    act(() => {
      navigation.push(<Text>pushed-to-b</Text>);
    });

    const state = navigation.store.getState();
    expect(state.stacks.get("stack-b")).toHaveLength(1);
    expect(state.stacks.has("stack-a")).toBe(false);
  });

  it("tab resolves the correct tabs when a stack wraps tabs", async () => {
    const navigation = createNavigation();

    const tabScreens: TabScreenOptions[] = [
      {
        id: "tab-a",
        screen: <Text>tab-a-content</Text>,
        tab: () => <Text>tab-a</Text>,
      },
      {
        id: "tab-b",
        screen: <Text>tab-b-content</Text>,
        tab: () => <Text>tab-b</Text>,
      },
    ];

    const result = render(
      <Navigation navigation={navigation}>
        <Stack
          id="outer-stack"
          rootScreen={<Tabs id="inner-tabs" screens={tabScreens} />}
        />
      </Navigation>,
    );

    await waitFor(() => {
      expect(result.getByText("tab-a-content")).toBeTruthy();
    });

    act(() => {
      navigation.tab(1);
    });

    const state = navigation.store.getState();
    expect(state.tabs.get("inner-tabs")).toEqual({ activeIndex: 1 });
  });
});
