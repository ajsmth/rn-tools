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

it("computes depth scoped by type", () => {
  const stackRef = { current: null as unknown };
  const nestedStackRef = { current: null as unknown };
  const screenRef = { current: null as unknown };

  act(() => {
    create(
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
  });

  expect((stackRef.current as any).depth).toBe(1);
  expect((nestedStackRef.current as any).depth).toBe(2);
  expect((screenRef.current as any).depth).toBe(1);
});

it("propagates active state through parents", () => {
  const screenRef = { current: null as unknown };

  const tree = create(
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

  act(() => {
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

  expect((screenRef.current as any).active).toBe(false);
});

it("tracks children by instance id", () => {
  const stackRef = { current: null as unknown };
  const screenRef = { current: null as unknown };

  act(() => {
    create(
      <RenderChartRoot>
        <RenderChartNode type="stack">
          <Capture refObject={stackRef} />
          <RenderChartNode type="screen">
            <Capture refObject={screenRef} />
          </RenderChartNode>
        </RenderChartNode>
      </RenderChartRoot>,
    );
  });

  const stack = stackRef.current as any;
  const screen = screenRef.current as any;
  expect(stack.getChildInstanceIds()).toContain(screen.instanceId);
  expect(screen.getParentInstanceId("stack")).toBe(stack.instanceId);
});

function Capture(props: { refObject: React.MutableRefObject<unknown> }) {
  return captureChart(props.refObject);
}
