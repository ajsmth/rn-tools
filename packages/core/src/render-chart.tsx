import * as React from "react";
import { Store, useStore } from "./store";

/**
 * Each RenderChartRoot creates a store that holds a RenderChart object.
 * Nodes register themselves in that store keyed by instance id.
 * Nodes know their parent (instance id), type, and active flag.
 *
 * Depth and active are derived:
 * - depth counts how many ancestors share the same type (stack within stack, etc)
 * - active is shared across types and becomes false if any parent is inactive
 *
 * The instance id is internal and always present (type-1, type-2, ...).
 * The optional "id" is user-defined and used for imperative APIs.
 * The root node has a constant instance id: "render-chart-root".
 *
 * Tree example (ids omitted):
 * stack-1 (type: stack, depth 1, active true)
 * └── screen-1 (type: screen, depth 1, active true)
 *     └── stack-2 (type: stack, depth 2, active true)
 *
 * Note: children are stored as instance ids, with helpers that surface user ids
 * when present.
 */

export type RenderChartType = string;

export type RenderChartOptions = {
  type: RenderChartType;
  id?: string;
  active?: boolean;
};

type RenderChartNode = {
  instanceId: string;
  id?: string;
  type: RenderChartType;
  parentId: string | null;
  activeSelf: boolean;
  active: boolean;
  depth: number;
  children: string[];
};

const nextRenderChartIdForType = (() => {
  const counters = new Map<RenderChartType, number>();
  return (type: RenderChartType) => {
    const next = (counters.get(type) ?? 0) + 1;
    counters.set(type, next);
    return `${type}-${next}`;
  };
})();

export function createRenderChartId(type: RenderChartType) {
  return nextRenderChartIdForType(type);
}

export type RenderChartNodeView = {
  instanceId: string;
  id?: string;
  type: RenderChartType;
  depth: number;
  active: boolean;
  parentId: string | null;
  children: string[];
  getParent: () => RenderChartNodeView | null;
  getChildren: () => RenderChartNodeView[];
};

export type RenderChart = {
  nodes: Map<string, RenderChartNode>;
};

export const RENDER_CHART_ROOT_ID = "render-chart-root";

function createRootNode(): RenderChartNode {
  return {
    instanceId: RENDER_CHART_ROOT_ID,
    type: "root",
    parentId: null,
    activeSelf: true,
    active: true,
    depth: 1,
    children: [],
  };
}

function createRenderChart(nodes?: Map<string, RenderChartNode>): RenderChart {
  const nextNodes = nodes ? new Map(nodes) : new Map();
  if (!nextNodes.has(RENDER_CHART_ROOT_ID)) {
    nextNodes.set(RENDER_CHART_ROOT_ID, createRootNode());
  }
  return { nodes: nextNodes };
}

function getRenderChartNode(
  chart: RenderChart,
  instanceId: string,
): RenderChartNodeView | null {
  const node = chart.nodes.get(instanceId);
  return node ? buildRenderChartNodeView(chart, node) : null;
}

function buildRenderChartNodeView(
  chart: RenderChart,
  node: RenderChartNode,
): RenderChartNodeView {
  return {
    instanceId: node.instanceId,
    id: node.id,
    type: node.type,
    parentId: node.parentId,
    children: node.children,
    depth: node.depth,
    active: node.active,
    getParent: () => {
      if (!node.parentId) {
        return null;
      }
      return getRenderChartNode(chart, node.parentId);
    },
    getChildren: () =>
      node.children
        .map((childId) => getRenderChartNode(chart, childId))
        .filter((child): child is RenderChartNodeView => Boolean(child)),
  };
}

export const RenderChartStoreContext =
  React.createContext<Store<RenderChart> | null>(null);

export const RenderChartNodeInstanceIdContext = React.createContext<
  string | null
>(
  null,
);

export const RenderChartNodeViewContext =
  React.createContext<RenderChartNodeView | null>(null);

function countDepthFromParent(
  parent: RenderChartNodeView | null,
  type: RenderChartType,
) {
  let depth = 0;
  let current = parent;
  while (current) {
    if (current.type === type) {
      depth += 1;
    }
    current = current.getParent();
  }
  return depth;
}

function buildOptimisticNodeView(
  input: {
    instanceId: string;
    id?: string;
    type: RenderChartType;
    activeSelf: boolean;
    parentId: string | null;
  },
  parentView: RenderChartNodeView | null,
): RenderChartNodeView {
  const depth = countDepthFromParent(parentView, input.type) + 1;
  const active = input.activeSelf && (parentView?.active ?? true);

  return {
    instanceId: input.instanceId,
    id: input.id,
    type: input.type,
    parentId: input.parentId,
    children: [],
    depth,
    active,
    getParent: () => parentView,
    getChildren: () => [],
  };
}

function countDepthForType(
  nodes: Map<string, RenderChartNode>,
  node: RenderChartNode,
) {
  let depth = 0;
  let current: RenderChartNode | undefined = node;
  while (current) {
    if (current.type === node.type) {
      depth += 1;
    }
    current = current.parentId ? nodes.get(current.parentId) : undefined;
  }
  return depth;
}

function computeActive(
  nodes: Map<string, RenderChartNode>,
  node: RenderChartNode,
) {
  let active = node.activeSelf;
  let currentId = node.parentId;
  while (currentId) {
    const current = nodes.get(currentId);
    if (!current) {
      break;
    }
    active = active && current.activeSelf;
    currentId = current.parentId;
  }
  return active;
}

function registerRenderChartNode(
  store: Store<RenderChart>,
  instanceId: string,
  options: RenderChartOptions,
  parentId: string | null,
) {
  store.setState((chart) => {
    const existing = chart.nodes.get(instanceId);
    const nextNode: RenderChartNode = {
      instanceId,
      id: options.id,
      type: options.type,
      parentId,
      activeSelf: options.active ?? true,
      active: existing?.active ?? true,
      depth: existing?.depth ?? 1,
      children: existing ? existing.children : [],
    };

    const shouldUpdateParent = existing?.parentId !== parentId;
    const isSameNode = existing && areNodesEqual(existing, nextNode);
    if (isSameNode && !shouldUpdateParent) {
      return chart;
    }

    const nodes = new Map(chart.nodes);
    const previousParentId = existing?.parentId ?? null;

    nodes.set(instanceId, nextNode);
    if (previousParentId && previousParentId !== parentId) {
      refreshChildrenForParent(nodes, previousParentId);
    }
    if (parentId) {
      refreshChildrenForParent(nodes, parentId);
    }
    refreshChildrenForParent(nodes, instanceId);
    const affectedIds = collectSubtreeIds(nodes, instanceId);
    const nextNodes = recomputeDerivedForIds(nodes, affectedIds);
    return createRenderChart(nextNodes);
  });
}

function unregisterRenderChartNode(
  store: Store<RenderChart>,
  instanceId: string,
) {
  store.setState((chart) => {
    if (!chart.nodes.has(instanceId)) {
      return chart;
    }
    const nodes = new Map(chart.nodes);
    const node = nodes.get(instanceId);
    const affectedRoots = node ? node.children.slice() : [];
    nodes.delete(instanceId);
    if (node?.parentId) {
      const parent = nodes.get(node.parentId);
      if (parent) {
        nodes.set(node.parentId, {
          ...parent,
          children: parent.children.filter((childId) => childId !== instanceId),
        });
      }
    }
    const affectedIds = collectSubtreeIdsFromRoots(nodes, affectedRoots);
    const nextNodes = recomputeDerivedForIds(nodes, affectedIds);
    return createRenderChart(nextNodes);
  });
}

/**
 * Root provider for a render chart tree.
 *
 * Usage:
 * <RenderChartRoot>
 *   <Stack />
 * </RenderChartRoot>
 */
export type RenderChartRootProps = {
  children: React.ReactNode;
  store?: Store<RenderChart>;
};

export function createRenderChartStore(initial?: RenderChart) {
  const chart = initial
    ? createRenderChart(initial.nodes)
    : createRenderChart();
  return new Store(chart);
}

export function RenderChartRoot(props: RenderChartRootProps) {
  const storeRef = React.useRef(createRenderChartStore());
  const store = props.store ?? storeRef.current;

  return (
    <RenderChartStoreContext.Provider value={store}>
      <RenderChartNodeInstanceIdContext.Provider value={RENDER_CHART_ROOT_ID}>
        {props.children}
      </RenderChartNodeInstanceIdContext.Provider>
    </RenderChartStoreContext.Provider>
  );
}

/**
 * Registers a node in the render chart tree.
 *
 * Usage:
 * <RenderChartNode type="stack">
 *   ...children...
 * </RenderChartNode>
 *
 * `active` defaults to true. Passing `active={false}` disables the subtree.
 * `id` is optional and used for user-facing lookups or imperative APIs.
 */
export function RenderChartNode(
  props: RenderChartOptions & {
    children: React.ReactNode;
  },
) {
  const store = React.useContext(RenderChartStoreContext);
  const parentId = React.useContext(RenderChartNodeInstanceIdContext);
  const parentView = React.useContext(RenderChartNodeViewContext);
  const instanceIdRef = React.useRef(nextRenderChartIdForType(props.type));

  if (!store) {
    throw new Error("RenderChartRoot is missing from the component tree.");
  }

  const optimisticView = React.useMemo(
    () =>
      buildOptimisticNodeView(
        {
          instanceId: instanceIdRef.current,
          type: props.type,
          id: props.id,
          activeSelf: props.active ?? true,
          parentId,
        },
        parentView,
      ),
    [props.type, props.id, props.active, parentId, parentView],
  );

  React.useLayoutEffect(() => {
    registerRenderChartNode(store, instanceIdRef.current, props, parentId);
  }, [store, props.type, props.id, props.active, parentId]);

  React.useEffect(
    () => () => unregisterRenderChartNode(store, instanceIdRef.current),
    [store],
  );

  const chart = useStore(
    store,
    (state) => getRenderChartNode(state, instanceIdRef.current),
    areRenderChartsEqual,
  );

  const resolvedChart =
    chart && areRenderChartsEqual(chart, optimisticView)
      ? optimisticView
      : chart ?? optimisticView;

  return (
    <RenderChartNodeInstanceIdContext.Provider value={instanceIdRef.current}>
      <RenderChartNodeViewContext.Provider value={resolvedChart}>
        {props.children}
      </RenderChartNodeViewContext.Provider>
    </RenderChartNodeInstanceIdContext.Provider>
  );
}

export function useRenderChartNode() {
  const store = React.useContext(RenderChartStoreContext);
  const instanceId = React.useContext(RenderChartNodeInstanceIdContext);
  const fallback = React.useContext(RenderChartNodeViewContext);
  if (!store) {
    throw new Error("RenderChartRoot is missing from the component tree.");
  }
  if (!instanceId) {
    throw new Error("RenderChartNode is missing from the component tree.");
  }
  const node = useStore(
    store,
    (state) => getRenderChartNode(state, instanceId),
    areRenderChartsEqual,
  );
  if (node) {
    return node;
  }
  if (fallback && fallback.instanceId === instanceId) {
    return fallback;
  }
  throw new Error("RenderChartNode is missing from the component tree.");
}

/**
 * Select a slice of the current node's render chart.
 *
 * Usage:
 * const depth = useRenderChartSelector((chart) => chart.depth);
 */
export function useRenderChartSelector<S>(
  selector: (chart: RenderChartNodeView) => S,
  isEqual?: (left: S, right: S) => boolean,
) {
  const store = React.useContext(RenderChartStoreContext);
  const instanceId = React.useContext(RenderChartNodeInstanceIdContext);
  const fallback = React.useContext(RenderChartNodeViewContext);
  if (!store) {
    throw new Error("RenderChartRoot is missing from the component tree.");
  }
  if (!instanceId) {
    throw new Error("RenderChartNode is missing from the component tree.");
  }
  return useStore(
    store,
    (state) => {
      const chart = getRenderChartNode(state, instanceId);
      if (chart) {
        return selector(chart);
      }
      if (fallback && fallback.instanceId === instanceId) {
        return selector(fallback);
      }
      throw new Error("RenderChartNode is missing from the component tree.");
    },
    isEqual,
  );
}

function areRenderChartsEqual(
  left: RenderChartNodeView | null,
  right: RenderChartNodeView | null,
) {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return (
    left.instanceId === right.instanceId &&
    left.id === right.id &&
    left.type === right.type &&
    left.depth === right.depth &&
    left.active === right.active &&
    left.parentId === right.parentId &&
    areStringArraysEqual(left.children, right.children)
  );
}

function areNodesEqual(left: RenderChartNode, right: RenderChartNode) {
  return (
    left.instanceId === right.instanceId &&
    left.id === right.id &&
    left.type === right.type &&
    left.parentId === right.parentId &&
    left.activeSelf === right.activeSelf &&
    areStringArraysEqual(left.children, right.children)
  );
}

function areStringArraysEqual(left: string[], right: string[]) {
  if (left === right) {
    return true;
  }
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index += 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

function refreshChildrenForParent(
  nodes: Map<string, RenderChartNode>,
  parentId: string,
) {
  const parent = nodes.get(parentId);
  if (!parent) {
    return;
  }
  const nextChildren: string[] = [];
  nodes.forEach((node) => {
    if (node.parentId === parentId) {
      nextChildren.push(node.instanceId);
    }
  });
  if (!areStringArraysEqual(parent.children, nextChildren)) {
    nodes.set(parentId, { ...parent, children: nextChildren });
  }
}

function recomputeDerivedForIds(
  nodes: Map<string, RenderChartNode>,
  ids: string[],
) {
  if (ids.length === 0) {
    return nodes;
  }
  const nextNodes = new Map(nodes);
  ids.forEach((id) => {
    const node = nextNodes.get(id);
    if (!node) {
      return;
    }
    const depth = countDepthForType(nextNodes, node);
    const active = computeActive(nextNodes, node);
    if (node.depth === depth && node.active === active) {
      return;
    }
    nextNodes.set(id, { ...node, depth, active });
  });
  return nextNodes;
}

function collectSubtreeIds(
  nodes: Map<string, RenderChartNode>,
  rootId: string,
) {
  return collectSubtreeIdsFromRoots(nodes, [rootId]);
}

function collectSubtreeIdsFromRoots(
  nodes: Map<string, RenderChartNode>,
  rootIds: string[],
) {
  const visited = new Set<string>();
  const stack = [...rootIds];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || visited.has(currentId)) {
      continue;
    }
    visited.add(currentId);
    const node = nodes.get(currentId);
    if (!node) {
      continue;
    }
    node.children.forEach((childId) => {
      if (!visited.has(childId)) {
        stack.push(childId);
      }
    });
  }

  return Array.from(visited);
}
