import * as React from "react";
import { RouterStore, Routes } from "./create-router-store";

export type RouterProps = {
  children: React.ReactNode;
  routes?: Routes;
};

const RouterDepthContext = React.createContext(0);

export function createRouter(routerStore: RouterStore) {
  function Router({ children, routes = {} }: RouterProps) {
    const depth = React.useContext(RouterDepthContext);

    React.useEffect(() => {
      const router = routerStore.create(routes);
      return () => routerStore.remove(router.id);
    }, [routes, depth]);

    return (
      <RouterDepthContext.Provider value={depth + 1}>
        {children}
      </RouterDepthContext.Provider>
    );
  }

  return Router;
}
