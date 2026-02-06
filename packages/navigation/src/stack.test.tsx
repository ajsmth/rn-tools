import * as React from "react";
import { describe, expect, it } from "vitest";
import { act, render, waitFor } from "@testing-library/react";
import {
  getRenderNodeActive,
  useRenderTreeSelector,
  useRenderNodeType,
} from "@rn-tools/core";

import {
  NavigationProvider,
  createNavigationState,
  createNavigationStore,
  pushScreen,
} from "./navigation";
import { Stack } from "./stack";

async function renderWithProviders(
  node,
  store = createNavigationStore(),
) {
  const renderer = render(
    <NavigationProvider store={store}>{node}</NavigationProvider>,
  );
  return { store, renderer };
}

function ActiveProbe(props: { id: string }) {
  const active = useRenderTreeSelector((chart, id) =>
    getRenderNodeActive(chart, id),
  );
  return <span>{`${props.id}:${String(active)}`}</span>;
}

describe("Stack (navigation-v2)", () => {
  it("renders the rootScreen inside a screen node", async () => {
    function Callback(props) {
      return <>{useRenderNodeType()}</>;
    }

    const { renderer } = await renderWithProviders(
      <Stack rootScreen={<Callback />} />,
    );

    expect(renderer.getByText("screen")).toBeTruthy();
  });

  it("respects the active flag from the stack", async () => {
    function Callback(props) {
      const active = useRenderTreeSelector((chart, id) =>
        getRenderNodeActive(chart, id),
      );
      return <>{String(active)}</>;
    }

    const { renderer } = await renderWithProviders(
      <Stack active={false} rootScreen={<Callback />} />,
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

    function StackA(props) {
      return (
        <>
          <span>stack-a</span>
          {props.children}
        </>
      );
    }

    function StackB(props) {
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
              element: <ActiveProbe id="screen-a" />,
              options: { id: "screen-a" },
            },
            {
              element: <ActiveProbe id="screen-b" />,
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
              element: <ActiveProbe id="screen-a" />,
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
      pushScreen(store, <ActiveProbe id="screen-b" />, {
        id: "screen-b",
        stackId: "stack-a",
      });
    });

    await waitFor(() => {
      expect(renderer.getByText("screen-a:false")).toBeTruthy();
      expect(renderer.getByText("screen-b:true")).toBeTruthy();
    });
  });
});
