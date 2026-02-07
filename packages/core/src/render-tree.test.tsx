import * as React from "react";
import { render, waitFor } from "@testing-library/react/pure";
import { expect, it } from "vitest";
import {
  type RenderNode,
  RenderTreeNode,
  RenderTreeRoot,
  getRenderNodeActive,
  getRenderNodeChildren,
  getRenderNodeDepth,
  getRenderNodeParent,
  useRenderTreeSelector,
  getRenderNode,
} from "./render-tree";

type RenderNodeProbeData = {
  node: RenderNode;
  type: RenderNode["type"];
  active: boolean;
  depth: number;
  parent: RenderNode | null;
  children: RenderNode[];
};

function RenderNodeProbe(props: {
  render: (data: RenderNodeProbeData) => React.ReactNode;
}) {
  const data = useRenderTreeSelector((chart, id) => {
    const node = getRenderNode(chart, id);
    if (!node) {
      return null;
    }

    const parent = getRenderNodeParent(chart, id);
    const children = getRenderNodeChildren(chart, id);
    const depth = getRenderNodeDepth(chart, id);
    const active = getRenderNodeActive(chart, id);

    return {
      node,
      type: node.type,
      active,
      depth,
      parent,
      children,
    } satisfies RenderNodeProbeData;
  });

  if (!data) {
    return null;
  }

  return <>{props.render(data)}</>;
}

async function renderAndFlush(element: React.ReactElement) {
  const renderer = render(element);
  await waitFor(() => true);
  return renderer;
}

async function updateAndFlush(
  renderer: ReturnType<typeof render>,
  element: React.ReactElement,
) {
  renderer.rerender(element);
  await waitFor(() => true);
}

it("computes depth scoped by type", async () => {
  const stackDepthRef = { current: null as unknown };
  const nestedStackDepthRef = { current: null as unknown };
  const screenDepthRef = { current: null as unknown };

  await renderAndFlush(
    <RenderTreeRoot>
      <RenderTreeNode type="stack">
        <RenderNodeProbe
          render={(data) => {
            stackDepthRef.current = data.depth;
            return null;
          }}
        />
        <RenderTreeNode type="stack">
          <RenderNodeProbe
            render={(data) => {
              nestedStackDepthRef.current = data.depth;
              return null;
            }}
          />
          <RenderTreeNode type="screen">
            <RenderNodeProbe
              render={(data) => {
                screenDepthRef.current = data.depth;
                return null;
              }}
            />
          </RenderTreeNode>
        </RenderTreeNode>
      </RenderTreeNode>
    </RenderTreeRoot>,
  );

  expect(stackDepthRef.current).toBe(1);
  expect(nestedStackDepthRef.current).toBe(2);
  expect(screenDepthRef.current).toBe(1);
});

it("propagates active state through parents", async () => {
  const screenActiveRef = { current: null as unknown };

  const tree = await renderAndFlush(
    <RenderTreeRoot>
      <RenderTreeNode type="tabs" active>
        <RenderTreeNode type="stack" active>
          <RenderTreeNode type="screen">
            <RenderNodeProbe
              render={(data) => {
                screenActiveRef.current = data.active;
                return null;
              }}
            />
          </RenderTreeNode>
        </RenderTreeNode>
      </RenderTreeNode>
    </RenderTreeRoot>,
  );

  expect(screenActiveRef.current).toBe(true);

  await updateAndFlush(
    tree,
    <RenderTreeRoot>
      <RenderTreeNode type="tabs" active={false}>
        <RenderTreeNode type="stack">
          <RenderTreeNode type="screen">
            <RenderNodeProbe
              render={(data) => {
                screenActiveRef.current = data.active;
                return null;
              }}
            />
          </RenderTreeNode>
        </RenderTreeNode>
      </RenderTreeNode>
    </RenderTreeRoot>,
  );

  expect(screenActiveRef.current).toBe(false);
});

it("computes active in a type-agnostic way", async () => {
  const leafActiveRef = { current: null as unknown };

  await renderAndFlush(
    <RenderTreeRoot>
      <RenderTreeNode type="tabs" active={false}>
        <RenderTreeNode type="stack" active>
          <RenderTreeNode type="screen">
            <RenderTreeNode type="panel" active>
              <RenderNodeProbe
                render={(data) => {
                  leafActiveRef.current = data.active;
                  return null;
                }}
              />
            </RenderTreeNode>
          </RenderTreeNode>
        </RenderTreeNode>
      </RenderTreeNode>
    </RenderTreeRoot>,
  );

  expect(leafActiveRef.current).toBe(false);
});

it("tracks children by id", async () => {
  const stackIdRef = { current: null as string | null };
  const screenIdRef = { current: null as string | null };
  const stackChildrenRef = { current: null as string[] | null };
  const screenParentRef = { current: null as string | null };

  await renderAndFlush(
    <RenderTreeRoot>
      <RenderTreeNode type="stack">
        <RenderNodeProbe
          render={(data) => {
            stackIdRef.current = data.node.id;
            stackChildrenRef.current = data.children.map((child) => child.id);
            return null;
          }}
        />
        <RenderTreeNode type="screen">
          <RenderNodeProbe
            render={(data) => {
              screenIdRef.current = data.node.id;
              screenParentRef.current = data.parent?.id ?? null;
              return null;
            }}
          />
        </RenderTreeNode>
      </RenderTreeNode>
    </RenderTreeRoot>,
  );

  expect(stackChildrenRef.current).toContain(screenIdRef.current);
  expect(screenParentRef.current).toBe(stackIdRef.current);
});

it("updates depth when a stack is reparented", async () => {
  const nestedStackDepthRef = { current: null as unknown };

  const tree = await renderAndFlush(
    <RenderTreeRoot>
      <RenderTreeNode type="stack">
        <RenderTreeNode type="stack">
          <RenderNodeProbe
            render={(data) => {
              nestedStackDepthRef.current = data.depth;
              return null;
            }}
          />
        </RenderTreeNode>
      </RenderTreeNode>
    </RenderTreeRoot>,
  );

  expect(nestedStackDepthRef.current).toBe(2);

  await updateAndFlush(
    tree,
    <RenderTreeRoot>
      <RenderTreeNode type="stack">
        <RenderNodeProbe
          render={(data) => {
            nestedStackDepthRef.current = data.depth;
            return null;
          }}
        />
      </RenderTreeNode>
    </RenderTreeRoot>,
  );

  expect(nestedStackDepthRef.current).toBe(1);
});

it("updates parent/children relationships on unmount", async () => {
  const stackIdRef = { current: null as string | null };
  const stackChildrenRef = { current: null as string[] | null };
  const screenParentIdRef = { current: null as string | null };

  const tree = await renderAndFlush(
    <RenderTreeRoot>
      <RenderTreeNode type="stack">
        <RenderNodeProbe
          render={(data) => {
            stackIdRef.current = data.node.id;
            stackChildrenRef.current = data.children.map((child) => child.id);
            return null;
          }}
        />
        <RenderTreeNode type="screen" id="screen-a">
          <RenderNodeProbe
            render={(data) => {
              screenParentIdRef.current = data.parent?.id ?? null;
              return null;
            }}
          />
        </RenderTreeNode>
      </RenderTreeNode>
    </RenderTreeRoot>,
  );

  expect(stackChildrenRef.current).toContain("screen-a");
  expect(screenParentIdRef.current).toBe(stackIdRef.current);

  await updateAndFlush(
    tree,
    <RenderTreeRoot>
      <RenderTreeNode type="stack">
        <RenderNodeProbe
          render={(data) => {
            stackChildrenRef.current = data.children.map((child) => child.id);
            return null;
          }}
        />
      </RenderTreeNode>
    </RenderTreeRoot>,
  );

  expect(stackChildrenRef.current).not.toContain("screen-a");
});

it("respects local active overrides", async () => {
  const screenActiveRef = { current: null as unknown };

  const tree = await renderAndFlush(
    <RenderTreeRoot>
      <RenderTreeNode type="stack" active>
        <RenderTreeNode type="screen" active={false}>
          <RenderNodeProbe
            render={(data) => {
              screenActiveRef.current = data.active;
              return null;
            }}
          />
        </RenderTreeNode>
      </RenderTreeNode>
    </RenderTreeRoot>,
  );

  expect(screenActiveRef.current).toBe(false);

  await updateAndFlush(
    tree,
    <RenderTreeRoot>
      <RenderTreeNode type="stack" active={false}>
        <RenderTreeNode type="screen" active>
          <RenderNodeProbe
            render={(data) => {
              screenActiveRef.current = data.active;
              return null;
            }}
          />
        </RenderTreeNode>
      </RenderTreeNode>
    </RenderTreeRoot>,
  );

  expect(screenActiveRef.current).toBe(false);
});

it("only re-renders nodes affected by an upstream change", async () => {
  const panelARenders = { current: 0 };
  const stackARenders = { current: 0 };
  const stackBRenders = { current: 0 };

  function PanelAView() {
    useRenderTreeSelector((chart, id) => getRenderNodeActive(chart, id));
    panelARenders.current += 1;
    return <StackA />;
  }

  function PanelA(props: { active?: boolean }) {
    return (
      <RenderTreeNode type="panel" active={props.active}>
        <PanelAView />
      </RenderTreeNode>
    );
  }

  function StackAView() {
    useRenderTreeSelector((chart, id) => getRenderNodeActive(chart, id));
    stackARenders.current += 1;
    return <>A</>;
  }

  function StackA() {
    return (
      <RenderTreeNode type="stack">
        <StackAView />
      </RenderTreeNode>
    );
  }

  const StackB = React.memo(function StackB() {
    return (
      <RenderTreeNode type="stack">
        <StackBView />
      </RenderTreeNode>
    );
  });

  function StackBView() {
    useRenderTreeSelector((chart, id) => getRenderNodeActive(chart, id));
    stackBRenders.current += 1;
    return <>B</>;
  }

  const tree = await renderAndFlush(
    <RenderTreeRoot>
      <RenderTreeNode type="tabs" active>
        <PanelA active />
        <StackB />
      </RenderTreeNode>
    </RenderTreeRoot>,
  );

  const initialPanelARenders = panelARenders.current;
  const initialStackARenders = stackARenders.current;
  const initialStackBRenders = stackBRenders.current;

  await updateAndFlush(
    tree,
    <RenderTreeRoot>
      <RenderTreeNode type="tabs" active>
        <PanelA active={false} />
        <StackB />
      </RenderTreeNode>
    </RenderTreeRoot>,
  );

  expect(panelARenders.current).toBeGreaterThan(initialPanelARenders);
  expect(stackARenders.current).toBeGreaterThan(initialStackARenders);
  expect(stackBRenders.current).toBe(initialStackBRenders);
});

it("re-renders siblings when a shared ancestor changes", async () => {
  const stackARenders = { current: 0 };
  const stackBRenders = { current: 0 };

  function StackAView() {
    useRenderTreeSelector((chart, id) => getRenderNodeActive(chart, id));
    stackARenders.current += 1;
    return <>A</>;
  }

  function StackA() {
    return (
      <RenderTreeNode type="stack">
        <StackAView />
      </RenderTreeNode>
    );
  }

  function StackBView() {
    useRenderTreeSelector((chart, id) => getRenderNodeActive(chart, id));
    stackBRenders.current += 1;
    return <>B</>;
  }

  function StackB() {
    return (
      <RenderTreeNode type="stack">
        <StackBView />
      </RenderTreeNode>
    );
  }

  const tree = await renderAndFlush(
    <RenderTreeRoot>
      <RenderTreeNode type="tabs" active>
        <StackA />
        <StackB />
      </RenderTreeNode>
    </RenderTreeRoot>,
  );

  const initialStackARenders = stackARenders.current;
  const initialStackBRenders = stackBRenders.current;

  await updateAndFlush(
    tree,
    <RenderTreeRoot>
      <RenderTreeNode type="tabs" active={false}>
        <StackA />
        <StackB />
      </RenderTreeNode>
    </RenderTreeRoot>,
  );

  expect(stackARenders.current).toBeGreaterThan(initialStackARenders);
  expect(stackBRenders.current).toBeGreaterThan(initialStackBRenders);
});

it("only re-renders the reparented subtree when depth changes", async () => {
  const innerStackRenders = { current: 0 };
  const siblingStackRenders = { current: 0 };

  function InnerStackView() {
    useRenderTreeSelector((chart, id) => getRenderNodeDepth(chart, id));
    innerStackRenders.current += 1;
    return <>Inner</>;
  }

  function InnerStack() {
    return (
      <RenderTreeNode type="stack">
        <InnerStackView />
      </RenderTreeNode>
    );
  }

  function OuterStack() {
    return (
      <RenderTreeNode type="stack">
        <InnerStack />
      </RenderTreeNode>
    );
  }

  const SiblingStack = React.memo(function SiblingStack() {
    return (
      <RenderTreeNode type="stack">
        <SiblingStackView />
      </RenderTreeNode>
    );
  });

  function SiblingStackView() {
    useRenderTreeSelector((chart, id) => getRenderNodeDepth(chart, id));
    siblingStackRenders.current += 1;
    return <>Sibling</>;
  }

  const tree = await renderAndFlush(
    <RenderTreeRoot>
      <OuterStack />
      <SiblingStack />
    </RenderTreeRoot>,
  );

  const initialInnerStackRenders = innerStackRenders.current;
  const initialSiblingStackRenders = siblingStackRenders.current;

  await updateAndFlush(
    tree,
    <RenderTreeRoot>
      <InnerStack />
      <SiblingStack />
    </RenderTreeRoot>,
  );

  expect(innerStackRenders.current).toBeGreaterThan(initialInnerStackRenders);
  expect(siblingStackRenders.current).toBe(initialSiblingStackRenders);
});
