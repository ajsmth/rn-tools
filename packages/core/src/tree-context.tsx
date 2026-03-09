import { Tree, createTree, RENDER_TREE_ROOT_ID } from "./tree";
import * as React from "react";

const TreeContext = React.createContext<Tree>(createTree());

type TreeProviderProps = {
  children: React.ReactNode;
  tree?: Tree;
};

export const TreeProvider = React.memo(function TreeProvider({
  children,
  tree = createTree(),
}: TreeProviderProps) {
  return <TreeContext.Provider value={tree}>{children}</TreeContext.Provider>;
});

type TreeNodeProps = {
  children: React.ReactNode;
  type: string;
  active?: boolean;
  id?: string;
};

export const NodeIdContext = React.createContext(RENDER_TREE_ROOT_ID);

export const TreeNode = React.memo(function TreeNode({
  children,
  type,
  active = true,
  id,
}: TreeNodeProps) {
  const tree = React.useContext(TreeContext);
  const parentId = React.useContext(NodeIdContext);
  const nodeId = React.useRef(tree.createId(type)).current;

  React.useEffect(() => {
    const node = tree.nodes[nodeId];

    if (node) {
      tree.updateNode(nodeId, {
        active,
        parentId,
        type,
        extraId: id,
      });
    } else {
      tree.addNode({
        id: nodeId,
        parentId,
        active,
        children: [],
        type,
        extraId: id,
      });
    }
  }, [parentId, active, type, id]);

  React.useEffect(() => {
    return () => {
      tree.removeNode(nodeId);
    };
  }, [tree]);

  return (
    <NodeIdContext.Provider value={nodeId}>{children}</NodeIdContext.Provider>
  );
});
