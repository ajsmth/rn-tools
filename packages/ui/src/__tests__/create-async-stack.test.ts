import { createAsyncStack } from "../create-async-stack";

test("export", () => {
  expect(createAsyncStack).toBeDefined();
});

test("pushing", async () => {
  const stack = createAsyncStack();
  const listener = jest.fn();
  stack.subscribe(listener);

  expect(stack.getState().items.length).toEqual(0);

  const item = stack.push();
  expect(item.status).toEqual("pushing");
  expect(stack.getState().items.length).toEqual(1);
  expect(listener).toHaveBeenLastCalledWith({
    event: expect.objectContaining({ action: "pushstart" }),
    state: expect.objectContaining({ items: [item] }),
  });

  item.onPushEnd();
  expect(item.status).toEqual("settled");
  expect(listener).toHaveBeenLastCalledWith({
    event: expect.objectContaining({ action: "pushend" }),
    state: expect.objectContaining({ items: [item] }),
  });
});

test("popping", () => {
  const stack = createAsyncStack();
  const listener = jest.fn();
  stack.subscribe(listener);

  const item = stack.push();

  stack.pop();
  expect(item.status).toEqual("popping");
  expect(listener).toHaveBeenLastCalledWith({
    event: expect.objectContaining({ action: "popstart" }),
    state: expect.objectContaining({ items: [item] }),
  });

  item.onPopEnd();
  expect(stack.getState().items.length).toEqual(0);
  expect(listener).toHaveBeenLastCalledWith({
    event: expect.objectContaining({ action: "popend" }),
    state: expect.objectContaining({ items: [] }),
  });
});

test("pop a specific number from the top", () => {
  const stack = createAsyncStack();

  const item1 = stack.push();
  const item2 = stack.push();
  const item3 = stack.push();

  stack.pop(2);

  expect(item3.status).toEqual("popping");
  expect(item2.status).toEqual("popping");
  expect(item1.status).toEqual("pushing");
});

test("pop all with -1", () => {
  const stack = createAsyncStack();
  const item1 = stack.push();
  const item2 = stack.push();
  const item3 = stack.push();

  stack.pop(-1);

  expect(item3.status).toEqual("popping");
  expect(item2.status).toEqual("popping");
  expect(item1.status).toEqual("popping");
});

test("pop before onPushEnd() is called", () => {
  const stack = createAsyncStack();
  const listener = jest.fn();
  stack.subscribe(listener);

  const item = stack.push();

  expect(listener).toHaveBeenLastCalledWith({
    event: expect.objectContaining({ action: "pushstart" }),
    state: expect.objectContaining({ items: [item] }),
  });

  stack.pop();
  item.onPopEnd();

  const events = listener.mock.calls.map((call) => call[0].event.action);
  expect(events).toEqual(["pushstart", "pushend", "popstart", "popend"]);
});

test("unable to pushend more than once", () => {
  const stack = createAsyncStack();

  const item = stack.push();
  item.onPushEnd();
});

test("unable to popend more than once", () => {
  const stack = createAsyncStack();

  const item = stack.push();
  stack.pop();
  item.onPopEnd();
});

test("passes data to items", () => {
  const stack = createAsyncStack<{ test: string }>();
  const item = stack.push({ test: "value" });

  expect(item.data?.test).toEqual("value");
});

test.todo("unable to onPopEnd a stack item that is pushing");
test.todo("await promise on push -> returns stack item");
test.todo("await promise on pop -> returns stack item");
