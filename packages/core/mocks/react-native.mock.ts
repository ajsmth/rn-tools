export const Platform = {
  OS: "ios",
  select: (options: Record<string, unknown>) => options.ios,
};

export const Keyboard = {
  addListener: () => ({ remove: () => {} }),
};

export const StyleSheet = {
  absoluteFill: {},
  create: (styles: Record<string, unknown>) => styles,
};

export const View = "View";
export const Text = "Text";
