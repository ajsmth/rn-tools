import create from "@rn-toolkit/tailwind";
import { createPrimitive } from "@rn-toolkit/primitives";

import {
  View as RNView,
  Text as RNText,
  Pressable as RNPressable,
} from "react-native";

import styles from "./styles.json";
const fn = create(styles);

export const View = createPrimitive(RNView, fn);

export const Text = createPrimitive(RNText, fn, { accessibilityRole: "text" });

export const Heading = createPrimitive(RNText, fn, {
  accessibilityRole: "header",
});

export const Pressable = createPrimitive(RNPressable, fn, {
  accessibilityRole: "button",
});
