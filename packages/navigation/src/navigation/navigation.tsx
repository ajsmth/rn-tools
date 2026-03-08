import * as React from "react";
import { NavigationClient } from "./navigation-client";
import { createNotifications } from "@rn-tools/notifications";
import { createSheets } from "@rn-tools/sheets";
import { Stack } from "../stack";
import { createStack } from "../stack/stack-client";
import { createTabs } from "../tabs/tabs-client";

type NavigationClientInternal = {
  stack: ReturnType<typeof createStack>;
  tabs: ReturnType<typeof createTabs>;
  sheets: ReturnType<typeof createSheets>;
  notifications: ReturnType<typeof createNotifications>;
};

type NavigationProps = {
  navigation: NavigationClient;
  children: React.ReactNode;
};

export const Navigation = React.memo(function Navigation(
  props: NavigationProps,
) {
  const { navigation: n, children } = props;
  const navigation = n as NavigationClientInternal;

  const rootScreen = React.useMemo(() => <>{children}</>, [children]);

  return (
    <navigation.notifications.Provider>
      <navigation.sheets.Provider>
        <navigation.tabs.Provider>
          <navigation.stack.Provider>
            <Stack rootScreen={rootScreen} />
          </navigation.stack.Provider>
        </navigation.tabs.Provider>
      </navigation.sheets.Provider>
    </navigation.notifications.Provider>
  );
});
