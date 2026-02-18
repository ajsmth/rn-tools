import * as React from "react";
import { RenderTreeNode, useStore } from "@rn-tools/core";
import type { OverlayStatus } from "@rn-tools/core";
import { Toast } from "./native-toast-view";
import { TOAST_TYPE, ToastsContext, ToastsStoreContext } from "./toasts-client";

type ToastSlotEntryProps = {
  entryKey: string;
  element: React.ReactElement;
  status: OverlayStatus;
  active: boolean;
  wrapped: boolean;
  position?: "top" | "bottom";
  duration?: number;
};

const ToastSlotEntry = React.memo(function ToastSlotEntry(
  props: ToastSlotEntryProps,
) {
  const toasts = React.useContext(ToastsContext);
  const isVisible = props.status !== "closing";

  const handleShown = React.useCallback(() => {
    toasts?.markDidShow(props.entryKey);
  }, [toasts, props.entryKey]);

  const handleDismissed = React.useCallback(() => {
    toasts?.markDidDismiss(props.entryKey);
  }, [toasts, props.entryKey]);

  if (!props.wrapped) {
    return (
      <RenderTreeNode type={TOAST_TYPE} id={props.entryKey} active={props.active}>
        {props.element}
      </RenderTreeNode>
    );
  }

  return (
    <RenderTreeNode type={TOAST_TYPE} id={props.entryKey} active={props.active}>
      <Toast
        isVisible={isVisible}
        position={props.position}
        duration={props.duration}
        onShown={handleShown}
        onDismissed={handleDismissed}
      >
        {props.element}
      </Toast>
    </RenderTreeNode>
  );
});

export const ToastSlot = React.memo(function ToastSlot() {
  const store = React.useContext(ToastsStoreContext);
  const entries = useStore(store, (state) => state.entries);
  const activeKey = React.useMemo(() => {
    for (let i = entries.length - 1; i >= 0; i--) {
      if (entries[i].status !== "closing") {
        return entries[i].key;
      }
    }
    return null;
  }, [entries]);

  return (
    <>
      {entries.map((entry) => (
        <ToastSlotEntry
          key={entry.key}
          entryKey={entry.key}
          element={entry.element}
          status={entry.status}
          active={entry.key === activeKey}
          wrapped={entry.options.wrapped !== false}
          position={entry.options.position}
          duration={entry.options.duration}
        />
      ))}
    </>
  );
});
