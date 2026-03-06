import { createTree, RENDER_TREE_ROOT_ID } from "./tree";

describe("createTree()", () => {
  test.todo(
    "getRenderNodeActive can retrieve the active node id for a given node type",
  );

  test("works", () => {
    const tree = createTree();
    expect(tree).toBeDefined();
  });

  test("creates a tree with a root node", () => {
    const tree = createTree();
    expect(tree.nodes[RENDER_TREE_ROOT_ID]).toBeDefined();
  });

  test("can add a node", () => {
    const tree = createTree();

    tree.addNode({
      id: "1",
      type: "test",
      active: true,
      children: [],
      parentId: null,
    });

    expect(tree.nodes["1"]).toBeDefined();
  });

  test("can retrieve a node by id", () => {
    const tree = createTree();

    tree.addNode({
      id: "1",
      type: "test",
      active: true,
      children: [],
      parentId: null,
    });

    const node = tree.getNode("1");

    expect(node).toEqual(
      expect.objectContaining({
        id: "1",
        type: "test",
      }),
    );
  });

  test("can update node", () => {
    const tree = createTree();

    tree.addNode({
      id: "1",
      type: "test",
      children: [],
      parentId: null,
      active: true,
    });

    tree.updateNode("1", { parentId: RENDER_TREE_ROOT_ID });

    expect(tree.nodes["1"].parentId).toEqual(RENDER_TREE_ROOT_ID);
  });

  test("reparenting a node", () => {
    const tree = createTree();

    tree.addNode({
      id: "1",
      type: "test",
      children: [],
      parentId: RENDER_TREE_ROOT_ID,
      active: true,
    });

    tree.addNode({
      id: "2",
      type: "test",
      children: [],
      parentId: RENDER_TREE_ROOT_ID,
      active: true,
    });

    tree.updateNode("1", { parentId: "2" });

    const root = tree.getNode(RENDER_TREE_ROOT_ID);
    expect(root.children.includes("1")).toEqual(false);
    expect(root.children.includes("2")).toEqual(true);

    const node1 = tree.getNode("1");
    const node2 = tree.getNode("2");

    expect(node1.parentId).toEqual(node2.id);
    expect(node2.children.includes(node1.id)).toEqual(true);
  });

  function createTestNode(
    id: string,
    type: string,
    parentId = RENDER_TREE_ROOT_ID,
    children = [],
  ) {
    return {
      id,
      type,
      active: true,
      children,
      parentId,
    };
  }

  test("getActiveNode by type", () => {
    const tree = createTree();

    tree.addNode(createTestNode("1", "stack"));
    tree.addNode(createTestNode("2", "tabs"));
    tree.addNode(createTestNode("3", "stack", "2"));

    const activeNode = tree.getActiveNode("stack");

    expect(activeNode?.id).toEqual("3");
  });

  test("getActiveNode uses the active path", () => {
    const tree = createTree();

    tree.addNode(createTestNode("1", "modal"));
    tree.addNode(createTestNode("2", "modal", "1"));
    tree.addNode(createTestNode("3", "modal", "2"));
    tree.addNode(createTestNode("4", "test", "2"));
    tree.addNode(createTestNode("5", "modal", "3"));

    tree.updateNode("5", { active: false });

    let activeNode = tree.getActiveNode("modal");
    expect(activeNode.id).toEqual("3");

    tree.updateNode("2", { active: false });
    activeNode = tree.getActiveNode("modal");
    expect(activeNode.id).toEqual("1");

    tree.updateNode("2", { active: true });
    activeNode = tree.getActiveNode("modal");
    expect(activeNode.id).toEqual("3");

    tree.updateNode("5", { active: true });
    activeNode = tree.getActiveNode("modal");
    expect(activeNode.id).toEqual("5");
  });

  test("active path is not tied to the type of the node", () => {
    const tree = createTree();

    tree.addNode(createTestNode("1", "modal"));
    tree.addNode(createTestNode("2", "modal", "1"));
    tree.addNode(createTestNode("3", "modal", "2"));
    tree.addNode(createTestNode("4", "test", "2"));
    tree.addNode(createTestNode("5", "modal", "4"));

    tree.updateNode("4", { active: false });
    let activeNode = tree.getActiveNode("modal");
    expect(activeNode.id).toEqual("3");
  });

  test("generating ids for node types", () => {
    const tree = createTree();
    const id1 = tree.createId("test");
    const id2 = tree.createId("test");
    const id3 = tree.createId("different");

    expect(id1).toEqual("test-node-0");
    expect(id2).toEqual("test-node-1");
    expect(id3).toEqual("different-node-0");
  });

  test("removeNode removes the node", () => {
    const tree = createTree();

    tree.addNode(createTestNode("1", "test"));
    tree.addNode(createTestNode("2", "test"));
    tree.addNode(createTestNode("3", "test"));

    tree.removeNode("1");
    expect(tree.getNode("1")).toBeUndefined();
  });

  test("removeNode removes parentId", () => {
    const tree = createTree();

    tree.addNode(createTestNode("1", "test"));
    tree.addNode(createTestNode("2", "test", "1"));

    tree.removeNode("1");
    const node = tree.getNode("2");
    expect(node.parentId).toEqual(null);
  });

  test("removeNode removes child from parent", () => {
    const tree = createTree();

    tree.addNode(createTestNode("1", "test"));
    tree.addNode(createTestNode("2", "test"));

    tree.removeNode("1");

    const node = tree.getNode(RENDER_TREE_ROOT_ID);
    expect(node.children.length).toEqual(1);
  });
});
