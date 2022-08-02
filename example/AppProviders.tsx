import * as React from "react";

import {
  createStackNavigator,
  Router,
  createTabNavigator,
} from "@rn-toolkit/navigation";
import {
  createBottomSheetProvider,
  createModalProvider,
  createToastProvider,
} from "@rn-toolkit/ui";

export const Toasts = createToastProvider();
export const Modals = createModalProvider();
export const BottomSheets = createBottomSheetProvider();
export const Stack = createStackNavigator();
export const Tabs = createTabNavigator();

export function AppProviders({ children }: any) {
  return (
    <Modals.Provider>
      <BottomSheets.Provider>
        <Toasts.Provider>
          <Stack.Navigator>
            <Router>{children}</Router>
          </Stack.Navigator>
        </Toasts.Provider>
      </BottomSheets.Provider>
    </Modals.Provider>
  );
}
