import { createEventEmitter } from "./create-event-emitter";

export type Store<State extends object, Event extends string> = {
  subscribe: (subscriber: (state: State) => void) => () => void;
  getState: () => State;
  setState: (state: Partial<State>) => void;
  listen: (event: Event, listener: (state: State) => void) => () => void;
  emit: (event: Event) => void;
};

export function createStore<State extends object, Event extends string>(
  initialState: State = {} as State
): Store<State, Event> {
  let state: State = initialState ?? {};
  let subscribers: any[] = [];
  let emitter = createEventEmitter<Event, State>();

  function setState(updates: Partial<State>) {
    state = {
      ...state,
      ...updates,
    };

    subscribers.forEach((s) => s(state));
  }

  function getState(): State {
    return state;
  }

  function subscribe(subscriber: any) {
    subscribers.push(subscriber);
    return () => (subscribers = subscribers.filter((s) => s !== subscriber));
  }

  function emit(event: Event) {
    let state = getState();
    emitter.emit(event, state);
  }

  function listen(event: Event, handler: (payload: State) => void) {
    emitter.addEventListener(event, handler);
    return () => emitter.removeEventListener(event, handler);
  }

  return {
    subscribe,
    getState,
    setState,
    emit,
    listen,
  };
}
