import { NodeIdContext } from "./tree-context";
import * as React from "react";

type NodeRegistry = ReturnType<typeof createNodeRegistry>;

export function createNodeRegistry() {
  const nodes: Record<string, string> = {};

  function setNode(nodeId: string, entryId: string) {
    nodes[nodeId] = entryId;
  }

  return {
    setNode,
    get nodes() {
      return nodes;
    },
  };
}

type NodeRegistryProviderProps = {
  children: React.ReactNode;
  registry: NodeRegistry;
};

const NodeRegistryContext =
  React.createContext<NodeRegistry>(createNodeRegistry());

export const NodeRegistryProvider = React.memo(function NodeRegistryProvider(
  props: NodeRegistryProviderProps,
) {
  const { children, registry } = props;
  return (
    <NodeRegistryContext.Provider value={registry}>
      {children}
    </NodeRegistryContext.Provider>
  );
});

type NodeRegistryItemProps = {
  id: string;
  children: React.ReactNode;
};

export const NodeRegistryItem = React.memo(function NodeRegistryItem(
  props: NodeRegistryItemProps,
) {
  const { id, children } = props;
  const nodeId = React.useContext(NodeIdContext);
  const registry = React.useContext(NodeRegistryContext);

  React.useEffect(() => {
    if (nodeId != null && id != null) {
      registry.setNode(nodeId, id);
    }
  }, [registry, nodeId, id]);

  return <React.Fragment>{children}</React.Fragment>;
});
