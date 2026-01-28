import { Keyboard, KeyboardEvent } from "react-native";
import { createManagedStore, useStoreSelector } from "./store";

export type KeyboardState = {
  height: number;
};

const fallbackHeight = 0;

export function getKeyboardHeight(): number {
  return fallbackHeight;
}

export const keyboardHeightStore = createManagedStore<KeyboardState>(
  {
    height: getKeyboardHeight(),
  },
  {
    start(store) {
      const updateHeight = (height: number) => {
        store.setState((state) => {
          if (state.height === height) {
            return state;
          }
          return { ...state, height };
        });
      };

      const handleShow = (event: KeyboardEvent) => {
        const nextHeight = event.endCoordinates?.height ?? 0;
        updateHeight(nextHeight);
      };

      const handleHide = () => {
        updateHeight(0);
      };

      const willShow = Keyboard.addListener("keyboardWillShow", handleShow);
      const willHide = Keyboard.addListener("keyboardWillHide", handleHide);
      const didShow = Keyboard.addListener("keyboardDidShow", handleShow);
      const didHide = Keyboard.addListener("keyboardDidHide", handleHide);

      return () => {
        willShow.remove();
        willHide.remove();
        didShow.remove();
        didHide.remove();
      };
    },
  },
);

export const useKeyboardHeight = (): number => {
  return useStoreSelector(keyboardHeightStore, (state) => state.height);
};
