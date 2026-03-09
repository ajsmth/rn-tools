import { STATUSES, Status, TransitionStore, TreeNode } from "@rn-tools/core";
import * as React from "react";
import { NativeScreen } from "./native-stack";
import { STACK_SCREEN, STACK_SLOT } from "./stack-context";

type StackSlotProps = {
  id: string;
  store: TransitionStore;
};

const ACTIVE_STATUSES: Status[] = [STATUSES.OPENING, STATUSES.OPEN];

export const StackSlot = React.memo(function StackSlot(props: StackSlotProps) {
  const { store, id } = props;

  const entries = store
    .useEntries()
    .filter((e) => ACTIVE_STATUSES.includes(e.status))
    .filter((e) => e.props?.slotId === id);

  return (
    <TreeNode type={STACK_SLOT} id={id}>
      {entries.map((e, index, arr) => (
        <TreeNode
          type={STACK_SCREEN}
          key={e.id}
          active={index === arr.length - 1}
          id={e.id}
        >
          <NativeScreen {...e.props} active={index === arr.length - 1}>
            {e.element}
          </NativeScreen>
        </TreeNode>
      ))}
    </TreeNode>
  );
});
