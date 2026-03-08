import { TreeNode } from "@rn-tools/core";
import * as React from "react";
import { NativeScreen, NativeStack } from "./native-stack";
import { StackSlot } from "./stack-slot";
import { STACK_SCREEN, StackStoreContext } from "./stack-context";

type StackProps = {
  id?: string;
  rootScreen?: React.ReactElement;
};

let counter = 0;

export const Stack = React.memo(function Stack(props: StackProps) {
  const { rootScreen, id } = props;

  const store = React.useContext(StackStoreContext);
  const slotId = React.useRef(id ?? `stack-${counter++}`);

  return (
    <NativeStack>
      {rootScreen && (
        <TreeNode type={STACK_SCREEN} id={`${slotId.current}-root`}>
          <NativeScreen active={false}>{rootScreen}</NativeScreen>
        </TreeNode>
      )}
      <StackSlot id={slotId.current} store={store} />
    </NativeStack>
  );
});
