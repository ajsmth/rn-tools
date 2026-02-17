import * as React from "react";
import { createStore } from "./store";
import { getRenderNodeActive, getRenderNodeDepth } from "./render-tree";
import type { Store } from "./store";
import type { RenderTreeStore } from "./render-tree";

export type OverlayStatus = "opening" | "open" | "closing";

export type BaseOverlayOptions = { id?: string; wrapped?: boolean };

export type OverlayEntry<TOptions extends BaseOverlayOptions> = {
  key: string;
  element: React.ReactElement;
  options: TOptions;
  status: OverlayStatus;
};

export type OverlayState<TOptions extends BaseOverlayOptions> = {
  entries: OverlayEntry<TOptions>[];
};

export type OverlayStoreConfig = {
  type: string;
  renderTreeStore: RenderTreeStore;
};

export type OverlayStore<TOptions extends BaseOverlayOptions> = {
  store: Store<OverlayState<TOptions>>;
  add: (element: React.ReactElement, options?: TOptions) => string;
  remove: (id?: string) => void;
  removeAll: () => void;
  destroy: (id: string) => void;
  markOpened: (key: string) => void;
  markClosed: (key: string) => void;
};

let counter = 0;

export function createOverlayStore<
  TOptions extends BaseOverlayOptions = BaseOverlayOptions,
>(config: OverlayStoreConfig): OverlayStore<TOptions> {
  const store = createStore<OverlayState<TOptions>>({ entries: [] });

  function getActiveRemoveKey(): string | null {
    const tree = config.renderTreeStore.getState();
    let deepestId: string | null = null;
    let deepestDepth = -1;

    for (const [id, node] of tree.nodes) {
      if (node.type !== config.type) continue;
      if (!getRenderNodeActive(tree, id)) continue;

      const depth = getRenderNodeDepth(tree, id);
      if (depth > deepestDepth) {
        deepestDepth = depth;
        deepestId = id;
      }
    }

    return deepestId;
  }

  function add(
    element: React.ReactElement,
    options: TOptions = {} as TOptions,
  ): string {
    const generatedKey = `${config.type}-${++counter}`;
    let addedKey = generatedKey;

    store.setState((prev) => {
      if (options.id == null) {
        return {
          ...prev,
          entries: [
            ...prev.entries,
            { key: generatedKey, element, options, status: "opening" },
          ],
        };
      }

      const duplicateIndex = prev.entries.findIndex(
        (entry) => entry.options.id === options.id,
      );

      if (duplicateIndex === -1) {
        return {
          ...prev,
          entries: [
            ...prev.entries,
            { key: generatedKey, element, options, status: "opening" },
          ],
        };
      }

      const duplicate = prev.entries[duplicateIndex];
      addedKey = duplicate.key;
      const nextEntry: OverlayEntry<TOptions> = {
        key: duplicate.key,
        element,
        options,
        status: "opening",
      };

      const withoutDuplicate = prev.entries.filter(
        (_, i) => i !== duplicateIndex,
      );
      return {
        ...prev,
        entries: [...withoutDuplicate, nextEntry],
      };
    });

    return addedKey;
  }

  function remove(id?: string) {
    store.setState((prev) => {
      if (prev.entries.length === 0) return prev;

      let targetIndex = -1;

      if (id == null) {
        const activeKey = getActiveRemoveKey();
        if (activeKey) {
          targetIndex = prev.entries.findIndex(
            (entry) => entry.key === activeKey,
          );
        }

        if (targetIndex !== -1) {
          const activeEntry = prev.entries[targetIndex];
          if (activeEntry.status === "closing") {
            targetIndex = -1;
          }
        }

        if (targetIndex !== -1) {
          const entries = [...prev.entries];
          entries[targetIndex] = {
            ...prev.entries[targetIndex],
            status: "closing",
          };
          return { ...prev, entries };
        }

        // Fallback: close latest non-closing entry when render-tree has no active overlay.
        for (let i = prev.entries.length - 1; i >= 0; i--) {
          if (prev.entries[i].status !== "closing") {
            targetIndex = i;
            break;
          }
        }
      } else {
        targetIndex = prev.entries.findIndex(
          (entry) => entry.options.id === id || entry.key === id,
        );
      }

      if (targetIndex === -1) return prev;

      const entry = prev.entries[targetIndex];
      if (entry.status === "closing") return prev;

      const entries = [...prev.entries];
      entries[targetIndex] = { ...entry, status: "closing" };
      return { ...prev, entries };
    });
  }

  function removeAll() {
    store.setState((prev) => {
      if (prev.entries.length === 0) return prev;

      let changed = false;
      const entries = prev.entries.map((entry) => {
        if (entry.status === "closing") return entry;
        changed = true;
        return { ...entry, status: "closing" as const };
      });

      if (!changed) return prev;

      return { ...prev, entries };
    });
  }

  function destroy(id: string) {
    store.setState((prev) => {
      const targetIndex = prev.entries.findIndex(
        (entry) => entry.options.id === id || entry.key === id,
      );
      if (targetIndex === -1) return prev;

      return {
        ...prev,
        entries: prev.entries.filter((_, i) => i !== targetIndex),
      };
    });
  }

  function markOpened(key: string) {
    store.setState((prev) => {
      const index = prev.entries.findIndex((entry) => entry.key === key);
      if (index === -1) return prev;

      const entry = prev.entries[index];
      if (entry.status !== "opening") return prev;

      const entries = [...prev.entries];
      entries[index] = { ...entry, status: "open" };
      return { ...prev, entries };
    });
  }

  function markClosed(key: string) {
    store.setState((prev) => {
      const index = prev.entries.findIndex((entry) => entry.key === key);
      if (index === -1) return prev;

      const entry = prev.entries[index];
      if (entry.status !== "closing") {
        return prev;
      }

      return {
        ...prev,
        entries: prev.entries.filter((_, i) => i !== index),
      };
    });
  }

  return {
    store,
    add,
    remove,
    removeAll,
    destroy,
    markOpened,
    markClosed,
  };
}
