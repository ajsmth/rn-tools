export function requireNativeModule() {
  return {
    addListener: () => ({ remove: () => {} }),
  };
}
