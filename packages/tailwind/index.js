import * as React from "react";

let transformProps = ["translate", "rotate", "scale", "skew"];
let memo = {};
function getStyles(styles, styleSheet) {
  if (memo[styles]) {
    return memo[styles];
  }
  let tailwindStyle = {};
  let transform = [];
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

const TailwindWrapper = React.forwardRef((props, ref) => {
  let {
    component: Component,
    styles = "",
    styleSheet = {},
    style = {},
    ...rest
  } = props;

  let tailwindStyle = getStyles(styles, styleSheet);
  return React.createElement(
    Component,
    Object.assign(rest, {
      ref,
      style: [tailwindStyle, style],
    })
  );
});

export default TailwindWrapper;
