import * as React from "react";
import { RenderTreeNode, useStore } from "@rn-tools/core";
import { View } from "react-native";
import { ToastHost } from "./native-toast-view";
import {
  TOAST_TYPE,
  ToastEntryKeyContext,
  ToastsContext,
  ToastsStoreContext,
} from "./toasts-client";
import type { ToastEntry } from "./toasts-client";

const DEBUG_DISMISS_ANIMATION_MS = 280;

export const ToastSlot = React.memo(function ToastSlot({
  debugLayout = true,
}: {
  debugLayout?: boolean;
}) {
  const store = React.useContext(ToastsStoreContext);
  const toasts = React.useContext(ToastsContext);
  const entries = useStore(store, (state) => state.entries);
  const dismissTimersRef = React.useRef(
    new Map<string, ReturnType<typeof setTimeout>>(),
  );

  const activeKey = React.useMemo(() => {
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].status !== "closing") {
        return entries[i].key;
      }
    }
    return null;
  }, [entries]);

  const topEntries = React.useMemo(
    () =>
      entries.filter((entry) => (entry.options.position ?? "top") === "top"),
    [entries],
  );

  const bottomEntries = React.useMemo(
    () => entries.filter((entry) => entry.options.position === "bottom"),
    [entries],
  );

  React.useEffect(() => {
    if (!toasts) {
      return;
    }

    const closingKeys = new Set<string>();

    for (const entry of entries) {
      if (entry.status === "opening") {
        toasts.markDidShow(entry.key);
        continue;
      }

      if (entry.status !== "closing") {
        continue;
      }

      closingKeys.add(entry.key);
      if (dismissTimersRef.current.has(entry.key)) {
        continue;
      }

      const timer = setTimeout(() => {
        dismissTimersRef.current.delete(entry.key);
        toasts.markDidDismiss(entry.key);
      }, DEBUG_DISMISS_ANIMATION_MS);

      dismissTimersRef.current.set(entry.key, timer);
    }

    for (const [key, timer] of dismissTimersRef.current) {
      if (closingKeys.has(key)) {
        continue;
      }
      clearTimeout(timer);
      dismissTimersRef.current.delete(key);
    }
  }, [entries, toasts]);

  React.useEffect(() => {
    return () => {
      for (const timer of dismissTimersRef.current.values()) {
        clearTimeout(timer);
      }
      dismissTimersRef.current.clear();
    };
  }, []);

  return (
    <ToastHost isVisible={true} debugLayout={debugLayout}>
      <View pointerEvents="box-none" collapsable={false}>
        {topEntries.map((entry) => (
          <ToastSlotEntry
            key={entry.key}
            entry={entry}
            active={entry.key === activeKey}
          />
        ))}
      </View>
      <View pointerEvents="box-none" collapsable={false}>
        {bottomEntries.map((entry) => (
          <ToastSlotEntry
            key={entry.key}
            entry={entry}
            active={entry.key === activeKey}
          />
        ))}
      </View>
    </ToastHost>
  );
});

const ToastSlotEntry = React.memo(function ToastSlotEntry({
  entry,
  active,
}: {
  entry: ToastEntry;
  active: boolean;
}) {
  return (
    <RenderTreeNode type={TOAST_TYPE} id={entry.key} active={active}>
      <ToastEntryKeyContext.Provider value={entry.key}>
        {entry.element}
      </ToastEntryKeyContext.Provider>
    </RenderTreeNode>
  );
});
