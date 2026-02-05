import { Platform } from 'react-native';

export let generateStackId = createIdGenerator("stack");
export let generateScreenId = createIdGenerator("screen");
export let generateTabId = createIdGenerator("tab");

function createIdGenerator(name: string) {
  let counter = 0;

  return function generateId() {
    return name + "-" + counter++;
  };
}

export let serializeTabIndexKey = (tabId: string, index: number) =>
  `${tabId}-${index}`;




let baseInsets = {
  top: Platform.OS === "ios" ? 59 : 49,
  bottom: Platform.OS === "ios" ? 34 : 0,
  right: 0,
  left: 0,
};

export function useSafeAreaInsetsSafe() {
  let insets = baseInsets;

  try {
    // Linter thinks this is conditional but it seems fine
    // eslint-disable-next-line
    insets = baseInsets;
  } catch (error) {
    console.warn("`react-native-safe-area-context` missing - Please install and wrap your app in a SafeAreaProvider");
  }

  return insets;
}
