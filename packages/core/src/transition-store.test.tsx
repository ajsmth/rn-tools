import { EVENTS, STATUSES, createTransitionStore } from "./transition-store";
import * as React from "react";
import { render, act } from "@testing-library/react-native";
import { Pressable } from "mocks/react-native.mock";

describe("createTransitionStore()", () => {
  it("can add entries", () => {
    const store = createTransitionStore();
    expect(store.getState().entries.length).toEqual(0);

    store.add("test1");
    expect(store.getState().entries.length).toEqual(1);
  });

  it("can get entries by id", () => {
    const store = createTransitionStore();
    const testId = "test2";

    store.add(testId);
    const entry = store.getEntry(testId);
    expect(entry).toBeDefined();
  });

  it("transitions states", () => {
    const store = createTransitionStore();
    const testId = "test1";

    store.add(testId);
    store.transition(testId, EVENTS.OPEN);

    let entry = store.getEntry(testId);
    expect(entry?.status).toEqual(STATUSES.OPENING);

    store.transition(entry.id, EVENTS.OPENED);
    entry = store.getEntry(testId);
    expect(entry.status).toEqual(STATUSES.OPEN);

    store.transition(entry.id, EVENTS.CLOSE);
    entry = store.getEntry(testId);
    expect(entry.status).toEqual(STATUSES.CLOSING);

    store.transition(entry.id, EVENTS.OPEN);
    entry = store.getEntry(testId);
    expect(entry.status).toEqual(STATUSES.OPENING);

    store.transition(entry.id, EVENTS.OPENED);
    entry = store.getEntry(testId);
    expect(entry.status).toEqual(STATUSES.OPEN);

    store.transition(entry.id, EVENTS.CLOSE);
    entry = store.getEntry(testId);
    expect(entry.status).toEqual(STATUSES.CLOSING);

    store.transition(entry.id, EVENTS.CLOSED);
    entry = store.getEntry(testId);
    expect(entry.status).toEqual(STATUSES.CLOSED);
  });

  it("unmounts entries", () => {
    const store = createTransitionStore();
    const testId = "test3";

    store.add(testId);
    store.transition(testId, EVENTS.UNMOUNT);

    expect(store.getEntry(testId)).toBeUndefined();
  });

  it("cannot add the same id twice", () => {
    const store = createTransitionStore();
    const testId = "test6";

    store.add(testId);
    store.transition(testId, EVENTS.OPEN);
    store.add(testId);

    expect(store.getEntry(testId).status).toEqual(STATUSES.OPENING);
  });

  it("provides useEntry hook", () => {
    const store = createTransitionStore();
    const listener = jest.fn();

    function MyTestComponent({ testId }: { testId: string }) {
      const entry = store.useEntry(testId);

      React.useEffect(() => {
        listener(entry);
      }, [entry]);

      return null;
    }

    const testId = "test4";
    const { rerender } = render(<MyTestComponent testId={testId} />);

    act(() => {
      store.add(testId);
    });

    act(() => {
      store.transition(testId, EVENTS.OPEN);
      rerender(<MyTestComponent testId={testId} />);
    });

    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: testId,
        status: STATUSES.OPENING,
      }),
    );

    act(() => {
      store.transition(testId, EVENTS.OPENED);
      rerender(<MyTestComponent testId={testId} />);
    });

    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: testId,
        status: STATUSES.OPEN,
      }),
    );

    // Invalid update - shouldnt trigger render
    act(() => {
      store.transition(testId, EVENTS.CLOSED);
      rerender(<MyTestComponent testId={testId} />);
    });

    expect(listener).not.toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: testId,
        status: STATUSES.CLOSED,
      }),
    );

    expect(listener).toHaveBeenLastCalledWith(
      expect.objectContaining({
        id: testId,
        status: STATUSES.OPEN,
      }),
    );
  });

  test("adding elements and props", () => {
    const store = createTransitionStore();
    const listener = jest.fn();

    function MyElement({ id }) {
      const entry = store.useEntry(id);
      React.useEffect(() => listener(entry), [entry]);
      return null;
    }

    store.add("1", <MyElement id="1" />, { test: "value" });
    render(<MyElement id="1" />);

    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({
        element: expect.any(Object),
        props: { test: "value" },
      }),
    );
  });
});
