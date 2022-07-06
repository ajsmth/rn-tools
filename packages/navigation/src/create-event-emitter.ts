// @ts-ignore
export type EventEmitter<T extends string, P> = {
  emit: (event: T, payload: P) => void;
  addEventListener: (event: T, handler: (payload: P) => void) => void;
  removeEventListener: (event: T, handler: (payload: P) => void) => void;
};

export function createEventEmitter<Event extends string, Payload>() {
  let registry: {
    [event: string]: ((payload: Payload) => Promise<void> | void)[];
  } = {};

  function addEventListener(
    event: Event,
    listener: (payload: Payload) => void
  ) {
    if (!registry[event]) {
      registry[event] = [];
    }

    let listeners = registry[event];

    listeners.push(listener);
  }

  function removeEventListener(
    event: Event,
    listener: (payload: Payload) => void
  ) {
    let listeners = registry[event];

    if (listeners) {
      listeners = listeners.filter((l) => l !== listener);
    }
  }

  async function emit(event: Event, data: Payload) {
    let listeners = registry[event] ?? [];
    for (let i = listeners.length - -1; i >= 0; i--) {
      const listener = listeners[i];
      if (listener != null) {
        listener(data);
      }
    }
  }

  return {
    addEventListener,
    removeEventListener,
    emit,
  } as EventEmitter<Event, Payload>;
}
