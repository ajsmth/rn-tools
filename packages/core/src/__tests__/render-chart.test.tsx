import * as React from "react";
import { act, create } from "react-test-renderer";
import { expect, it } from "vitest";
import {
  RenderChartNode,
  RenderChartRoot,
  useRenderChart,
  useRenderChartSelector,
} from "../render-chart";

function captureChart(ref: React.MutableRefObject<unknown>) {
  const chart = useRenderChart();
  ref.current = chart;
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
  const stackRef = { current: null as unknown };
  const nestedStackRef = { current: null as unknown };
  const screenRef = { current: null as unknown };

  await renderAndFlush(
    <RenderChartRoot>
      <RenderChartNode type="stack">
        <Capture refObject={stackRef} />
        <RenderChartNode type="stack">
          <Capture refObject={nestedStackRef} />
          <RenderChartNode type="screen">
            <Capture refObject={screenRef} />
          </RenderChartNode>
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect((stackRef.current as any).depth).toBe(1);
  expect((nestedStackRef.current as any).depth).toBe(2);
  expect((screenRef.current as any).depth).toBe(1);
});

it("propagates active state through parents", async () => {
  const screenRef = { current: null as unknown };

  const tree = await renderAndFlush(
    <RenderChartRoot>
      <RenderChartNode type="tabs" active>
        <RenderChartNode type="stack" active>
          <RenderChartNode type="screen">
            <Capture refObject={screenRef} />
          </RenderChartNode>
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect((screenRef.current as any).active).toBe(true);

  await updateAndFlush(
    tree,
    <RenderChartRoot>
      <RenderChartNode type="tabs" active={false}>
        <RenderChartNode type="stack">
          <RenderChartNode type="screen">
            <Capture refObject={screenRef} />
          </RenderChartNode>
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect((screenRef.current as any).active).toBe(false);
});

it("tracks children by instance id", async () => {
  const stackRef = { current: null as unknown };
  const screenRef = { current: null as unknown };

  await renderAndFlush(
    <RenderChartRoot>
      <RenderChartNode type="stack">
        <Capture refObject={stackRef} />
        <RenderChartNode type="screen">
          <Capture refObject={screenRef} />
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  const stack = stackRef.current as any;
  const screen = screenRef.current as any;
  expect(stack.getChildInstanceIds()).toContain(screen.instanceId);
  expect(screen.getParentInstanceId("stack")).toBe(stack.instanceId);
});

it("updates depth when a stack is reparented", async () => {
  const nestedStackRef = { current: null as unknown };

  const tree = await renderAndFlush(
    <RenderChartRoot>
      <RenderChartNode type="stack">
        <RenderChartNode type="stack">
          <Capture refObject={nestedStackRef} />
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect((nestedStackRef.current as any).depth).toBe(2);

  await updateAndFlush(
    tree,
    <RenderChartRoot>
      <RenderChartNode type="stack">
        <Capture refObject={nestedStackRef} />
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect((nestedStackRef.current as any).depth).toBe(1);
});

it("updates parent/children relationships on unmount", async () => {
  const stackRef = { current: null as unknown };
  const screenRef = { current: null as unknown };

  const tree = await renderAndFlush(
    <RenderChartRoot>
      <RenderChartNode type="stack">
        <Capture refObject={stackRef} />
        <RenderChartNode type="screen" id="screen-a">
          <Capture refObject={screenRef} />
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  const stack = stackRef.current as any;
  const screen = screenRef.current as any;
  expect(stack.getChildIds()).toContain("screen-a");
  expect(screen.getParentId("stack")).toBeNull();

  await updateAndFlush(
    tree,
    <RenderChartRoot>
      <RenderChartNode type="stack">
        <Capture refObject={stackRef} />
      </RenderChartNode>
    </RenderChartRoot>,
  );

  const updatedStack = stackRef.current as any;
  expect(updatedStack.getChildIds()).not.toContain("screen-a");
});

it("respects local activeSelf overrides", async () => {
  const screenRef = { current: null as unknown };

  const tree = await renderAndFlush(
    <RenderChartRoot>
      <RenderChartNode type="stack" active>
        <RenderChartNode type="screen" active={false}>
          <Capture refObject={screenRef} />
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect((screenRef.current as any).active).toBe(false);

  await updateAndFlush(
    tree,
    <RenderChartRoot>
      <RenderChartNode type="stack" active={false}>
        <RenderChartNode type="screen" active>
          <Capture refObject={screenRef} />
        </RenderChartNode>
      </RenderChartNode>
    </RenderChartRoot>,
  );

  expect((screenRef.current as any).active).toBe(false);
});

function Capture(props: { refObject: React.MutableRefObject<unknown> }) {
  return captureChart(props.refObject);
}

it("only re-renders nodes affected by an upstream change", async () => {
  const panelARenders = { current: 0 };
  const stackARenders = { current: 0 };
  const stackBRenders = { current: 0 };

  function PanelAView() {
    useRenderChartSelector((chart) => chart.active);
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
    useRenderChartSelector((chart) => chart.active);
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
    useRenderChartSelector((chart) => chart.active);
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
    useRenderChartSelector((chart) => chart.active);
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
    useRenderChartSelector((chart) => chart.active);
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
    useRenderChartSelector((chart) => chart.depth);
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
    useRenderChartSelector((chart) => chart.depth);
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
