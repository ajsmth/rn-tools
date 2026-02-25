import * as React from "react";

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
  flatten: (style: unknown) => style,
};

class AnimatedValue {
  private value: number;

  constructor(initialValue: number) {
    this.value = initialValue;
  }

  setValue(nextValue: number) {
    this.value = nextValue;
  }
}

function completeAnimation(
  callback?: (result: { finished: boolean }) => void,
) {
  callback?.({ finished: true });
}

export const Animated = {
  Value: AnimatedValue,
  View: function AnimatedView(props: { children?: unknown }) {
    return React.createElement("AnimatedView", props, props.children);
  },
  timing: () => ({
    start: completeAnimation,
  }),
  parallel: () => ({
    start: completeAnimation,
  }),
};

export const Easing = {
  cubic: "cubic",
  out: () => "out",
  in: () => "in",
};

export function useWindowDimensions() {
  return { width: 375, height: 812 };
}

export function View(props: { children?: unknown }) {
  return React.createElement("View", props, props.children);
}

export function Text(props: { children?: unknown }) {
  return React.createElement("Text", props, props.children);
}

export function Pressable(
  props: { children?: unknown; onPress?: () => void; testID?: string },
) {
  return React.createElement("Pressable", props, props.children);
}
