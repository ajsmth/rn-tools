import { createStore, useStore } from "./store";
import { act, render } from "@testing-library/react-native";
import * as React from "react";

describe("createStore()", () => {
  test("returns a store", () => {
    const store = createStore({});
    expect(store).toBeDefined();
  });

  test("getInitialState returns the initial state", () => {
    const initialState = { count: 0 };
    const store = createStore(initialState);

    expect(store.getInitialState()).toBe(initialState);
  });

  test("setState updates the state", () => {
    const store = createStore({ count: 0 });

    store.setState({ count: 1 });

    expect(store.getState()).toEqual({ count: 1 });
  });

  test("getState returns the current state", () => {
    const store = createStore({ count: 0 });

    expect(store.getState()).toEqual({ count: 0 });
  });

  test("subscribe fires when state changes", () => {
    const store = createStore({ count: 0 });
    const listener = jest.fn();
    const unsubscribe = store.subscribe(listener);

    store.setState({ count: 1 });

    expect(listener).toHaveBeenCalledTimes(1);

    unsubscribe();
    store.setState({ count: 2 });

    expect(listener).toHaveBeenCalledTimes(1);
  });

  test("useStore fires when store state is updated", () => {
    const store = createStore({ some: "value", count: 0 });

    const listener = jest.fn();

    function StoreRenderTest() {
      const state = useStore(store);

      React.useEffect(() => {
        listener(state);
      }, [state]);

      return null;
    }

    render(<StoreRenderTest />);

    expect(listener).toHaveBeenLastCalledWith({ some: "value", count: 0 });

    act(() => {
      store.setState({ some: "changed", count: 1 });
    });

    expect(listener).toHaveBeenLastCalledWith({ some: "changed", count: 1 });
    expect(listener).toHaveBeenCalledTimes(2);
  });

  test("useStore with selector only fires when the selected state changes", () => {
    const store = createStore({ count: 0, label: "a" });
    const listener = jest.fn();

    function StoreRenderTest() {
      const count = useStore(store, (state) => state.count);

      React.useEffect(() => {
        listener(count);
      }, [count]);

      return null;
    }

    render(<StoreRenderTest />);

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenLastCalledWith(0);

    act(() => {
      store.setState((prev) => ({ ...prev, label: "b" }));
    });

    expect(listener).toHaveBeenCalledTimes(1);

    act(() => {
      store.setState((prev) => ({ ...prev, count: 1 }));
    });

    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenLastCalledWith(1);
  });
});
