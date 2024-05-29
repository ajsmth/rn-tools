export type PushScreenOptions = {
  stackId?: string;
  slotName?: string;
  screenId?: string;
};

export type StackItem = {
  id: string;
  defaultSlotName?: string;
  screens: string[];
};

export type ScreenItem = {
  id: string;
  stackId: string;
  element: React.ReactElement<unknown>;
  slotName?: string;
};

export type TabItem = {
  id: string;
  activeIndex: number;
  history: number[];
};

export type NavigationState = {
  stacks: {
    lookup: Record<string, StackItem>;
    ids: string[];
  };
  tabs: {
    lookup: Record<string, TabItem>;
    ids: string[];
  };
  screens: {
    lookup: Record<string, ScreenItem>;
    ids: string[];
  };
  debugModeEnabled: boolean;
};

export type RenderCharts = {
  stacksByDepth: Record<string, string[]>;
  tabsByDepth: Record<string, string[]>;
  tabParentsById: Record<string, string>;
  stackParentsById: Record<string, string>;
  stacksByTabIndex: Record<string, string[]>;
};
