export const Platform = {
  OS: "ios",
  select: (options: Record<string, unknown>) => options.ios,
};

export const Keyboard = {
  addListener: () => ({ remove: () => {} }),
};

export const StyleSheet = {
  absoluteFill: {},
  absoluteFillObject: {},
  create: (styles: Record<string, unknown>) => styles,
};

export function useWindowDimensions() {
  return { width: 375, height: 812 };
}

export function View(props: { children?: unknown }) {
  return props.children;
}

export function Text(props: { children?: unknown }) {
  return props.children;
}
