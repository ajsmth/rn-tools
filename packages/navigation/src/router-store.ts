import { match } from "path-to-regexp";
import { URL } from "react-native-url-polyfill";
import { stackStores } from "./create-stack-store";
import { LocationStore, locationStore } from "./location-store";

let id = 0;
let ids: number[] = [];
let byId: { [id: number]: Router } = {};

type Router = {
  id: number;
  routes: Routes;
  rank: number;
  matchers: { [path: string]: any };
};

export type RouteHandler = ({
  url,
  params,
}: {
  url: URL;
  params?: any;
  state?: any;
  next: () => void;
}) => Promise<void> | void;

export type Routes = { [path: string]: RouteHandler };

function create(routes: Routes, rank: number = 0) {
  let matchers: any = {};
  for (let route in routes) {
    let matcher = match(route, { decode: decodeURIComponent });
    matchers[route] = matcher;
  }
  id += 1;
  let router = { id, routes, rank, matchers };
  ids.push(router.id);
  byId[id] = router;
  ids = ids
    .map((id) => byId[id])
    .sort((a, b) => b.rank - a.rank)
    .map((r) => r.id);
  return router;
}

function remove(id: number) {
  ids = ids.filter((i) => i !== id);
  delete byId[id];
}

async function findMatch({ current }: LocationStore) {
  let routers = ids.map((id) => byId[id]);
  let handled = true;
  let next = () => (handled = false);
  for (let router of routers) {
    for (let path in router.matchers) {
      const matcher = router.matchers[path];
      let match = matcher(current.url.pathname);
      if (match) {
        const handler = router.routes[path];
        if (handler != null) {
          await handler({ ...match, ...current, next });
          if (handled) {
            break;
          }
        }
      }
    }
  }
}

locationStore.listen("navigate", async ({ current }) => {
  await findMatch({ current });
  stackStores.forEach((store: any) => store.snapshot(current.id));
});

locationStore.listen("back", ({ current }) => {
  stackStores.forEach((store: any) => store.restore(current.id));
});

locationStore.listen("init", async ({ current }) => {
  await findMatch({ current });
  stackStores.forEach((store: any) => store.snapshot(current.id));
});

export const routerStore = {
  create,
  remove,
};
