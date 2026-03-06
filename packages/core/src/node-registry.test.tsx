import { Text } from "react-native";
import {
  NodeRegistryItem,
  NodeRegistryProvider,
  createNodeRegistry,
} from "./node-registry";
import { render } from "@testing-library/react-native";
import { TreeNode, TreeProvider } from "./tree-context";

describe("createNodeRegistry()", () => {
  test("setting nodes", () => {
    const registry = createNodeRegistry();
    registry.setNode("1", "2");
    expect(registry.nodes["1"]).toEqual("2");
  });

  test("registry provider", () => {
    const registry = createNodeRegistry();

    function TestApp() {
      return (
        <TreeProvider>
          <NodeRegistryProvider registry={registry}>
            <TreeNode type="test">
              <NodeRegistryItem id="test">
                <Text>Hi</Text>
              </NodeRegistryItem>
            </TreeNode>
          </NodeRegistryProvider>
        </TreeProvider>
      );
    }

    render(<TestApp />);

    const [node] = Object.keys(registry.nodes);
    expect(node).toBeDefined();
    expect(registry.nodes[node]).toEqual("test");
  });
});
