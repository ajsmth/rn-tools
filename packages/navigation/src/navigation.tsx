import * as React from "react";
import { RenderTree } from "@rn-tools/core";
import { SheetsProvider } from "@rn-tools/sheets";
import {
  NavigationContext,
  NavigationStoreContext,
  type NavigationClient,
} from "./navigation-client";
import { Stack } from "./stack";

export type NavigationProps = {
  navigation: NavigationClient;
  children: React.ReactNode;
};

const ROOT_STACK_ID = "__root__";

const RootStack = React.memo(function RootStack(props: {
  children: React.ReactNode;
}) {
  const rootScreen = React.useMemo(
    () => <>{props.children}</>,
    [props.children],
  );

  return <Stack id={ROOT_STACK_ID} rootScreen={rootScreen} />;
});

export const Navigation = React.memo(function Navigation(
  props: NavigationProps,
) {
  return (
    <RenderTree store={props.navigation.renderTreeStore}>
      <SheetsProvider sheets={props.navigation.sheetsStore}>
        <NavigationContext.Provider value={props.navigation}>
          <NavigationStoreContext.Provider value={props.navigation.store}>
            <RootStack>{props.children}</RootStack>
          </NavigationStoreContext.Provider>
        </NavigationContext.Provider>
      </SheetsProvider>
    </RenderTree>
  );
});
