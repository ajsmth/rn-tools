import * as React from "react";
import {
  RenderChartInstanceIdContext,
  RenderChartNode,
  useRenderChart,
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
  const chart = useRenderChart();
  return (
    <StackContext.Provider value={chart.instanceId}>
      {props.children}
    </StackContext.Provider>
  );
}

function StackScreenBody(props: { children: React.ReactNode }) {
  const chart = useRenderChart();
  const stackInstanceId = React.useContext(StackContext);

  if (!stackInstanceId) {
    return null;
  }

  if (chart.getParentInstanceId("stack") !== stackInstanceId) {
    return null;
  }

  return (
    <RenderChartInstanceIdContext.Provider value={chart.instanceId}>
      {props.children}
    </RenderChartInstanceIdContext.Provider>
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
