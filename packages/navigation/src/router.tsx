import * as React from "react";
import { routerStore, Routes } from "./router-store";

export type RouterProps = {
  children: React.ReactNode;
  routes?: Routes;
};

const RouterDepthContext = React.createContext(0);

export function Router({ children, routes = {} }: RouterProps) {
  const depth = React.useContext(RouterDepthContext);

  React.useEffect(() => {
    const router = routerStore.create(routes, depth);
    return () => routerStore.remove(router.id);
  }, [routes, depth]);

  return (
    <RouterDepthContext.Provider value={depth + 1}>
      {children}
    </RouterDepthContext.Provider>
  );
}
