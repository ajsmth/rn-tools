import { createStore, useStore } from "./store";
import * as React from "react";

export const STATUSES = {
  MOUNTED: "mounted",
  OPENING: "opening",
  OPEN: "open",
  CLOSING: "closing",
  CLOSED: "closed",
  UNMOUNTED: "unmounted",
} as const;

type Status = (typeof STATUSES)[keyof typeof STATUSES];

export const EVENTS = {
  MOUNT: "MOUNT",
  OPEN: "OPEN",
  OPENED: "OPENED",
  CLOSE: "CLOSE",
  CLOSED: "CLOSED",
  UNMOUNT: "UNMOUNT",
} as const;

export type Event = (typeof EVENTS)[keyof typeof EVENTS];

const transitions: Record<Status, Partial<Record<Event, Status>>> = {
  [STATUSES.MOUNTED]: {
    OPEN: STATUSES.OPENING,
    CLOSE: STATUSES.CLOSING,
    UNMOUNT: STATUSES.UNMOUNTED,
  },

  [STATUSES.OPENING]: {
    OPENED: STATUSES.OPEN,
    CLOSE: STATUSES.CLOSING,
  },

  [STATUSES.OPEN]: {
    CLOSE: STATUSES.CLOSING,
  },

  [STATUSES.CLOSING]: {
    CLOSED: STATUSES.CLOSED,
    OPEN: STATUSES.OPENING,
  },

  [STATUSES.CLOSED]: {
    OPEN: STATUSES.OPENING,
    UNMOUNT: STATUSES.UNMOUNTED,
  },

  [STATUSES.UNMOUNTED]: {
    MOUNT: STATUSES.MOUNTED,
  },
};

type Entry = {
  id: string;
  status: Status;
};

type StoreState<T = any> = {
  entries: Entry[];
  elements: Record<string, { element: React.ReactElement; props: T }>;
};

export type TransitionStore = ReturnType<typeof createTransitionStore>;

export function createTransitionStore() {
  const store = createStore<StoreState>({
    entries: [],
    elements: {},
  });

  function add<T>(id: string, element?: React.ReactElement, props?: T) {
    store.setState((prev) => {
      if (prev.entries.find((e) => e.id === id)) {
        // Already exists
        return prev;
      }

      return {
        ...prev,
        entries: [...prev.entries, { id, status: "mounted" }],
        elements: {
          ...prev.elements,
          [id]: { element, props },
        },
      };
    });
  }

  function setNode(nodeId: string, id: string) {
    store.setState((prev) => {
      if (!getEntry(id)) {
        return prev;
      }

      return {
        ...prev,
        nodes: {
          ...prev.nodes,
          [nodeId]: id,
        },
      };
    });
  }

  function getEntry(id: string) {
    const state = store.getState();
    const entry = state.entries.find((e) => e.id === id);
    return entry;
  }

  function transition(id: string, event: Event) {
    store.setState((prev) => {
      const index = prev.entries.findIndex((e) => e.id === id);
      const entry = prev.entries[index];
      const state = entry?.status;

      const nextState = transitions[state]?.[event];
      if (!nextState) return prev;

      if (nextState === STATUSES.UNMOUNTED) {
        return {
          ...prev,
          entries: prev.entries.filter((e) => e.id !== id),
        };
      }

      const entries = [...prev.entries];
      entries[index] = { ...entry, status: nextState };

      return {
        ...prev,
        entries,
      };
    });
  }

  function useEntry(id: string) {
    const entry = useStore(store, (state) =>
      state.entries.find((e) => e.id === id),
    );
    const el = useStore(store, (state) => state.elements[id]);

    return React.useMemo(
      () => ({ ...entry, element: el?.element, props: el?.props }),
      [entry, el],
    );
  }

  function useEntries() {
    const entries = useStore(store, (state) => state.entries);
    const elements = useStore(store, (state) => state.elements);

    return entries.filter((e) => elements[e.id]?.element != null);
  }

  return {
    transition,
    add,
    setNode,
    getEntry,
    useEntry,
    useEntries,
    getState: store.getState,
  };
}
