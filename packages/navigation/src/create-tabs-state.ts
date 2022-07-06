import { createEventEmitter } from "./create-event-emitter";

export function createTabState(initialData?: any) {
  let extraData = initialData ?? {};

  let activeIndex = -1;

  let screens = {
    ids: [] as number[],
    byId: {} as any,
  };

  let eventEmitter = createEventEmitter();

  let i = 0;

  function createScreenId() {
    i += 1;
    return i;
  }

  function addScreen(data: any) {
    const id = createScreenId();
    const fns = {
      jumpEnd: () => onJumpEnd(id),
    };
    const screen = {
      id,
      data,
      fns,
      status: "idle",
    };
    screens.ids.push(id);
    screens.byId[id] = screen;
    eventEmitter.emit("add", screen);
    return screen;
  }

  function removeScreen(id: number) {
    const screen = screens.byId[id];
    if (screen != null) {
      eventEmitter.emit("remove", screen);
      screens.ids = screens.ids.filter((i) => i !== id);
      delete screens.byId[id];
    }
  }

  function jumpTo(index: number) {
    const id = screens.ids[index];
    const screen = screens.byId[id];
    if (screen != null) {
      activeIndex = index;
      screen.status === "jumping";
      eventEmitter.emit("jumpstart", screen);
    }
  }

  function onJumpEnd(id: number) {
    const screen = screens.byId[id];
    if (screen != null) {
      screen.status === "active";
      eventEmitter.emit("jumpend", screen);
    }
  }

  function getState() {
    const _screens = screens.ids.map((id) => screens.byId[id]);
    return {
      screens: _screens,
      activeScreen: _screens[activeIndex],
      extraData,
    };
  }

  function setState(newState: any) {
    extraData = {
      ...extraData,
      ...newState,
    };
    eventEmitter.emit("statechange", extraData);
  }

  const events = ["statechange", "add", "remove"];

  function listen(listener: any) {
    const unlisteners: any[] = [];
    events.forEach((event) => {
      eventEmitter.addEventListener(event, listener);
      unlisteners.push(() => eventEmitter.removeEventListener(event, listener));
    });

    return () => {
      unlisteners.forEach((l) => l());
    };
  }

  return {
    addScreen,
    removeScreen,
    jumpTo,
    getState,
    setState,
    listen,
  };
}
