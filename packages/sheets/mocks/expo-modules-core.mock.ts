export function requireNativeViewManager() {
  return function NativeViewMock(props: { children?: unknown }) {
    return props.children;
  };
}

export function requireNativeModule() {
  return {
    addListener: () => ({ remove: () => {} }),
  };
}
