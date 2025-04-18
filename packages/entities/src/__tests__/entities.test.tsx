import { createStore } from "../entities";

let sleep = (timeout: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });

  jest.useRealTimers()

describe("createStore", () => {
  test("export", () => {
    expect(createStore).toBeDefined();
  });

  test('updates are applied', async () => {
    let store = createStore({ key1: "value", key2: "value2" }, { batchTimeoutMs: 1 });
    store.setState({ key1: "updated1" });
    await sleep(1)
    let state = store.storeInstance.getState()
    expect(state.key1).toEqual("updated1")
  })

  test("batch updates", async () => {
    let store = createStore({ key1: "value", key2: "value2" }, { batchTimeoutMs: 1 });
    let spy = jest.spyOn(store.storeInstance, "setState");

    store.setState({ key1: "updated1" });
    store.setState({ key2: "updated2" });

    await sleep(1)
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
