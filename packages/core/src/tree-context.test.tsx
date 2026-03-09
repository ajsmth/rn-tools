import { TreeProvider, TreeNode } from "./tree-context";
import { RENDER_TREE_ROOT_ID, createTree } from "./tree";
import { Text } from "react-native";
import { render } from "@testing-library/react-native";

describe("TreeContext", () => {
  test("render", () => {
    const tree = createTree();
    const testNodeType = "my-node";

    function TestTree() {
      return (
        <TreeProvider tree={tree}>
          <TreeNode type={testNodeType}>
            <Text>Node 1</Text>
          </TreeNode>
        </TreeProvider>
      );
    }

    render(<TestTree />);
    const node = tree.getActiveNode(testNodeType);
    expect(node).toBeDefined();
    expect(node.parentId).toEqual(RENDER_TREE_ROOT_ID);
  });

  test("unmounting removes nodes from tree", () => {
    const tree = createTree();
    const testNodeType = "my-node";

    function TestTree({ showSecond = true }) {
      return (
        <TreeProvider tree={tree}>
          <TreeNode type={testNodeType}>
            <Text>Node 1</Text>
          </TreeNode>
          {showSecond && (
            <TreeNode type={testNodeType}>
              <Text>Node 2</Text>
            </TreeNode>
          )}
        </TreeProvider>
      );
    }

    const { rerender } = render(<TestTree />);
    rerender(<TestTree showSecond={false} />);

    expect(tree.getNode(`${testNodeType}-node-1`)).toBeUndefined();
    expect(tree.getActiveNode(testNodeType).id).toEqual(
      `${testNodeType}-node-0`,
    );
  });

  test("nodes are reattached to the right parent", async () => {
    const tree = createTree();
    const testNodeType = "my-node";

    function TestTree({ changeParent = false }) {
      const inner = (
        <TreeNode type="inner">
          <Text>Inner</Text>
        </TreeNode>
      );

      return (
        <TreeProvider tree={tree}>
          <TreeNode type={testNodeType}>{!changeParent && inner}</TreeNode>
          <TreeNode type={testNodeType}>{changeParent && inner}</TreeNode>
        </TreeProvider>
      );
    }

    const { rerender } = render(<TestTree />);

    let innerNode = tree.getActiveNode("inner");
    expect(innerNode?.parentId).toEqual(`${testNodeType}-node-0`);

    rerender(<TestTree changeParent />);

    innerNode = tree.getActiveNode("inner");
    expect(innerNode.parentId).toEqual(`${testNodeType}-node-1`);
  });
});
