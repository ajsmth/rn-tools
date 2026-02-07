import * as React from "react";
import {
  RenderTreeNode,
  useRenderNode,
} from "@rn-tools/core";
import { useStackScreens } from "./navigation";

export type StackProps = {
  id?: string;
  active?: boolean;
  rootScreen?: React.ReactElement;
  children?: React.ReactNode;
};

function StackRoot(props: StackProps) {
  return (
    <RenderTreeNode
      type="stack"
      id={props.id}
      active={props.active}
    >
      {props.rootScreen && <StackScreen>{props.rootScreen}</StackScreen>}
      {props.children}
    </RenderTreeNode>
  );
}

export type StackScreenProps = {
  id?: string;
  active?: boolean;
  children: React.ReactNode;
};

function StackScreen(props: StackScreenProps) {
  return (
    <RenderTreeNode type="screen" id={props.id} active={props.active}>
      {props.children}
    </RenderTreeNode>
  );
}

export function StackSlot() {
  const node = useRenderNode();
  const stackKey = node?.id ?? null;
  const screens = useStackScreens(stackKey);

  return (
    <React.Fragment>
      {screens.map((screen, index, arr) => (
        <StackScreen
          id={screen.options?.id}
          key={screen.options?.id ?? index}
          active={index === arr.length - 1}
        >
          {screen.element}
        </StackScreen>
      ))}
    </React.Fragment>
  );
}

export function Stack(props: Omit<StackProps, "children">) {
  return (
    <StackRoot {...props}>
      <StackSlot />
    </StackRoot>
  );
}
