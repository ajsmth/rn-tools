export type Node = {
  id: string;
  type: string;
  parentId: string | null;
  active: boolean;
  extraId?: string | null;
  children: string[];
};

export const RENDER_TREE_ROOT_ID = "tree-root";

export type Tree = ReturnType<typeof createTree>;

export function createTree() {
  const rootNode = createRootNode();

  const counters: Record<string, number> = {};

  function createId(type: string) {
    if (!counters[type]) {
      counters[type] = 0;
    }

    return `${type}-node-${counters[type]++}`;
  }

  const nodes = {
    [rootNode.id]: rootNode,
  };

  const pending: Record<string, string[]> = {};

  function createRootNode(): Node {
    return {
      id: RENDER_TREE_ROOT_ID,
      type: "root",
      parentId: null,
      active: true,
      children: [],
    };
  }

  function getNode(id: string) {
    return nodes[id];
  }

  function addNode(node: Node) {
    nodes[node.id] = node;

    if (pending[node.id] != null) {
      nodes[node.id] = {
        ...node,
        children: unique([...node.children, ...pending[node.id]]),
      };

      delete pending[node.id];
    }

    const parent = nodes[node.parentId];

    if (!parent) {
      if (!pending[node.parentId]) {
        pending[node.parentId] = [];
      }

      const p = pending[node.parentId];
      if (!p.includes(node.id)) {
        pending[node.parentId] = [...p, node.id];
      }
    }

    if (parent && !parent.children.includes(node.id)) {
      nodes[node.parentId] = {
        ...parent,
        children: [...parent.children, node.id],
      };
    }
  }

  function updateNode(id: string, updates: Partial<Node>) {
    const node = nodes[id];

    if (node != null) {
      if (updates.parentId != null && updates.parentId !== node.parentId) {
        const previousParent = nodes[node.parentId];

        if (previousParent != null && updates.parentId !== previousParent.id) {
          previousParent.children = previousParent.children.filter(
            (child) => child !== id,
          );
        }

        const nextParent = nodes[updates.parentId];
        if (nextParent != null && !nextParent.children.includes(id)) {
          nextParent.children = [...nextParent.children, id];
        }
      }

      nodes[id] = {
        ...node,
        ...updates,
      };
    }
  }

  function removeNode(id: string) {
    const node = nodes[id];

    if (node != null) {
      for (const childId of node.children) {
        const child = nodes[childId];

        if (child != null) {
          nodes[childId] = {
            ...child,
            parentId: null,
          };
        }
      }

      const parent = nodes[node.parentId];

      if (parent != null && parent.children.includes(id)) {
        nodes[node.parentId] = {
          ...parent,
          children: parent.children.filter((c) => c !== id),
        };
      }

      delete nodes[id];
    }
  }

  function getActiveNode(type: string): Node | undefined {
    let best: Node | undefined = undefined;
    let bestDepth = -1;

    function walk(nodeId: string, depth: number) {
      const node = nodes[nodeId];
      if (!node || !node.active) return;

      if (node.type === type && depth > bestDepth) {
        best = node;
        bestDepth = depth;
      }

      if (node.children != null) {
        for (const childId of node.children) {
          walk(childId, depth + 1);
        }
      }
    }

    walk(RENDER_TREE_ROOT_ID, 0);

    return best;
  }

  return {
    get nodes() {
      return nodes;
    },
    getNode,
    addNode,
    updateNode,
    removeNode,
    getActiveNode,
    createId,
  };
}

function unique(arr: string[]) {
  return Array.from(new Set(arr));
}
