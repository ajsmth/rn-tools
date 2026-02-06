import * as React from "react";
import { render, waitFor } from "@testing-library/react/pure";
import { expect, it } from "vitest";
import {
  RenderNode,
  RenderTreeRoot,
  getRenderNodeActive,
  getRenderNodeChildren,
  getRenderNodeDepth,
  getRenderNodeParent,
  useRenderNode,
  useRenderTreeSelector,
} from "../render-tree";

function captureChart(ref: React.MutableRefObject<unknown>) {
  const node = useRenderNode();
  ref.current = node;
  return null;
}

function requireNode(ref: React.MutableRefObject<unknown>) {
  const node = ref.current as typeof RenderNode | null;
  if (!node) {
    throw new Error("Expected RenderNode to be available.");
  }
  return node;
}

function captureSelector(
  ref: React.MutableRefObject<unknown>,
  selector: Parameters<typeof useRenderTreeSelector>[0],
) {
  const value = useRenderTreeSelector(selector);
  ref.current = value;
  return null;
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
      <RenderNode type="stack">
        <CaptureSelector
          refObject={stackDepthRef}
          selector={(chart, id) => getRenderNodeDepth(chart, id)}
        />
        <RenderNode type="stack">
          <CaptureSelector
            refObject={nestedStackDepthRef}
            selector={(chart, id) => getRenderNodeDepth(chart, id)}
          />
          <RenderNode type="screen">
            <CaptureSelector
              refObject={screenDepthRef}
              selector={(chart, id) => getRenderNodeDepth(chart, id)}
            />
          </RenderNode>
        </RenderNode>
      </RenderNode>
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
      <RenderNode type="tabs" active>
        <RenderNode type="stack" active>
          <RenderNode type="screen">
            <CaptureSelector
              refObject={screenActiveRef}
              selector={(chart, id) => getRenderNodeActive(chart, id)}
            />
          </RenderNode>
        </RenderNode>
      </RenderNode>
    </RenderTreeRoot>,
  );

  expect(screenActiveRef.current).toBe(true);

  await updateAndFlush(
    tree,
    <RenderTreeRoot>
      <RenderNode type="tabs" active={false}>
        <RenderNode type="stack">
          <RenderNode type="screen">
            <CaptureSelector
              refObject={screenActiveRef}
              selector={(chart, id) => getRenderNodeActive(chart, id)}
            />
          </RenderNode>
        </RenderNode>
      </RenderNode>
    </RenderTreeRoot>,
  );

  expect(screenActiveRef.current).toBe(false);
});

it("computes active in a type-agnostic way", async () => {
  const leafActiveRef = { current: null as unknown };

  await renderAndFlush(
    <RenderTreeRoot>
      <RenderNode type="tabs" active={false}>
        <RenderNode type="stack" active>
          <RenderNode type="screen">
            <RenderNode type="panel" active>
              <CaptureSelector
                refObject={leafActiveRef}
                selector={(chart, id) => getRenderNodeActive(chart, id)}
              />
            </RenderNode>
          </RenderNode>
        </RenderNode>
      </RenderNode>
    </RenderTreeRoot>,
  );

  expect(leafActiveRef.current).toBe(false);
});

it("tracks children by id", async () => {
  const stackRef = { current: null as unknown };
  const screenRef = { current: null as unknown };
  const stackChildrenRef = { current: null as unknown };
  const screenParentRef = { current: null as unknown };

  await renderAndFlush(
    <RenderTreeRoot>
      <RenderNode type="stack">
        <Capture refObject={stackRef} />
        <CaptureSelector
          refObject={stackChildrenRef}
          selector={(chart, id) =>
            getRenderNodeChildren(chart, id).map(
              (child) => child.id,
            )
          }
        />
        <RenderNode type="screen">
          <Capture refObject={screenRef} />
          <CaptureSelector
            refObject={screenParentRef}
            selector={(chart, id) =>
              getRenderNodeParent(chart, id)?.id
            }
          />
        </RenderNode>
      </RenderNode>
    </RenderTreeRoot>,
  );

  const resolvedStack = requireNode(stackRef);
  const resolvedScreen = requireNode(screenRef);
  expect(stackChildrenRef.current as string[]).toContain(
    resolvedScreen.id,
  );
  expect(screenParentRef.current).toBe(resolvedStack.id);
});

it("updates depth when a stack is reparented", async () => {
  const nestedStackDepthRef = { current: null as unknown };

  const tree = await renderAndFlush(
    <RenderTreeRoot>
      <RenderNode type="stack">
        <RenderNode type="stack">
          <CaptureSelector
            refObject={nestedStackDepthRef}
            selector={(chart, id) => getRenderNodeDepth(chart, id)}
          />
        </RenderNode>
      </RenderNode>
    </RenderTreeRoot>,
  );

  expect(nestedStackDepthRef.current).toBe(2);

  await updateAndFlush(
    tree,
    <RenderTreeRoot>
      <RenderNode type="stack">
        <CaptureSelector
          refObject={nestedStackDepthRef}
          selector={(chart, id) => getRenderNodeDepth(chart, id)}
        />
      </RenderNode>
    </RenderTreeRoot>,
  );

  expect(nestedStackDepthRef.current).toBe(1);
});

it("updates parent/children relationships on unmount", async () => {
  const stackRef = { current: null as unknown };
  const stackChildrenRef = { current: null as unknown };
  const screenParentIdRef = { current: null as unknown };

  const tree = await renderAndFlush(
    <RenderTreeRoot>
      <RenderNode type="stack">
        <Capture refObject={stackRef} />
        <CaptureSelector
          refObject={stackChildrenRef}
          selector={(chart, id) =>
            getRenderNodeChildren(chart, id).map((child) => child.id)
          }
        />
        <RenderNode type="screen" id="screen-a">
          <CaptureSelector
            refObject={screenParentIdRef}
            selector={(chart, id) => getRenderNodeParent(chart, id)?.id}
          />
        </RenderNode>
      </RenderNode>
    </RenderTreeRoot>,
  );

  expect(stackChildrenRef.current as Array<string | undefined>).toContain(
    "screen-a",
  );
  const resolvedStack = requireNode(stackRef);
  expect(screenParentIdRef.current).toBe(resolvedStack.id);

  await updateAndFlush(
    tree,
    <RenderTreeRoot>
      <RenderNode type="stack">
        <CaptureSelector
          refObject={stackChildrenRef}
          selector={(chart, id) =>
            getRenderNodeChildren(chart, id).map((child) => child.id)
          }
        />
      </RenderNode>
    </RenderTreeRoot>,
  );

  expect(stackChildrenRef.current as Array<string | undefined>).not.toContain(
    "screen-a",
  );
});

it("respects local active overrides", async () => {
  const screenActiveRef = { current: null as unknown };

  const tree = await renderAndFlush(
    <RenderTreeRoot>
      <RenderNode type="stack" active>
        <RenderNode type="screen" active={false}>
          <CaptureSelector
            refObject={screenActiveRef}
            selector={(chart, id) => getRenderNodeActive(chart, id)}
          />
        </RenderNode>
      </RenderNode>
    </RenderTreeRoot>,
  );

  expect(screenActiveRef.current).toBe(false);

  await updateAndFlush(
    tree,
    <RenderTreeRoot>
      <RenderNode type="stack" active={false}>
        <RenderNode type="screen" active>
          <CaptureSelector
            refObject={screenActiveRef}
            selector={(chart, id) => getRenderNodeActive(chart, id)}
          />
        </RenderNode>
      </RenderNode>
    </RenderTreeRoot>,
  );

  expect(screenActiveRef.current).toBe(false);
});

function Capture(props: { refObject: React.MutableRefObject<unknown> }) {
  return captureChart(props.refObject);
}

function CaptureSelector(props: {
  refObject: React.MutableRefObject<unknown>;
  selector: Parameters<typeof useRenderTreeSelector>[0];
}) {
  return captureSelector(props.refObject, props.selector);
}

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
      <RenderNode type="panel" active={props.active}>
        <PanelAView />
      </RenderNode>
    );
  }

  function StackAView() {
    useRenderTreeSelector((chart, id) => getRenderNodeActive(chart, id));
    stackARenders.current += 1;
    return <>A</>;
  }

  function StackA() {
    return (
      <RenderNode type="stack">
        <StackAView />
      </RenderNode>
    );
  }

  const StackB = React.memo(function StackB() {
    return (
      <RenderNode type="stack">
        <StackBView />
      </RenderNode>
    );
  });

  function StackBView() {
    useRenderTreeSelector((chart, id) => getRenderNodeActive(chart, id));
    stackBRenders.current += 1;
    return <>B</>;
  }

  const tree = await renderAndFlush(
    <RenderTreeRoot>
      <RenderNode type="tabs" active>
        <PanelA active />
        <StackB />
      </RenderNode>
    </RenderTreeRoot>,
  );

  const initialPanelARenders = panelARenders.current;
  const initialStackARenders = stackARenders.current;
  const initialStackBRenders = stackBRenders.current;

  await updateAndFlush(
    tree,
    <RenderTreeRoot>
      <RenderNode type="tabs" active>
        <PanelA active={false} />
        <StackB />
      </RenderNode>
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
      <RenderNode type="stack">
        <StackAView />
      </RenderNode>
    );
  }

  function StackBView() {
    useRenderTreeSelector((chart, id) => getRenderNodeActive(chart, id));
    stackBRenders.current += 1;
    return <>B</>;
  }

  function StackB() {
    return (
      <RenderNode type="stack">
        <StackBView />
      </RenderNode>
    );
  }

  const tree = await renderAndFlush(
    <RenderTreeRoot>
      <RenderNode type="tabs" active>
        <StackA />
        <StackB />
      </RenderNode>
    </RenderTreeRoot>,
  );

  const initialStackARenders = stackARenders.current;
  const initialStackBRenders = stackBRenders.current;

  await updateAndFlush(
    tree,
    <RenderTreeRoot>
      <RenderNode type="tabs" active={false}>
        <StackA />
        <StackB />
      </RenderNode>
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
      <RenderNode type="stack">
        <InnerStackView />
      </RenderNode>
    );
  }

  function OuterStack() {
    return (
      <RenderNode type="stack">
        <InnerStack />
      </RenderNode>
    );
  }

  const SiblingStack = React.memo(function SiblingStack() {
    return (
      <RenderNode type="stack">
        <SiblingStackView />
      </RenderNode>
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
