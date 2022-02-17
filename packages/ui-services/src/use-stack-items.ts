import * as React from "react";
import { Stack, StackItem } from "./create-async-stack";

function useStackItems<T>(stack: Stack<T>) {
  const [items, setItems] = React.useState<StackItem<T>[]>([]);

  React.useEffect(() => {
    const unsubscribe = stack.subscribe(({ state }) => {
      setItems(state.items);
    });

    return () => unsubscribe();
  }, []);

  return items;
}

export { useStackItems };
