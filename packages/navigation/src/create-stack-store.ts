import { createStore, Store } from "./create-store";

type StackItemStatus = "pushing" | "settled" | "popping" | "popped";

export type StackItem<T> = {
  id: number;
  data: T;
  status: StackItemStatus;
  actions: {
    update: (id: number, updates: Partial<T>) => void;
    pushEnd: (id: number) => void;
    popEnd: (id: number) => void;
  };
  promises: {
    push: Promise<any>;
    pop: Promise<any>;
  };
};

export const stackStores: any[] = [];

export function createStackStore<T>() {
  let store = createStore();

  let id = 0;
  let ids: any[] = [];
  let byId: any = {};

  function push(data: T): StackItem<T> {
    id += 1;

    let promises = {
      push: createPromise(),
      pop: createPromise(),
    };

    let actions = {
      pushEnd: (id: number) => {
        let item = byId[id];
        if (item != null) {
          item.status = "settled";
          byId[id] = item;
        }
        promises.push.resolve(item);
        let stack = ids.map((id) => byId[id]).filter(Boolean);
        store.setState({ stack });
      },

      popEnd: (id: number) => {
        let item = byId[id];
        item.status = "popped";
        byId[id] = item;
        promises.pop.resolve(item);
        delete byId[id];
        ids = ids.filter((i) => i !== id);
        let stack = ids.map((id) => byId[id]).filter(Boolean);
        store.setState({ stack });
      },

      update: (id: number, updates: any) => {
        let item = byId[id] ?? {};
        item = {
          ...item,
          data: {
            ...(item?.data ?? {}),
            ...updates,
          },
        };
        byId[id] = item;
        let stack = ids.map((id) => byId[id]).filter(Boolean);
        store.setState({ stack });
        // emit update event
      },
    };

    let item = {
      id,
      data,
      status: "pushing" as StackItemStatus,
      actions,
      promises: {
        push: promises.push.promise,
        pop: promises.pop.promise,
      },
    };

    ids.push(id);
    byId[id] = item;
    let stack = ids.map((id) => byId[id]).filter(Boolean);
    store.setState({ stack });
    return item;
  }

  function pop() {
    let id = ids.pop();
    let item = byId[id];
    item.status === "popping";
    byId[id] = item;
    // emit pop event
    let stack = ids.map((id) => byId[id]).filter(Boolean);
    store.setState({ stack });
    return item;
  }

  let snapshots: any = {};

  function snapshot(key: number) {
    snapshots[key] = [...ids];
  }

  function restore(key: number) {
    let snapshot = snapshots[key];
    if (snapshot != null) {
      ids = [...snapshot];
      const stack = ids.map((id) => byId[id]).filter(Boolean);
      store.setState({ stack });
    } else {
      ids = [];
      byId = {};
      snapshots = {};
      store.setState({ stack: [] });
    }
  }

  let stackStore = {
    ...store,
    push,
    pop,
    snapshot,
    restore,
  };

  stackStores.push(stackStore);
  return stackStore;
}

const noop = () => {};

function createPromise<T = any, S = any>() {
  let resolve: (value: T) => void = noop;
  let reject: (value: S) => void = noop;

  let promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return {
    promise,
    resolve,
    reject,
  };
}
