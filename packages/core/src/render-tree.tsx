import * as React from "react";
import { createStore, useStore } from "./store";
import type { Store } from "./store";

/**
 * Each RenderTreeRoot creates a store that holds a RenderTree object.
 * Nodes register themselves in that store keyed by id.
 * Nodes know their parent (id), type, and active flag.
 *
 * Depth and active are derived on demand:
 * - depth counts how many ancestors share the same type (stack within stack, etc)
 * - active is shared across types and becomes false if any parent is inactive
 *
 * The id is either user-defined or generated (rc:type-1, rc:type-2, ...).
 * The root node has a constant id: "render-tree-root".
 *
 * Tree example (ids omitted):
 * stack-1 (type: stack, depth 1, active true)
 * └── screen-1 (type: screen, depth 1, active true)
 *     └── stack-2 (type: stack, depth 2, active true)
 *
 * Note: children are stored as ids.
 */

export type RenderTreeType = string;

export type RenderTreeOptions = {
  type: RenderTreeType;
  id?: string;
  active?: boolean;
};

export type RenderNode = {
  id: string;
  type: RenderTreeType;
  parentId: string | null;
  active: boolean;
  children: string[];
};

const RENDER_TREE_GENERATED_ID_PREFIX = "rt:";

const nextRenderTreeIdForType = (() => {
  const counters = new Map<RenderTreeType, number>();
  return (type: RenderTreeType) => {
    const next = (counters.get(type) ?? 0) + 1;
    counters.set(type, next);
    return `${RENDER_TREE_GENERATED_ID_PREFIX}${type}-${next}`;
  };
})();

export type RenderTree = {
  nodes: Map<string, RenderNode>;
};

export type RenderTreeDebugNode = {
  id: string;
  type: RenderTreeType;
  parentId: string | null;
  active: boolean;
  depth: number;
  children: RenderTreeDebugNode[];
};

export const RENDER_TREE_ROOT_ID = "render-tree-root";

function createRootNode(): RenderNode {
  return {
    id: RENDER_TREE_ROOT_ID,
    type: "root",
    parentId: null,
    active: true,
    children: [],
  };
}

function createRenderTree(nodes?: Map<string, RenderNode>): RenderTree {
  const nextNodes = nodes ? new Map(nodes) : new Map();
  if (!nextNodes.has(RENDER_TREE_ROOT_ID)) {
    nextNodes.set(RENDER_TREE_ROOT_ID, createRootNode());
  }
  return { nodes: nextNodes };
}

export function getRenderNode(
  chart: RenderTree,
  id: string,
): RenderNode | null {
  return chart.nodes.get(id) ?? null;
}

export function getRenderNodeParent(
  chart: RenderTree,
  id: string,
): RenderNode | null {
  const node = chart.nodes.get(id);
  if (!node?.parentId) {
    return null;
  }
  return chart.nodes.get(node.parentId) ?? null;
}

export function getRenderNodeChildren(
  chart: RenderTree,
  id: string,
): RenderNode[] {
  const node = chart.nodes.get(id);
  if (!node) {
    return [];
  }
  return node.children
    .map((childId) => chart.nodes.get(childId))
    .filter((child): child is RenderNode => Boolean(child));
}

export function getRenderNodeDepth(
  chart: RenderTree,
  id: string,
  type?: RenderTreeType,
) {
  const node = chart.nodes.get(id);
  if (!node) {
    return 0;
  }
  const targetType = type ?? node.type;
  let depth = 0;
  let current: RenderNode | undefined = node;
  while (current) {
    if (current.type === targetType) {
      depth += 1;
    }
    current = current.parentId ? chart.nodes.get(current.parentId) : undefined;
  }
  return depth;
}

export function getRenderNodeActive(chart: RenderTree, id: string) {
  const node = chart.nodes.get(id);
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

export function buildRenderTreeDebugTree(
  chart: RenderTree,
): RenderTreeDebugNode | null {
  const root = chart.nodes.get(RENDER_TREE_ROOT_ID);
  if (!root) {
    return null;
  }

  const visited = new Set<string>();

  const buildNode = (node: RenderNode): RenderTreeDebugNode => {
    if (visited.has(node.id)) {
      return {
        id: node.id,
        type: node.type,
        parentId: node.parentId,
        active: getRenderNodeActive(chart, node.id),
        depth: getRenderNodeDepth(chart, node.id),
        children: [],
      };
    }
    visited.add(node.id);

    return {
      id: node.id,
      type: node.type,
      parentId: node.parentId,
      active: getRenderNodeActive(chart, node.id),
      depth: getRenderNodeDepth(chart, node.id),
      children: node.children
        .map((childId) => chart.nodes.get(childId))
        .filter((child): child is RenderNode => Boolean(child))
        .map((child) => buildNode(child)),
    };
  };

  return buildNode(root);
}

export function logRenderTreeDebugTree(
  chart: RenderTree,
  label = "RenderTreeDebugTree",
) {
  const tree = buildRenderTreeDebugTree(chart);
  if (!tree) {
    return;
  }
  console.log(label, tree);
}

export const RenderTreeStoreContext =
  React.createContext<Store<RenderTree> | null>(null);

export const RenderNodeIdContext = React.createContext<string | null>(null);
export const RenderNodeTypeContext = React.createContext<RenderTreeType | null>(
  null,
);
// TODO: add coverage for node type context/hook wiring.

function registerRenderNode(
  store: Store<RenderTree>,
  nodeId: string,
  options: RenderTreeOptions,
  parentId: string | null,
) {
  store.setState((tree) => {
    const existing = tree.nodes.get(nodeId);
    const nextNode: RenderNode = {
      id: nodeId,
      type: options.type,
      parentId,
      active: options.active ?? true,
      children: existing ? existing.children : [],
    };

    const shouldUpdateParent = existing?.parentId !== parentId;
    const isSameNode = existing && areNodesEqual(existing, nextNode);
    if (isSameNode && !shouldUpdateParent) {
      return tree;
    }

    const nodes = new Map(tree.nodes);
    const previousParentId = existing?.parentId ?? null;

    nodes.set(nodeId, nextNode);
    ensureChildrenForParent(nodes, nodeId);
    if (previousParentId && previousParentId !== parentId) {
      removeChildFromParent(nodes, previousParentId, nodeId);
    }
    if (parentId) {
      addChildToParent(nodes, parentId, nodeId);
    }
    return createRenderTree(nodes);
  });
}

function unregisterRenderNode(store: Store<RenderTree>, nodeId: string) {
  store.setState((tree) => {
    if (!tree.nodes.has(nodeId)) {
      return tree;
    }
    const nodes = new Map(tree.nodes);
    const node = nodes.get(nodeId);
    if (!node) {
      return tree;
    }
    const subtreeIds = collectSubtreeIds(nodes, nodeId);
    subtreeIds.forEach((id) => {
      nodes.delete(id);
    });
    if (node.parentId) {
      removeChildFromParent(nodes, node.parentId, nodeId);
    }
    return createRenderTree(nodes);
  });
}

/**
 * Root provider for a render tree.
 *
 * Usage:
 * <RenderTreeRoot>
 *   <Stack />
 * </RenderTreeRoot>
 */
export type RenderTreeRootProps = {
  children: React.ReactNode;
  store?: Store<RenderTree>;
};

export type RenderTreeStore = Store<RenderTree>;

export function createRenderTreeStore(initial?: RenderTree): RenderTreeStore {
  return createStore(initial ? createRenderTree(initial.nodes) : createRenderTree());
}

export function RenderTreeRoot(props: RenderTreeRootProps) {
  const storeRef = React.useRef(createRenderTreeStore());
  const store = props.store ?? storeRef.current;

  return (
    <RenderTreeStoreContext.Provider value={store}>
      <RenderNodeIdContext.Provider value={RENDER_TREE_ROOT_ID}>
        <RenderNodeTypeContext.Provider value="root">
          {props.children}
        </RenderNodeTypeContext.Provider>
      </RenderNodeIdContext.Provider>
    </RenderTreeStoreContext.Provider>
  );
}

/**
 * Registers a node in the render tree.
 *
 * Usage:
 * <RenderNode type="stack">
 *   ...children...
 * </RenderNode>
 *
 * `active` defaults to true. Passing `active={false}` disables the subtree.
 * `id` is optional; if omitted, a stable id is generated.
 */
export function RenderTreeNode(
  props: RenderTreeOptions & {
    children: React.ReactNode;
  },
) {
  const store = React.useContext(RenderTreeStoreContext);
  const parentId = React.useContext(RenderNodeIdContext);
  const nodeIdRef = React.useRef(
    props.id ?? nextRenderTreeIdForType(props.type),
  );

  if (!store) {
    throw new Error("RenderTreeRoot is missing from the component tree.");
  }

  React.useLayoutEffect(() => {
    registerRenderNode(
      store,
      nodeIdRef.current,
      { type: props.type, active: props.active },
      parentId,
    );
  }, [store, props.type, props.active, parentId]);

  React.useEffect(
    () => () => unregisterRenderNode(store, nodeIdRef.current),
    [store],
  );

  return (
    <RenderNodeIdContext.Provider value={nodeIdRef.current}>
      <RenderNodeTypeContext.Provider value={props.type}>
        {props.children}
      </RenderNodeTypeContext.Provider>
    </RenderNodeIdContext.Provider>
  );
}

export function useRenderNode(): RenderNode | null {
  const store = React.useContext(RenderTreeStoreContext);
  const nodeId = React.useContext(RenderNodeIdContext);
  if (!store) {
    throw new Error("RenderTreeRoot is missing from the component tree.");
  }
  if (!nodeId) {
    throw new Error("RenderNode is missing from the component tree.");
  }
  const node = useStore(
    store,
    (state) => getRenderNode(state, nodeId),
    areRenderNodesEqual,
  );
  return node;
}

export function useRenderNodeId(): string {
  const store = React.useContext(RenderTreeStoreContext);
  const nodeId = React.useContext(RenderNodeIdContext);
  if (!store) {
    throw new Error("RenderTreeRoot is missing from the component tree.");
  }
  if (!nodeId) {
    throw new Error("RenderNode is missing from the component tree.");
  }
  return nodeId;
}

export function useRenderNodeIdOfType(type: RenderTreeType): string {
  const store = React.useContext(RenderTreeStoreContext);
  const nodeId = React.useContext(RenderNodeIdContext);
  if (!store) {
    throw new Error("RenderTreeRoot is missing from the component tree.");
  }
  if (!nodeId) {
    throw new Error("RenderNode is missing from the component tree.");
  }
  const match = useStore(store, (state) => {
    let current = getRenderNode(state, nodeId);
    while (current) {
      if (current.type === type) {
        return current.id;
      }
      if (!current.parentId) {
        return null;
      }
      current = getRenderNode(state, current.parentId);
    }
    return null;
  });
  if (!match) {
    throw new Error(`RenderNode of type "${type}" is missing.`);
  }
  return match;
}

export function useRenderNodeType(): RenderTreeType {
  const store = React.useContext(RenderTreeStoreContext);
  const type = React.useContext(RenderNodeTypeContext);
  if (!store) {
    throw new Error("RenderTreeRoot is missing from the component tree.");
  }
  if (!type) {
    throw new Error("RenderNode is missing from the component tree.");
  }
  return type;
}

/**
 * Select a slice of the current node's render tree.
 *
 * Usage:
 * const depth = useRenderTreeSelector((chart, id) =>
 *   getRenderNodeDepth(chart, id),
 * );
 */
export function useRenderTreeSelector<S>(
  selector: (chart: RenderTree, id: string) => S,
  isEqual?: (left: S, right: S) => boolean,
): S | null {
  const store = React.useContext(RenderTreeStoreContext);
  const nodeId = React.useContext(RenderNodeIdContext);
  if (!store) {
    throw new Error("RenderTreeRoot is missing from the component tree.");
  }
  if (!nodeId) {
    throw new Error("RenderNode is missing from the component tree.");
  }
  return useStore(
    store,
    (state) => {
      if (!state.nodes.has(nodeId)) {
        return null;
      }
      return selector(state, nodeId);
    },
    isEqual as typeof isEqual,
  );
}

function areRenderNodesEqual(
  left: RenderNode | null,
  right: RenderNode | null,
) {
  if (left === right) {
    return true;
  }
  if (!left || !right) {
    return false;
  }
  return areNodesEqual(left, right);
}

function areNodesEqual(left: RenderNode, right: RenderNode) {
  return (
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
  nodes: Map<string, RenderNode>,
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
  nodes: Map<string, RenderNode>,
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
  nodes: Map<string, RenderNode>,
  parentId: string,
) {
  const parent = nodes.get(parentId);
  if (!parent) {
    return;
  }
  const existing = new Set(parent.children);
  const nextChildren = parent.children.slice();
  nodes.forEach((node) => {
    if (node.parentId === parentId && !existing.has(node.id)) {
      nextChildren.push(node.id);
      existing.add(node.id);
    }
  });
  if (!areStringArraysEqual(parent.children, nextChildren)) {
    nodes.set(parentId, { ...parent, children: nextChildren });
  }
}

function collectSubtreeIds(nodes: Map<string, RenderNode>, rootId: string) {
  return collectSubtreeIdsFromRoots(nodes, [rootId]);
}

function collectSubtreeIdsFromRoots(
  nodes: Map<string, RenderNode>,
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
