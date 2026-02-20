import * as React from "react";
import { RenderTreeNode, useStore } from "@rn-tools/core";
import { ToastHost } from "./native-toast-view";
import { TOAST_TYPE, ToastsContext, ToastsStoreContext } from "./toasts-client";

export const ToastSlot = React.memo(function ToastSlot() {
  const store = React.useContext(ToastsStoreContext);
  const toasts = React.useContext(ToastsContext);
  const entries = useStore(store, (state) => state.entries);

  const activeKey = React.useMemo(() => {
    const top = entries[entries.length - 1];
    return top?.key ?? null;
  }, [entries]);

  const topCount = React.useMemo(
    () => entries.filter((e) => (e.options.position ?? "top") === "top").length,
    [entries],
  );

  const bottomCount = React.useMemo(
    () => entries.filter((e) => e.options.position === "bottom").length,
    [entries],
  );

  React.useEffect(() => {
    if (!toasts) {
      return;
    }

    for (const entry of entries) {
      if (entry.status === "opening") {
        toasts.markDidShow(entry.key);
        continue;
      }

      if (entry.status === "closing") {
        toasts.markDidDismiss(entry.key);
      }
    }
  }, [entries, toasts]);

  return (
    <>
      <ToastHost
        isVisible={true}
        debugLayout={true}
        topItemCount={topCount}
        bottomItemCount={bottomCount}
      />
      {entries.map((entry) => (
        <RenderTreeNode
          key={entry.key}
          type={TOAST_TYPE}
          id={entry.key}
          active={entry.key === activeKey}
        >
          {null}
        </RenderTreeNode>
      ))}
    </>
  );
});
