import * as React from "react";
import { act, create } from "react-test-renderer";
import { expect, it } from "vitest";
import {
  RenderChartNode,
  RenderChartRoot,
  useRenderChart,
} from "../render-chart";

function captureChart(ref: React.MutableRefObject<unknown>) {
  const chart = useRenderChart();
  ref.current = chart;
  return null;
}

async function renderWithFlush(element: React.ReactElement) {
  let root: ReturnType<typeof create>;
  await act(async () => {
    root = create(element);
  });
  await act(async () => {
    await Promise.resolve();
  });
  return root!;
}

it("computes depth scoped by type", async () => {
  const stackRef = { current: null as unknown };
  const nestedStackRef = { current: null as unknown };
  const screenRef = { current: null as unknown };

  await renderWithFlush(
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

  const tree = await renderWithFlush(
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

  await act(async () => {
    tree.update(
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
  });
  await act(async () => {
    await Promise.resolve();
  });

  expect((screenRef.current as any).active).toBe(false);
});

it("tracks children by instance id", async () => {
  const stackRef = { current: null as unknown };
  const screenRef = { current: null as unknown };

  await renderWithFlush(
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

function Capture(props: { refObject: React.MutableRefObject<unknown> }) {
  return captureChart(props.refObject);
}
