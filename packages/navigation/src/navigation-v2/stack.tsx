import * as React from "react";
import {
  RenderChartNodeInstanceIdContext,
  RenderChartNode,
  useRenderChartNode,
} from "@rn-tools/core";

const StackContext = React.createContext<string | null>(null);

export type StackProps = {
  id?: string;
  active?: boolean;
  children: React.ReactNode;
};

function StackRoot(props: StackProps) {
  return (
    <RenderChartNode type="stack" id={props.id} active={props.active}>
      <StackBody>{props.children}</StackBody>
    </RenderChartNode>
  );
}

export type StackScreenProps = {
  id?: string;
  children: React.ReactNode;
};

function StackBody(props: { children: React.ReactNode }) {
  const node = useRenderChartNode();
  return (
    <StackContext.Provider value={node.instanceId}>
      {props.children}
    </StackContext.Provider>
  );
}

function StackScreenBody(props: { children: React.ReactNode }) {
  const node = useRenderChartNode();
  const stackInstanceId = React.useContext(StackContext);

  if (!stackInstanceId) {
    return null;
  }

  if (node.getParent()?.instanceId !== stackInstanceId) {
    return null;
  }

  return (
    <RenderChartNodeInstanceIdContext.Provider value={node.instanceId}>
      {props.children}
    </RenderChartNodeInstanceIdContext.Provider>
  );
}

function StackScreen(props: StackScreenProps) {
  return (
    <RenderChartNode type="screen" id={props.id}>
      <StackScreenBody>{props.children}</StackScreenBody>
    </RenderChartNode>
  );
}

export const Stack = Object.assign(StackRoot, { Screen: StackScreen });
