import { createStore } from "@rn-toolkit/core";
import * as React from "react";
import { View, StyleSheet } from "react-native";

const BackgroundColorContext = React.createContext<string | null>(null);

export function createBackgroundProvider() {
  let store = createStore<{ backgroundColor: string }, "">();

  function Provider({ children }: { children: React.ReactNode }) {
    const backgroundColor = React.useContext(BackgroundColorContext);
    const [bg, setBg] = React.useState<string | null>(null);

    React.useEffect(() => {
      let unsub = store.subscribe((state) => {
        if (backgroundColor == null) {
          setBg(state.backgroundColor);
        }
      });

      return () => unsub();
    }, [backgroundColor]);

    let color = "transparent";

    if (bg != null) {
      color = bg;
    }

    return (
      <BackgroundColorContext.Provider value={bg}>
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: color }]}
        />
        {children}
      </BackgroundColorContext.Provider>
    );
  }

  function setBackgroundColor(color: string) {
    store.setState({ backgroundColor: color });
  }

  function getBackgroundColor(color: string) {
    store.getState().backgroundColor;
  }

  return {
    setBackgroundColor,
    getBackgroundColor,
    Provider,
  };
}

export const Background = createBackgroundProvider();
