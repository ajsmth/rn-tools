import type { NavigationState, RenderCharts } from "~/types";

import { reducer, type NavigationAction } from "../navigation-reducer";
import { serializeTabIndexKey } from "../utils";

describe("reducer", () => {
  let initialState: NavigationState = {
    stacks: {
      ids: [],
      lookup: {},
    },
    screens: {
      ids: [],
      lookup: {},
    },
    tabs: {
      ids: [],
      lookup: {},
    },
    debugModeEnabled: false,
  };

  let renderCharts: RenderCharts = {
    stacksByDepth: {},
    tabsByDepth: {},
    tabParentsById: {},
    stackParentsById: {},
    stacksByTabIndex: {},
  };

  let context = { renderCharts };

  beforeEach(() => {
    initialState = {
      stacks: {
        ids: [],
        lookup: {},
      },
      screens: {
        ids: [],
        lookup: {},
      },
      tabs: {
        ids: [],
        lookup: {},
      },
      debugModeEnabled: false,
    };

    renderCharts = {
      stacksByDepth: {},
      tabsByDepth: {},
      tabParentsById: {},
      stackParentsById: {},
      stacksByTabIndex: {},
    };
  });

  it("should handle CREATE_STACK_INSTANCE", () => {
    let action: NavigationAction = {
      type: "CREATE_STACK_INSTANCE",
      stackId: "stack1",
    };
    let newState = reducer(initialState, action, context);

    expect(newState.stacks.ids).toContain("stack1");
    expect(newState.stacks.lookup["stack1"]).toEqual({
      id: "stack1",
      defaultSlotName: "DEFAULT_SLOT",
      screens: [],
    });
  });

  it("should handle REGISTER_STACK", () => {
    let action: NavigationAction = {
      type: "REGISTER_STACK",
      depth: 1,
      isActive: true,
      stackId: "stack1",
      parentStackId: "parentStack1",
      parentTabId: "parentTab1",
      tabIndex: 0,
    };

    reducer(initialState, action, context);

    expect(context.renderCharts.stacksByDepth[1]).toContain("stack1");
    expect(context.renderCharts.stackParentsById["stack1"]).toBe(
      "parentStack1"
    );
    let tabIndexKey = serializeTabIndexKey("parentTab1", 0);
    expect(context.renderCharts.stacksByTabIndex[tabIndexKey]).toContain(
      "stack1"
    );
  });

  it("should handle UNREGISTER_STACK", () => {
    let initialStateWithStack: NavigationState = {
      ...initialState,
      stacks: {
        ids: ["stack1"],
        lookup: {
          stack1: {
            id: "stack1",
            defaultSlotName: "DEFAULT_SLOT",
            screens: ["screen1", "screen2"],
          },
        },
      },
      screens: {
        ids: ["screen1", "screen2"],
        lookup: {
          screen1: { id: "screen1", stackId: "stack1", element: null },
          screen2: { id: "screen2", stackId: "stack1", element: null },
        },
      },
    };

    let action: NavigationAction = {
      type: "UNREGISTER_STACK",
      stackId: "stack1",
    };

    let newState = reducer(initialStateWithStack, action, context);

    expect(newState.stacks.ids).not.toContain("stack1");
    expect(newState.screens.ids).not.toContain("screen1");
    expect(newState.screens.ids).not.toContain("screen2");
  });

  it("should handle PUSH_SCREEN", () => {
    let action: NavigationAction = {
      type: "PUSH_SCREEN",
      element: null,
      stackId: "stack1",
    };

    let initialStateWithStack: NavigationState = {
      ...initialState,
      stacks: {
        ids: ["stack1"],
        lookup: {
          stack1: {
            id: "stack1",
            defaultSlotName: "DEFAULT_SLOT",
            screens: [],
          },
        },
      },
    };

    let newState = reducer(initialStateWithStack, action, context);

    expect(newState.screens.ids).toHaveLength(1);
    expect(newState.screens.lookup).toHaveProperty(newState.screens.ids[0]);
  });

  it("should handle POP_SCREEN_BY_COUNT", () => {
    let action: NavigationAction = {
      type: "POP_SCREEN_BY_COUNT",
      count: 1,
      stackId: "stack1",
    };

    let initialStateWithStack: NavigationState = {
      ...initialState,
      stacks: {
        ids: ["stack1"],
        lookup: {
          stack1: {
            id: "stack1",
            defaultSlotName: "DEFAULT_SLOT",
            screens: ["screen1"],
          },
        },
      },

      screens: {
        ids: ["screen1"],
        lookup: {
          screen1: { id: "screen1", stackId: "stack1", element: null },
        },
      },
    };

    let newState = reducer(initialStateWithStack, action, context);

    expect(newState.stacks.lookup.stack1.screens).toHaveLength(0);
    expect(newState.screens.ids).not.toContain("screen1");
  });

  it("should handle POP_SCREEN_BY_KEY", () => {
    let action: NavigationAction = {
      type: "POP_SCREEN_BY_KEY",
      key: "screen1",
    };

    let initialStateWithStack: NavigationState = {
      ...initialState,
      stacks: {
        ids: ["stack1"],
        lookup: {
          stack1: {
            id: "stack1",
            defaultSlotName: "DEFAULT_SLOT",
            screens: ["screen1", "screen2"],
          },
        },
      },

      screens: {
        ids: ["screen1", "screen2"],
        lookup: {
          screen1: { id: "screen1", stackId: "stack1", element: null },
          screen2: { id: "screen2", stackId: "stack1", element: null },
        },
      },
    };

    let newState = reducer(initialStateWithStack, action, context);
    expect(newState.screens.ids).not.toContain("screen1");
    expect(newState.stacks.lookup.stack1.screens).not.toContain("screen1");
    expect(newState.screens.ids).toContain("screen2");
  });

  // New test cases
  it("should handle CREATE_TAB_INSTANCE", () => {
    let action: NavigationAction = {
      type: "CREATE_TAB_INSTANCE",
      tabId: "tab1",
      initialActiveIndex: 0,
    };

    let newState = reducer(initialState, action, context);

    expect(newState.tabs.ids).toContain("tab1");
    expect(newState.tabs.lookup["tab1"]).toEqual({
      id: "tab1",
      activeIndex: 0,
      history: [],
    });
  });

  it("should handle SET_TAB_INDEX", () => {
    let action: NavigationAction = {
      type: "SET_TAB_INDEX",
      tabId: "tab1",
      index: 1,
    };

    let initialStateWithTab: NavigationState = {
      ...initialState,
      tabs: {
        ids: ["tab1"],
        lookup: {
          tab1: {
            id: "tab1",
            activeIndex: 0,
            history: [],
          },
        },
      },
    };

    let newState = reducer(initialStateWithTab, action, context);

    expect(newState.tabs.lookup["tab1"].activeIndex).toBe(1);
    expect(newState.tabs.lookup["tab1"].history).toContain(0);
  });

  it("should handle REGISTER_TAB", () => {
    let action: NavigationAction = {
      type: "REGISTER_TAB",
      depth: 1,
      tabId: "tab1",
      isActive: true,
    };

    reducer(initialState, action, context);

    expect(context.renderCharts.tabsByDepth[1]).toContain("tab1");
    expect(context.renderCharts.tabParentsById["tab1"]).toBe("");
  });

  it("should handle UNREGISTER_TAB", () => {
    let initialStateWithTab: NavigationState = {
      ...initialState,
      tabs: {
        ids: ["tab1"],
        lookup: {
          tab1: {
            id: "tab1",
            activeIndex: 0,
            history: [],
          },
        },
      },
    };

    let action: NavigationAction = {
      type: "UNREGISTER_TAB",
      tabId: "tab1",
    };

    let newState = reducer(initialStateWithTab, action, context);

    expect(newState.tabs.ids).not.toContain("tab1");
    expect(newState.tabs.lookup["tab1"]).toBeUndefined();
  });

  it("should handle TAB_BACK", () => {
    let action: NavigationAction = {
      type: "TAB_BACK",
      tabId: "tab1",
    };

    let initialStateWithTab: NavigationState = {
      ...initialState,
      tabs: {
        ids: ["tab1"],
        lookup: {
          tab1: {
            id: "tab1",
            activeIndex: 1,
            history: [0],
          },
        },
      },
    };

    let newState = reducer(initialStateWithTab, action, context);

    expect(newState.tabs.lookup.tab1.activeIndex).toBe(0);
    expect(newState.tabs.lookup.tab1.history).toHaveLength(0);
  });

  it('should handle setDebugModeEnabled', () => {
    let action: NavigationAction = {
      type: "SET_DEBUG_MODE",
      enabled: true,
    };

    let newState = reducer(initialState, action, context);
    expect(newState.debugModeEnabled).toBe(true);
  })
});
