export function requireNativeViewManager() {
  return "div";
}

export function requireNativeModule() {
  return {
    addListener: () => ({ remove: () => {} }),
  };
}
