import { createTree } from "@rn-tools/core";
import { createSheets } from "@rn-tools/sheets";
import { createNotifications } from "@rn-tools/notifications";
import { createStack } from "../stack";
import { createTabs } from "../tabs";

export type NavigationClient = {
  stack: ReturnType<typeof createStack>;
  tabs: ReturnType<typeof createTabs>;
  sheets: ReturnType<typeof createSheets>;
  notifications: ReturnType<typeof createNotifications>;
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
