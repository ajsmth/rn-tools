import * as React from "react";
import { NavigationClient } from "./navigation-client";
import { Stack } from "../stack";

type NavigationProps = {
  navigation: NavigationClient;
  children: React.ReactNode;
};

export const Navigation = React.memo(function Navigation(
  props: NavigationProps,
) {
  const { navigation, children } = props;
  const rootScreen = React.useMemo(() => <>{children}</>, [children]);

  return (
    <navigation.sheets.Provider>
      <navigation.tabs.Provider>
        <navigation.stack.Provider>
          <Stack rootScreen={rootScreen} />
        </navigation.stack.Provider>
      </navigation.tabs.Provider>
    </navigation.sheets.Provider>
  );
});
