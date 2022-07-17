import * as React from "react";
import { Platform } from "react-native";
type TailwindWrapperProps = any & {
  component: any;
  styleSheet: any;
  styles: string;
  children: React.ReactNode;
};

let transformProps = ["translate", "rotate", "scale", "skew"];
let memo = {};
function getStyles(styles: string, styleSheet: any) {
  if (memo[styles]) {
    return memo[styles];
  }
  let tailwindStyle: any = {};
  let transform: any[] = [];
  for (let className of styles.split(" ")) {
    if (className != null && styleSheet[className] != null) {
      let styleValue = styleSheet[className];
      if (transformProps.filter((t) => className.includes(t)).length > 0) {
        if (!transform) {
          transform = [];
        }
        transform.push(styleValue);
      } else {
        Object.assign(tailwindStyle, styleValue);
      }
    }
  }
  if (transform.length > 0) {
    tailwindStyle.transform = transform;
  }
  memo[styles] = tailwindStyle;
  return tailwindStyle;
}

export default function TailwindWrapper(props: TailwindWrapperProps) {
  let {
    component: Component,
    styles = "",
    styleSheet = {},
    style = {},
    ...rest
  } = props;
  let tailwindStyle = getStyles(styles, styleSheet);
  return React.createElement(Component, {
    style: [tailwindStyle, style],
    ...rest,
  });
}
