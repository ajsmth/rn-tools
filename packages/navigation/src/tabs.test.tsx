import * as React from "react";
import { describe, expect, it } from "vitest";
import { act, render, waitFor, fireEvent } from "@testing-library/react";
import { RenderNodeProbe } from "@rn-tools/core/mocks/render-node-probe";

import {
  createNavigation,
  type NavigationStateInput,
} from "./navigation-client";
import { Navigation } from "./navigation";
import { Tabs, type TabScreenOptions, type TabsHandle } from "./tabs";
import { Stack } from "./stack";

function makeScreens(count: number): TabScreenOptions[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `tab-${i}`,
    screen: (
      <RenderNodeProbe
        render={(data) => (
          <span>{`tab-${i}:${data.type}:${String(data.active)}`}</span>
        )}
      />
    ),
    tab: ({ isActive, onPress }) => (
      <span data-testid={`tab-btn-${i}`} onClick={onPress}>
        {`tab-btn-${i}:${String(isActive)}`}
      </span>
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

  it("setActiveTab changes which screen is active", async () => {
    const screens = makeScreens(3);
    const { navigation, renderer } = renderWithProviders(
      <Tabs id="my-tabs" screens={screens} />,
    );

    act(() => {
      navigation.setActiveTab(2);
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

  it("ref.setActiveIndex changes the active tab", async () => {
    const screens = makeScreens(3);
    const ref = React.createRef<TabsHandle>();
    const { renderer, store } = renderWithProviders(
      <Tabs ref={ref} id="my-tabs" screens={screens} />,
    );

    expect(renderer.getByText("tab-0:tab-screen:true")).toBeTruthy();

    act(() => {
      ref.current!.setActiveIndex(2);
    });

    await waitFor(() => {
      expect(renderer.getByText("tab-0:tab-screen:false")).toBeTruthy();
      expect(renderer.getByText("tab-1:tab-screen:false")).toBeTruthy();
      expect(renderer.getByText("tab-2:tab-screen:true")).toBeTruthy();
    });

    expect(store.getState().tabs.get("my-tabs")).toEqual({ activeIndex: 2 });
  });

  it("ref.setActiveIndex targets the correct tabs when id is not provided", async () => {
    const screens = makeScreens(3);
    const ref = React.createRef<TabsHandle>();
    const { renderer, store } = renderWithProviders(
      <Tabs ref={ref} screens={screens} />,
    );

    expect(renderer.getByText("tab-0:tab-screen:true")).toBeTruthy();

    act(() => {
      ref.current!.setActiveIndex(2);
    });

    await waitFor(() => {
      expect(renderer.getByText("tab-0:tab-screen:false")).toBeTruthy();
      expect(renderer.getByText("tab-1:tab-screen:false")).toBeTruthy();
      expect(renderer.getByText("tab-2:tab-screen:true")).toBeTruthy();
    });

    // The tab state should be set on the auto-generated tabs id
    const state = store.getState();
    expect(state.tabs.size).toBe(1);
    const [, tabState] = [...state.tabs.entries()][0];
    expect(tabState).toEqual({ activeIndex: 2 });
  });

  it("ref.setActiveIndex targets the inner tabs when nested inside a stack without an explicit id", async () => {
    const ref = React.createRef<TabsHandle>();
    const navigation = createNavigation();

    const tabScreens: TabScreenOptions[] = [
      {
        id: "tab-a",
        screen: <span>tab-a-content</span>,
        tab: () => <span>tab-a</span>,
      },
      {
        id: "tab-b",
        screen: <span>tab-b-content</span>,
        tab: () => <span>tab-b</span>,
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
      ref.current!.setActiveIndex(1);
    });

    // The tab switch should target the auto-generated tabs id, not "outer-stack"
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

    fireEvent.click(renderer.getByTestId("tab-btn-2"));

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

    // Screen content should appear before the tab bar in the DOM
    const screenNode = renderer.getByText("tab-0:tab-screen:true");
    const tabNode = renderer.getByText("tab-btn-0:true");
    const order = screenNode.compareDocumentPosition(tabNode);
    // DOCUMENT_POSITION_FOLLOWING = 4
    expect(order & 4).toBe(4);
  });

  it("renders tabbar at top when tabbarPosition is top", () => {
    const screens = makeScreens(1);
    const { renderer } = renderWithProviders(
      <Tabs id="my-tabs" screens={screens} tabbarPosition="top" />,
    );

    // Tab bar should appear before screen content in the DOM
    const tabNode = renderer.getByText("tab-btn-0:true");
    const screenNode = renderer.getByText("tab-0:tab-screen:true");
    const order = tabNode.compareDocumentPosition(screenNode);
    // DOCUMENT_POSITION_FOLLOWING = 4
    expect(order & 4).toBe(4);
  });
});

describe("Nested Stack + Tabs", () => {
  it("pushScreen targets the stack inside the active tab", async () => {
    const navigation = createNavigation();

    const screens: TabScreenOptions[] = [
      {
        id: "tab-a",
        screen: <Stack id="stack-a" rootScreen={<span>stack-a-root</span>} />,
        tab: () => <span>tab-a</span>,
      },
      {
        id: "tab-b",
        screen: <Stack id="stack-b" rootScreen={<span>stack-b-root</span>} />,
        tab: () => <span>tab-b</span>,
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

    // Tab 0 (stack-a) is active — pushScreen should target stack-a
    act(() => {
      navigation.pushScreen(<span>pushed-to-a</span>);
    });

    const stateAfterFirst = navigation.store.getState();
    expect(stateAfterFirst.stacks.get("stack-a")).toHaveLength(1);
    expect(stateAfterFirst.stacks.has("stack-b")).toBe(false);
  });

  it("switching tabs redirects pushScreen to the newly active stack", async () => {
    const navigation = createNavigation();

    const screens: TabScreenOptions[] = [
      {
        id: "tab-a",
        screen: <Stack id="stack-a" rootScreen={<span>stack-a-root</span>} />,
        tab: () => <span>tab-a</span>,
      },
      {
        id: "tab-b",
        screen: <Stack id="stack-b" rootScreen={<span>stack-b-root</span>} />,
        tab: () => <span>tab-b</span>,
      },
    ];

    render(
      <Navigation navigation={navigation}>
        <Tabs id="my-tabs" screens={screens} />
      </Navigation>,
    );

    // Switch to tab 1 (stack-b)
    act(() => {
      navigation.setActiveTab(1);
    });

    act(() => {
      navigation.pushScreen(<span>pushed-to-b</span>);
    });

    const state = navigation.store.getState();
    expect(state.stacks.get("stack-b")).toHaveLength(1);
    expect(state.stacks.has("stack-a")).toBe(false);
  });

  it("setActiveTab resolves the correct tabs when a stack wraps tabs", async () => {
    const navigation = createNavigation();

    const tabScreens: TabScreenOptions[] = [
      {
        id: "tab-a",
        screen: <span>tab-a-content</span>,
        tab: () => <span>tab-a</span>,
      },
      {
        id: "tab-b",
        screen: <span>tab-b-content</span>,
        tab: () => <span>tab-b</span>,
      },
    ];

    const result = render(
      <Navigation navigation={navigation}>
        <Stack id="outer-stack" rootScreen={<Tabs id="inner-tabs" screens={tabScreens} />} />
      </Navigation>,
    );

    await waitFor(() => {
      expect(result.getByText("tab-a-content")).toBeTruthy();
    });

    // setActiveTab with no explicit tabsId should resolve inner-tabs
    act(() => {
      navigation.setActiveTab(1);
    });

    const state = navigation.store.getState();
    expect(state.tabs.get("inner-tabs")).toEqual({ activeIndex: 1 });
  });
});
