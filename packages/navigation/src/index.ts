import { createLocationStore } from "./create-location-store";
import { createRouter } from "./create-router";
import { createRouterStore, Routes, RouteHandler } from "./create-router-store";
import {
  createStackNavigator as createSN,
  StackNavigator,
  ScreenProps,
} from "./create-stack-navigator";

let stackNavigators: StackNavigator[] = [];
const location = createLocationStore();

export const navigate = location.actions.navigate;
export const subscribe = location.store.subscribe;
export const goBack = location.actions.goBack;

const router = createRouterStore(location, stackNavigators);

export function createStackNavigator() {
  const { Stack, stack } = createSN();
  stackNavigators.push(stack);
  return Stack;
}
export { ScreenProps };
export const Router = createRouter(router);
export { Routes, RouteHandler };
