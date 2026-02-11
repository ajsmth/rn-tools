import * as React from "react";
import {
  type RenderNode,
  getRenderNode,
  getRenderNodeActive,
  getRenderNodeDepth,
  getRenderNodeChildren,
  getRenderNodeParent,
  useRenderTreeSelector,
} from "../src/render-tree";

export type RenderNodeProbeData = {
  node: RenderNode;
  type: RenderNode["type"];
  active: boolean;
  depth: number;
  parent: RenderNode | null;
  children: RenderNode[];
};

export function RenderNodeProbe(props: {
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
