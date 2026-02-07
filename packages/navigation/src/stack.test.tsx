import * as React from "react";
import { describe, expect, it } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import { RenderNodeProbe } from "@rn-tools/core/mocks/render-node-probe";

import {
  NavigationProvider,
  createNavigationState,
  createNavigationStore,
  loadNavigationState,
  pushScreen,
  type NavigationStore,
} from "./navigation";
import { Stack } from "./stack";

async function renderWithProviders(
  node: React.ReactNode,
  store: NavigationStore = createNavigationStore(),
) {
  const renderer = render(
    <NavigationProvider store={store}>{node}</NavigationProvider>,
  );
  return { store, renderer };
}

describe("Stack (navigation-v2)", () => {
  it("renders the rootScreen inside a screen node", async () => {
    const { renderer } = await renderWithProviders(
      <Stack
        rootScreen={<RenderNodeProbe render={(data) => data.type} />}
      />,
    );

    expect(renderer.getByText("screen")).toBeTruthy();
  });

  it("respects the active flag from the stack", async () => {
    const { renderer } = await renderWithProviders(
      <Stack
        active={false}
        rootScreen={
          <RenderNodeProbe render={(data) => String(data.active)} />
        }
      />,
    );

    expect(renderer.getByText("false")).toBeTruthy();
  });

  it("selects the correct stack id for StackSlot screens", async () => {
    const stackAScreens = [
      { element: <ScreenA />, options: { id: "screen-a" } },
    ];
    const stackBScreens = [
      { element: <ScreenB />, options: { id: "screen-b" } },
    ];

    function StackA(props: { children?: React.ReactNode }) {
      return (
        <>
          <span>stack-a</span>
          {props.children}
        </>
      );
    }

    function StackB(props: { children?: React.ReactNode }) {
      return (
        <>
          <span>stack-b</span>
          {props.children}
        </>
      );
    }

    function ScreenA() {
      return <span>screen-a</span>;
    }

    function ScreenB() {
      return <span>screen-b</span>;
    }

    const store = createNavigationStore(
      createNavigationState({
        stacks: {
          "stack-a": stackAScreens,
          "stack-b": stackBScreens,
        },
      }),
    );
    const { renderer: tree } = await renderWithProviders(
      <>
        <StackA>
          <Stack id="stack-a" />
        </StackA>
        <StackB>
          <Stack id="stack-b" />
        </StackB>
      </>,
      store,
    );

    expect(tree.getAllByText("screen-a")).toHaveLength(1);
    expect(tree.getAllByText("screen-b")).toHaveLength(1);
  });

  it("marks only the last screen as active in a stack", async () => {
    const store = createNavigationStore(
      createNavigationState({
        stacks: {
          "stack-a": [
            {
              element: (
                <RenderNodeProbe
                  render={(data) => <span>{`screen-a:${String(data.active)}`}</span>}
                />
              ),
              options: { id: "screen-a" },
            },
            {
              element: (
                <RenderNodeProbe
                  render={(data) => <span>{`screen-b:${String(data.active)}`}</span>}
                />
              ),
              options: { id: "screen-b" },
            },
          ],
        },
      }),
    );

    const { renderer } = await renderWithProviders(
      <Stack id="stack-a" />,
      store,
    );

    expect(renderer.getByText("screen-a:false")).toBeTruthy();
    expect(renderer.getByText("screen-b:true")).toBeTruthy();
  });

  it("pushScreen adds a new active screen to the stack", async () => {
    const store = createNavigationStore(
      createNavigationState({
        stacks: {
          "stack-a": [
            {
              element: (
                <RenderNodeProbe
                  render={(data) => <span>{`screen-a:${String(data.active)}`}</span>}
                />
              ),
              options: { id: "screen-a" },
            },
          ],
        },
      }),
    );

    const { renderer } = await renderWithProviders(
      <Stack id="stack-a" />,
      store,
    );

    act(() => {
      pushScreen(
        store,
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
    const store = createNavigationStore(
      createNavigationState({
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
      }),
    );

    const { renderer } = await renderWithProviders(
      <>
        <Stack id="stack-a" />
        <Stack id="stack-b" />
      </>,
      store,
    );

    expect(renderer.getByText("a1:screen:false")).toBeTruthy();
    expect(renderer.getByText("a2:screen:true")).toBeTruthy();
    expect(renderer.getByText("b1:screen:true")).toBeTruthy();
  });

  it("loads navigation state into an existing store before rendering", async () => {
    const store = createNavigationStore();

    loadNavigationState(store, {
      stacks: {
        "stack-a": [
          {
            element: (
              <RenderNodeProbe
                render={(data) => (
                  <span>{`a1:${String(data.active)}`}</span>
                )}
              />
            ),
            options: { id: "screen-a1" },
          },
        ],
      },
    });

    const { renderer } = await renderWithProviders(
      <Stack id="stack-a" />,
      store,
    );

    expect(renderer.getByText("a1:true")).toBeTruthy();
  });
});
