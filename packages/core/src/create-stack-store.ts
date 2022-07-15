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

type StackEvent = "pushstart" | "pushend" | "popstart" | "popend"

type StackState<T> = {
  stack: StackItem<T>[]
}

export type StackStore<T> = {
  store: Store<StackState<T>, StackEvent>,
  actions: {
    push: (data: T) => StackItem<T>;
    pop: () => StackItem<T> | undefined;
    snapshot: (key: number) => void;
    restore: (key: number) => void;
  }
}

export function createStackStore<T>(): StackStore<T> {
  let store = createStore<StackState<T>, StackEvent>();

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
        store.emit("pushend")
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
        store.emit("popend")
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
    store.emit("pushstart")
    return item;
  }

  function pop() {
    let id = ids.pop();
    let item = byId[id];
    item.status === "popping";
    byId[id] = item;
    let stack = ids.map((id) => byId[id]).filter(Boolean);
    store.setState({ stack });
    store.emit("popstart")
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
    store,
    actions: {
      push,
      pop,
      snapshot,
      restore,
    }
  };

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
