import { createTree } from "@rn-tools/core";
import { createSheets } from "@rn-tools/sheets";
import { createNotifications } from "@rn-tools/notifications";
import { createStack } from "../stack";
import { createTabs } from "../tabs";

export type NavigationClient = {
  stack: Omit<ReturnType<typeof createStack>, "Provider">;
  tabs: Omit<ReturnType<typeof createTabs>, "Provider">;
  sheets: Omit<ReturnType<typeof createSheets>, "Provider">;
  notifications: Omit<ReturnType<typeof createNotifications>, "Provider">;
};

export function createNavigation(): NavigationClient {
  const tree = createTree();
  const sheets = createSheets(tree);
  const tabs = createTabs(tree);
  const stack = createStack(tree);
  const notifications = createNotifications(tree);

  return {
    stack,
    tabs,
    notifications,
    sheets,
  };
}
