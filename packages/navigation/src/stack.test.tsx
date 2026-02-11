import * as React from "react";
import { describe, expect, it } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import { RenderNodeProbe } from "@rn-tools/core/mocks/render-node-probe";

import {
  createNavigation,
  NavigationProvider,
  loadNavigationState,
  type NavigationStateInput,
} from "./navigation";
import { Stack, type StackHandle } from "./stack";

async function renderWithProviders(
  node: React.ReactNode,
  initialState?: NavigationStateInput,
) {
  const navigation = createNavigation(initialState);
  const renderer = render(
    <NavigationProvider navigation={navigation}>{node}</NavigationProvider>,
  );
  return { store: navigation.store, navigation, renderer };
}

describe("Stack", () => {
  it("renders the rootScreen inside a screen node", async () => {
    const { renderer } = await renderWithProviders(
      <Stack rootScreen={<RenderNodeProbe render={(data) => data.type} />} />,
    );

    expect(renderer.getByText("screen")).toBeTruthy();
  });

  it("respects the active flag from the stack", async () => {
    const { renderer } = await renderWithProviders(
      <Stack
        active={false}
        rootScreen={<RenderNodeProbe render={(data) => String(data.active)} />}
      />,
    );

    expect(renderer.getByText("false")).toBeTruthy();
  });

  it("renders each screen under its own stack", async () => {
    const { renderer } = await renderWithProviders(
      <>
        <Stack id="stack-a" />
        <Stack id="stack-b" />
      </>,
      {
        stacks: {
          "stack-a": [
            {
              element: (
                <RenderNodeProbe
                  render={(data) => <span>{`a:${data.node.parentId}`}</span>}
                />
              ),
              options: { id: "screen-a" },
            },
          ],
          "stack-b": [
            {
              element: (
                <RenderNodeProbe
                  render={(data) => <span>{`b:${data.node.parentId}`}</span>}
                />
              ),
              options: { id: "screen-b" },
            },
          ],
        },
      },
    );

    expect(renderer.getByText("a:stack-a")).toBeTruthy();
    expect(renderer.getByText("b:stack-b")).toBeTruthy();
  });

  it("marks only the last screen as active in a stack", async () => {
    const { renderer } = await renderWithProviders(<Stack id="stack-a" />, {
      stacks: {
        "stack-a": [
          {
            element: (
              <RenderNodeProbe
                render={(data) => (
                  <span>{`screen-a:${String(data.active)}`}</span>
                )}
              />
            ),
            options: { id: "screen-a" },
          },
          {
            element: (
              <RenderNodeProbe
                render={(data) => (
                  <span>{`screen-b:${String(data.active)}`}</span>
                )}
              />
            ),
            options: { id: "screen-b" },
          },
        ],
      },
    });

    expect(renderer.getByText("screen-a:false")).toBeTruthy();
    expect(renderer.getByText("screen-b:true")).toBeTruthy();
  });

  it("pushScreen adds a new active screen to the stack", async () => {
    const { navigation, renderer } = await renderWithProviders(
      <Stack id="stack-a" />,
      {
        stacks: {
          "stack-a": [
            {
              element: (
                <RenderNodeProbe
                  render={(data) => (
                    <span>{`screen-a:${String(data.active)}`}</span>
                  )}
                />
              ),
              options: { id: "screen-a" },
            },
          ],
        },
      },
    );

    act(() => {
      navigation.pushScreen(
        <RenderNodeProbe
          render={(data) => <span>{`screen-b:${String(data.active)}`}</span>}
        />,
        {
          id: "screen-b",
          stackId: "stack-a",
        },
      );
    });

    await waitFor(() => {
      expect(renderer.getByText("screen-a:false")).toBeTruthy();
      expect(renderer.getByText("screen-b:true")).toBeTruthy();
    });
  });

  it("renders preloaded stacks created outside of React", async () => {
    const { renderer } = await renderWithProviders(
      <>
        <Stack id="stack-a" />
        <Stack id="stack-b" />
      </>,
      {
        stacks: {
          "stack-a": [
            {
              element: (
                <RenderNodeProbe
                  render={(data) => (
                    <span>{`a1:${data.type}:${String(data.active)}`}</span>
                  )}
                />
              ),
              options: { id: "screen-a1" },
            },
            {
              element: (
                <RenderNodeProbe
                  render={(data) => (
                    <span>{`a2:${data.type}:${String(data.active)}`}</span>
                  )}
                />
              ),
              options: { id: "screen-a2" },
            },
          ],
          "stack-b": [
            {
              element: (
                <RenderNodeProbe
                  render={(data) => (
                    <span>{`b1:${data.type}:${String(data.active)}`}</span>
                  )}
                />
              ),
              options: { id: "screen-b1" },
            },
          ],
        },
      },
    );

    expect(renderer.getByText("a1:screen:false")).toBeTruthy();
    expect(renderer.getByText("a2:screen:true")).toBeTruthy();
    expect(renderer.getByText("b1:screen:true")).toBeTruthy();
  });

  it("loads navigation state into an existing store before rendering", async () => {
    const navigation = createNavigation();

    loadNavigationState(navigation.store, {
      stacks: {
        "stack-a": [
          {
            element: (
              <RenderNodeProbe
                render={(data) => <span>{`a1:${String(data.active)}`}</span>}
              />
            ),
            options: { id: "screen-a1" },
          },
        ],
      },
    });

    const renderer = render(
      <NavigationProvider navigation={navigation}>
        <Stack id="stack-a" />
      </NavigationProvider>,
    );

    expect(renderer.getByText("a1:true")).toBeTruthy();
  });

  it("pushScreen does not push a duplicate when a screen with the same id exists", async () => {
    const { navigation, renderer } = await renderWithProviders(
      <Stack id="stack-a" />,
      {
        stacks: {
          "stack-a": [
            {
              element: <span>screen-a</span>,
              options: { id: "screen-a" },
            },
          ],
        },
      },
    );

    act(() => {
      navigation.pushScreen(<span>screen-a-dup</span>, {
        id: "screen-a",
        stackId: "stack-a",
      });
    });

    expect(navigation.store.getState().stacks.get("stack-a")).toHaveLength(1);
    expect(renderer.getByText("screen-a")).toBeTruthy();

    act(() => {
      navigation.popScreen({ stackId: "stack-a" });
    });

    expect(navigation.store.getState().stacks.get("stack-a")).toHaveLength(0);
    expect(renderer.queryByText("screen-a")).toBeNull();

    act(() => {
      navigation.pushScreen(<span>screen-a-again</span>, {
        id: "screen-a",
        stackId: "stack-a",
      });
    });

    expect(navigation.store.getState().stacks.get("stack-a")).toHaveLength(1);
    renderer.getByText("screen-a-again");
  });

  it("ref.pushScreen adds a screen and ref.popScreen removes it", async () => {
    const ref = React.createRef<StackHandle>();
    const { renderer } = await renderWithProviders(
      <Stack ref={ref} id="stack-a" rootScreen={<span>root</span>} />,
    );

    expect(renderer.getByText("root")).toBeTruthy();

    act(() => {
      ref.current!.pushScreen(<span>pushed</span>, { id: "pushed-screen" });
    });

    await waitFor(() => {
      expect(renderer.getByText("pushed")).toBeTruthy();
    });

    act(() => {
      ref.current!.popScreen();
    });

    await waitFor(() => {
      expect(renderer.queryByText("pushed")).toBeNull();
      expect(renderer.getByText("root")).toBeTruthy();
    });
  });

  it("resolves the deepest active stack and falls back when a subtree becomes inactive", async () => {
    const navigation = createNavigation();

    function NestedRight() {
      return <Stack id="right-nested" rootScreen={<span>nested-root</span>} />;
    }

    const result = render(
      <NavigationProvider navigation={navigation}>
        <Stack id="left" rootScreen={<span>left-root</span>} />
        <Stack id="right" active={true} rootScreen={<NestedRight />} />
      </NavigationProvider>,
    );

    await waitFor(() => {
      expect(result.getByText("nested-root")).toBeTruthy();
    });

    // pushScreen with no stackId should target the deepest active stack: right-nested
    act(() => {
      navigation.pushScreen(<span>first-push</span>);
    });

    const stateAfterFirst = navigation.store.getState();
    expect(stateAfterFirst.stacks.get("right-nested")).toHaveLength(1);
    expect(stateAfterFirst.stacks.has("left")).toBe(false);

    // Deactivate the right subtree — left should become the active stack
    result.rerender(
      <NavigationProvider navigation={navigation}>
        <Stack id="left" rootScreen={<span>left-root</span>} />
        <Stack id="right" active={false} rootScreen={<NestedRight />} />
      </NavigationProvider>,
    );

    act(() => {
      navigation.pushScreen(<span>second-push</span>);
    });

    const stateAfterSecond = navigation.store.getState();
    expect(stateAfterSecond.stacks.get("left")).toHaveLength(1);
  });
});
