import * as React from "react";
import { Store, useStore } from "./store";

/**
 * Each RenderChartRoot creates a store that holds a RenderChart object.
 * Nodes register themselves in that store keyed by instance id.
 * Nodes know their parent (instance id), type, and active flag.
 *
 * Depth and active are derived on demand:
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
  active: boolean;
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

export type RenderChart = {
  nodes: Map<string, RenderChartNode>;
};

export type RenderChartDebugNode = {
  instanceId: string;
  id?: string;
  type: RenderChartType;
  parentId: string | null;
  active: boolean;
  depth: number;
  children: RenderChartDebugNode[];
};

export const RENDER_CHART_ROOT_ID = "render-chart-root";

function createRootNode(): RenderChartNode {
  return {
    instanceId: RENDER_CHART_ROOT_ID,
    type: "root",
    parentId: null,
    active: true,
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

export function getRenderChartNode(
  chart: RenderChart,
  instanceId: string,
): RenderChartNode | null {
  return chart.nodes.get(instanceId) ?? null;
}

export function getRenderChartNodeParent(
  chart: RenderChart,
  instanceId: string,
): RenderChartNode | null {
  const node = chart.nodes.get(instanceId);
  if (!node?.parentId) {
    return null;
  }
  return chart.nodes.get(node.parentId) ?? null;
}

export function getRenderChartNodeChildren(
  chart: RenderChart,
  instanceId: string,
): RenderChartNode[] {
  const node = chart.nodes.get(instanceId);
  if (!node) {
    return [];
  }
  return node.children
    .map((childId) => chart.nodes.get(childId))
    .filter((child): child is RenderChartNode => Boolean(child));
}

export function getRenderChartNodeDepth(
  chart: RenderChart,
  instanceId: string,
  type?: RenderChartType,
) {
  const node = chart.nodes.get(instanceId);
  if (!node) {
    return 0;
  }
  const targetType = type ?? node.type;
  let depth = 0;
  let current: RenderChartNode | undefined = node;
  while (current) {
    if (current.type === targetType) {
      depth += 1;
    }
    current = current.parentId ? chart.nodes.get(current.parentId) : undefined;
  }
  return depth;
}

export function getRenderChartNodeActive(
  chart: RenderChart,
  instanceId: string,
) {
  const node = chart.nodes.get(instanceId);
  if (!node) {
    return false;
  }
  let active = node.active;
  let currentId = node.parentId;
  while (currentId) {
    const current = chart.nodes.get(currentId);
    if (!current) {
      break;
    }
    active = active && current.active;
    currentId = current.parentId;
  }
  return active;
}

export function buildRenderChartDebugTree(
  chart: RenderChart,
): RenderChartDebugNode | null {
  const root = chart.nodes.get(RENDER_CHART_ROOT_ID);
  if (!root) {
    return null;
  }

  const visited = new Set<string>();

  const buildNode = (node: RenderChartNode): RenderChartDebugNode => {
    if (visited.has(node.instanceId)) {
      return {
        instanceId: node.instanceId,
        id: node.id,
        type: node.type,
        parentId: node.parentId,
        active: getRenderChartNodeActive(chart, node.instanceId),
        depth: getRenderChartNodeDepth(chart, node.instanceId),
        children: [],
      };
    }
    visited.add(node.instanceId);

    return {
      instanceId: node.instanceId,
      id: node.id,
      type: node.type,
      parentId: node.parentId,
      active: getRenderChartNodeActive(chart, node.instanceId),
      depth: getRenderChartNodeDepth(chart, node.instanceId),
      children: node.children
        .map((childId) => chart.nodes.get(childId))
        .filter((child): child is RenderChartNode => Boolean(child))
        .map((child) => buildNode(child)),
    };
  };

  return buildNode(root);
}

export function logRenderChartDebugTree(
  chart: RenderChart,
  label = "RenderChartDebugTree",
) {
  const tree = buildRenderChartDebugTree(chart);
  if (!tree) {
    return;
  }
  console.log(label, tree);
}

export const RenderChartStoreContext =
  React.createContext<Store<RenderChart> | null>(null);

export const RenderChartNodeInstanceIdContext = React.createContext<
  string | null
>(null);

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
      active: options.active ?? true,
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
    ensureChildrenForParent(nodes, instanceId);
    if (previousParentId && previousParentId !== parentId) {
      removeChildFromParent(nodes, previousParentId, instanceId);
    }
    if (parentId) {
      addChildToParent(nodes, parentId, instanceId);
    }
    return createRenderChart(nodes);
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
    if (!node) {
      return chart;
    }
    const subtreeIds = collectSubtreeIds(nodes, instanceId);
    subtreeIds.forEach((id) => {
      nodes.delete(id);
    });
    if (node.parentId) {
      removeChildFromParent(nodes, node.parentId, instanceId);
    }
    return createRenderChart(nodes);
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
  const instanceIdRef = React.useRef(nextRenderChartIdForType(props.type));

  if (!store) {
    throw new Error("RenderChartRoot is missing from the component tree.");
  }

  React.useLayoutEffect(() => {
    registerRenderChartNode(store, instanceIdRef.current, props, parentId);
  }, [store, props.type, props.id, props.active, parentId]);

  React.useEffect(
    () => () => unregisterRenderChartNode(store, instanceIdRef.current),
    [store],
  );

  return (
    <RenderChartNodeInstanceIdContext.Provider value={instanceIdRef.current}>
      {props.children}
    </RenderChartNodeInstanceIdContext.Provider>
  );
}

export function useRenderChartNode(): RenderChartNode | null {
  const store = React.useContext(RenderChartStoreContext);
  const instanceId = React.useContext(RenderChartNodeInstanceIdContext);
  if (!store) {
    throw new Error("RenderChartRoot is missing from the component tree.");
  }
  if (!instanceId) {
    throw new Error("RenderChartNode is missing from the component tree.");
  }
  const node = useStore(
    store,
    (state) => getRenderChartNode(state, instanceId),
    areRenderChartNodesEqual,
  );
  return node;
}

/**
 * Select a slice of the current node's render chart.
 *
 * Usage:
 * const depth = useRenderChartSelector((chart, id) =>
 *   getRenderChartNodeDepth(chart, id),
 * );
 */
export function useRenderChartSelector<S>(
  selector: (chart: RenderChart, instanceId: string) => S,
  isEqual?: (left: S, right: S) => boolean,
): S | null {
  const store = React.useContext(RenderChartStoreContext);
  const instanceId = React.useContext(RenderChartNodeInstanceIdContext);
  if (!store) {
    throw new Error("RenderChartRoot is missing from the component tree.");
  }
  if (!instanceId) {
    throw new Error("RenderChartNode is missing from the component tree.");
  }
  return useStore(
    store,
    (state) => {
      if (!state.nodes.has(instanceId)) {
        return null;
      }
      return selector(state, instanceId);
    },
    isEqual as typeof isEqual,
  );
}

function areRenderChartNodesEqual(
  left: RenderChartNode | null,
  right: RenderChartNode | null,
) {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return areNodesEqual(left, right);
}

function areNodesEqual(left: RenderChartNode, right: RenderChartNode) {
  return (
    left.instanceId === right.instanceId &&
    left.id === right.id &&
    left.type === right.type &&
    left.parentId === right.parentId &&
    left.active === right.active &&
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

function addChildToParent(
  nodes: Map<string, RenderChartNode>,
  parentId: string,
  childId: string,
) {
  const parent = nodes.get(parentId);
  if (!parent) {
    return;
  }
  if (parent.children.includes(childId)) {
    return;
  }
  nodes.set(parentId, {
    ...parent,
    children: [...parent.children, childId],
  });
}

function removeChildFromParent(
  nodes: Map<string, RenderChartNode>,
  parentId: string,
  childId: string,
) {
  const parent = nodes.get(parentId);
  if (!parent) {
    return;
  }
  if (!parent.children.includes(childId)) {
    return;
  }
  nodes.set(parentId, {
    ...parent,
    children: parent.children.filter((id) => id !== childId),
  });
}

function ensureChildrenForParent(
  nodes: Map<string, RenderChartNode>,
  parentId: string,
) {
  const parent = nodes.get(parentId);
  if (!parent) {
    return;
  }
  const existing = new Set(parent.children);
  const nextChildren = parent.children.slice();
  nodes.forEach((node) => {
    if (node.parentId === parentId && !existing.has(node.instanceId)) {
      nextChildren.push(node.instanceId);
      existing.add(node.instanceId);
    }
  });
  if (!areStringArraysEqual(parent.children, nextChildren)) {
    nodes.set(parentId, { ...parent, children: nextChildren });
  }
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
