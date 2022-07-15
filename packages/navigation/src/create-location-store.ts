import * as Linking from "expo-linking";
import { BackHandler } from "react-native";
import { URL } from "react-native-url-polyfill";
import { createStore, Store } from "@rn-toolkit/core";

export type HistoryItem = {
  url: URL;
  state?: any;
  id: number;
};

export type LocationEvent = "back" | "navigate" | "init";

export type LocationState = {
  current: HistoryItem;
};

export type LocationConfig = {
  scheme?: string;
  initialPath?: string;
  initialState?: any;
};

export type LocationStore = {
  store: Store<LocationState, LocationEvent>;
  actions: {
    navigate: (path: string, state?: any) => void;
    goBack: (amount?: number) => void;
    init: (config: LocationConfig) => void;
  };
};

export function createLocationStore(): LocationStore {
  let store = createStore<LocationState, LocationEvent>();

  let id = 0;
  let index = 0;
  let scheme = `app://`;
  let current: HistoryItem = { id, url: new URL(`${scheme}/`) };
  let history: HistoryItem[] = [current];

  function init(config: LocationConfig) {
    id = 0;
    index = 0;
    scheme = config.scheme ?? "app://";
    current = {
      id,
      url: new URL(`${scheme}${config.initialPath ?? "/"}`),
      state: config.initialState,
    };
    history = [current];
    console.log({ current });
    store.setState({ current });
    store.emit("init");
  }

  function navigate(path: string, state?: any) {
    id += 1;
    index += 1;
    let url = new URL(`${scheme}${path}`);
    let location = { id, url, state };
    history.push(location);
    current = history[index];
    store.setState({ current });
    store.emit("navigate");
  }

  function goBack(amount: number = 1) {
    if (history[index - amount] != null) {
      index -= amount;
      current = history[index];
      store.setState({ current });
      store.emit("back");
    }
  }

  Linking.addEventListener("url", ({ url }) => {
    navigate(url);
  });

  BackHandler.addEventListener("hardwareBackPress", () => {
    goBack(1);
    return true;
  });

  const location = {
    store,
    actions: {
      navigate,
      goBack,
      init,
    },
  };

  return location;
}
