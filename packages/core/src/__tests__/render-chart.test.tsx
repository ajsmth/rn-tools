import * as React from "react";
import { act, create } from "react-test-renderer";
import { expect, it } from "vitest";
import {
  RenderChartNode,
  RenderChartRoot,
  getRenderChartNodeActive,
  getRenderChartNodeChildren,
  getRenderChartNodeDepth,
  getRenderChartNodeParent,
  logRenderChartDebugTree,
  useRenderChartNode,
  useRenderChartSelector,
} from "../render-chart";

function captureChart(ref: React.MutableRefObject<unknown>) {
  const node = useRenderChartNode();
  ref.current = node;
  return null;
}

function requireNode(ref: React.MutableRefObject<unknown>) {
  const node = ref.current as RenderChartNode | null;
  if (!node) {
    throw new Error("Expected RenderChartNode to be available.");
  }
  return node;
}

function captureSelector(
  ref: React.MutableRefObject<unknown>,
  selector: Parameters<typeof useRenderChartSelector>[0],
) {
  const value = useRenderChartSelector(selector);
  ref.current = value;
  return null;
}

async function renderAndFlush(element: React.ReactElement) {
  let root: ReturnType<typeof create>;
  await act(async () => {
    root = create(element);
  });
  await act(async () => {});
  return root!;
}

async function updateAndFlush(
  root: ReturnType<typeof create>,
  element: React.ReactElement,
) {
  await act(async () => {
    root.update(element);
  });
  await act(async () => {});
}

it("computes depth scoped by type", async () => {
  const stackDepthRef = { current: null as unknown };
  const nestedStackDepthRef = { current: null as unknown };
  const screenDepthRef = { current: null as unknown };

  await renderAndFlush(
    <RenderChartRoot>
      <RenderChartNode type="stack">
        <CaptureSelector
          refObject={stackDepthRef}
          selector={(chart, id) => {
            logRenderChartDebugTree(chart);
            return getRenderChartNodeDepth(chart, id);
          }}
        />
        <RenderChartNode type="stack">
          <CaptureSelector
            refObject={nestedStackDepthRef}
            selector={(chart, id) => getRenderChartNodeDepth(chart, id)}
          />
          <RenderChartNode type="screen">
            <CaptureSelector
              refObject={screenDepthRef}
              selector={(chart, id) => getRenderChartNodeDepth(chart, id)}
            />
          </RenderChartNode>
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect(stackDepthRef.current).toBe(1);
  expect(nestedStackDepthRef.current).toBe(2);
  expect(screenDepthRef.current).toBe(1);
});

it("propagates active state through parents", async () => {
  const screenActiveRef = { current: null as unknown };

  const tree = await renderAndFlush(
    <RenderChartRoot>
      <RenderChartNode type="tabs" active>
        <RenderChartNode type="stack" active>
          <RenderChartNode type="screen">
            <CaptureSelector
              refObject={screenActiveRef}
              selector={(chart, id) => getRenderChartNodeActive(chart, id)}
            />
          </RenderChartNode>
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect(screenActiveRef.current).toBe(true);

  await updateAndFlush(
    tree,
    <RenderChartRoot>
      <RenderChartNode type="tabs" active={false}>
        <RenderChartNode type="stack">
          <RenderChartNode type="screen">
            <CaptureSelector
              refObject={screenActiveRef}
              selector={(chart, id) => getRenderChartNodeActive(chart, id)}
            />
          </RenderChartNode>
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect(screenActiveRef.current).toBe(false);
});

it("computes active in a type-agnostic way", async () => {
  const leafActiveRef = { current: null as unknown };

  await renderAndFlush(
    <RenderChartRoot>
      <RenderChartNode type="tabs" active={false}>
        <RenderChartNode type="stack" active>
          <RenderChartNode type="screen">
            <RenderChartNode type="panel" active>
              <CaptureSelector
                refObject={leafActiveRef}
                selector={(chart, id) => getRenderChartNodeActive(chart, id)}
              />
            </RenderChartNode>
          </RenderChartNode>
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect(leafActiveRef.current).toBe(false);
});

it("tracks children by instance id", async () => {
  const stackRef = { current: null as unknown };
  const screenRef = { current: null as unknown };
  const stackChildrenRef = { current: null as unknown };
  const screenParentRef = { current: null as unknown };

  await renderAndFlush(
    <RenderChartRoot>
      <RenderChartNode type="stack">
        <Capture refObject={stackRef} />
        <CaptureSelector
          refObject={stackChildrenRef}
          selector={(chart, id) =>
            getRenderChartNodeChildren(chart, id).map(
              (child) => child.instanceId,
            )
          }
        />
        <RenderChartNode type="screen">
          <Capture refObject={screenRef} />
          <CaptureSelector
            refObject={screenParentRef}
            selector={(chart, id) =>
              getRenderChartNodeParent(chart, id)?.instanceId
            }
          />
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  const resolvedStack = requireNode(stackRef);
  const resolvedScreen = requireNode(screenRef);
  expect(stackChildrenRef.current as string[]).toContain(
    resolvedScreen.instanceId,
  );
  expect(screenParentRef.current).toBe(resolvedStack.instanceId);
});

it("updates depth when a stack is reparented", async () => {
  const nestedStackDepthRef = { current: null as unknown };

  const tree = await renderAndFlush(
    <RenderChartRoot>
      <RenderChartNode type="stack">
        <RenderChartNode type="stack">
          <CaptureSelector
            refObject={nestedStackDepthRef}
            selector={(chart, id) => getRenderChartNodeDepth(chart, id)}
          />
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect(nestedStackDepthRef.current).toBe(2);

  await updateAndFlush(
    tree,
    <RenderChartRoot>
      <RenderChartNode type="stack">
        <CaptureSelector
          refObject={nestedStackDepthRef}
          selector={(chart, id) => getRenderChartNodeDepth(chart, id)}
        />
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect(nestedStackDepthRef.current).toBe(1);
});

it("updates parent/children relationships on unmount", async () => {
  const stackChildrenRef = { current: null as unknown };
  const screenParentIdRef = { current: null as unknown };

  const tree = await renderAndFlush(
    <RenderChartRoot>
      <RenderChartNode type="stack">
        <CaptureSelector
          refObject={stackChildrenRef}
          selector={(chart, id) =>
            getRenderChartNodeChildren(chart, id).map((child) => child.id)
          }
        />
        <RenderChartNode type="screen" id="screen-a">
          <CaptureSelector
            refObject={screenParentIdRef}
            selector={(chart, id) => getRenderChartNodeParent(chart, id)?.id}
          />
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect(stackChildrenRef.current as Array<string | undefined>).toContain(
    "screen-a",
  );
  expect(screenParentIdRef.current).toBeUndefined();

  await updateAndFlush(
    tree,
    <RenderChartRoot>
      <RenderChartNode type="stack">
        <CaptureSelector
          refObject={stackChildrenRef}
          selector={(chart, id) =>
            getRenderChartNodeChildren(chart, id).map((child) => child.id)
          }
        />
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect(stackChildrenRef.current as Array<string | undefined>).not.toContain(
    "screen-a",
  );
});

it("respects local active overrides", async () => {
  const screenActiveRef = { current: null as unknown };

  const tree = await renderAndFlush(
    <RenderChartRoot>
      <RenderChartNode type="stack" active>
        <RenderChartNode type="screen" active={false}>
          <CaptureSelector
            refObject={screenActiveRef}
            selector={(chart, id) => getRenderChartNodeActive(chart, id)}
          />
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect(screenActiveRef.current).toBe(false);

  await updateAndFlush(
    tree,
    <RenderChartRoot>
      <RenderChartNode type="stack" active={false}>
        <RenderChartNode type="screen" active>
          <CaptureSelector
            refObject={screenActiveRef}
            selector={(chart, id) => getRenderChartNodeActive(chart, id)}
          />
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect(screenActiveRef.current).toBe(false);
});

function Capture(props: { refObject: React.MutableRefObject<unknown> }) {
  return captureChart(props.refObject);
}

function CaptureSelector(props: {
  refObject: React.MutableRefObject<unknown>;
  selector: Parameters<typeof useRenderChartSelector>[0];
}) {
  return captureSelector(props.refObject, props.selector);
}

it("only re-renders nodes affected by an upstream change", async () => {
  const panelARenders = { current: 0 };
  const stackARenders = { current: 0 };
  const stackBRenders = { current: 0 };

  function PanelAView() {
    useRenderChartSelector((chart, id) => getRenderChartNodeActive(chart, id));
    panelARenders.current += 1;
    return <StackA />;
  }

  function PanelA(props: { active?: boolean }) {
    return (
      <RenderChartNode type="panel" active={props.active}>
        <PanelAView />
      </RenderChartNode>
    );
  }

  function StackAView() {
    useRenderChartSelector((chart, id) => getRenderChartNodeActive(chart, id));
    stackARenders.current += 1;
    return <>A</>;
  }

  function StackA() {
    return (
      <RenderChartNode type="stack">
        <StackAView />
      </RenderChartNode>
    );
  }

  const StackB = React.memo(function StackB() {
    return (
      <RenderChartNode type="stack">
        <StackBView />
      </RenderChartNode>
    );
  });

  function StackBView() {
    useRenderChartSelector((chart, id) => getRenderChartNodeActive(chart, id));
    stackBRenders.current += 1;
    return <>B</>;
  }

  const tree = await renderAndFlush(
    <RenderChartRoot>
      <RenderChartNode type="tabs" active>
        <PanelA active />
        <StackB />
      </RenderChartNode>
    </RenderChartRoot>,
  );

  const initialPanelARenders = panelARenders.current;
  const initialStackARenders = stackARenders.current;
  const initialStackBRenders = stackBRenders.current;

  await updateAndFlush(
    tree,
    <RenderChartRoot>
      <RenderChartNode type="tabs" active>
        <PanelA active={false} />
        <StackB />
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect(panelARenders.current).toBeGreaterThan(initialPanelARenders);
  expect(stackARenders.current).toBeGreaterThan(initialStackARenders);
  expect(stackBRenders.current).toBe(initialStackBRenders);
});

it("re-renders siblings when a shared ancestor changes", async () => {
  const stackARenders = { current: 0 };
  const stackBRenders = { current: 0 };

  function StackAView() {
    useRenderChartSelector((chart, id) => getRenderChartNodeActive(chart, id));
    stackARenders.current += 1;
    return <>A</>;
  }

  function StackA() {
    return (
      <RenderChartNode type="stack">
        <StackAView />
      </RenderChartNode>
    );
  }

  function StackBView() {
    useRenderChartSelector((chart, id) => getRenderChartNodeActive(chart, id));
    stackBRenders.current += 1;
    return <>B</>;
  }

  function StackB() {
    return (
      <RenderChartNode type="stack">
        <StackBView />
      </RenderChartNode>
    );
  }

  const tree = await renderAndFlush(
    <RenderChartRoot>
      <RenderChartNode type="tabs" active>
        <StackA />
        <StackB />
      </RenderChartNode>
    </RenderChartRoot>,
  );

  const initialStackARenders = stackARenders.current;
  const initialStackBRenders = stackBRenders.current;

  await updateAndFlush(
    tree,
    <RenderChartRoot>
      <RenderChartNode type="tabs" active={false}>
        <StackA />
        <StackB />
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect(stackARenders.current).toBeGreaterThan(initialStackARenders);
  expect(stackBRenders.current).toBeGreaterThan(initialStackBRenders);
});

it("only re-renders the reparented subtree when depth changes", async () => {
  const innerStackRenders = { current: 0 };
  const siblingStackRenders = { current: 0 };

  function InnerStackView() {
    useRenderChartSelector((chart, id) => getRenderChartNodeDepth(chart, id));
    innerStackRenders.current += 1;
    return <>Inner</>;
  }

  function InnerStack() {
    return (
      <RenderChartNode type="stack">
        <InnerStackView />
      </RenderChartNode>
    );
  }

  function OuterStack() {
    return (
      <RenderChartNode type="stack">
        <InnerStack />
      </RenderChartNode>
    );
  }

  const SiblingStack = React.memo(function SiblingStack() {
    return (
      <RenderChartNode type="stack">
        <SiblingStackView />
      </RenderChartNode>
    );
  });

  function SiblingStackView() {
    useRenderChartSelector((chart, id) => getRenderChartNodeDepth(chart, id));
    siblingStackRenders.current += 1;
    return <>Sibling</>;
  }

  const tree = await renderAndFlush(
    <RenderChartRoot>
      <OuterStack />
      <SiblingStack />
    </RenderChartRoot>,
  );

  const initialInnerStackRenders = innerStackRenders.current;
  const initialSiblingStackRenders = siblingStackRenders.current;

  await updateAndFlush(
    tree,
    <RenderChartRoot>
      <InnerStack />
      <SiblingStack />
    </RenderChartRoot>,
  );

  expect(innerStackRenders.current).toBeGreaterThan(initialInnerStackRenders);
  expect(siblingStackRenders.current).toBe(initialSiblingStackRenders);
});
