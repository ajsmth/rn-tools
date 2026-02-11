import { Keyboard, KeyboardEvent } from "react-native";
import { createStore, useStore } from "./store";

export type KeyboardState = {
  height: number;
};

const fallbackHeight = 0;

export function getKeyboardHeight(): number {
  return fallbackHeight;
}

export const keyboardHeightStore = createStore<KeyboardState>({
  height: getKeyboardHeight(),
});

const updateHeight = (height: number) => {
  keyboardHeightStore.setState((state) => {
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

Keyboard.addListener("keyboardWillShow", handleShow);
Keyboard.addListener("keyboardWillHide", handleHide);
Keyboard.addListener("keyboardDidShow", handleShow);
Keyboard.addListener("keyboardDidHide", handleHide);

export const useKeyboardHeight = (): number => {
  return useStore(keyboardHeightStore, (state) => state.height);
};
