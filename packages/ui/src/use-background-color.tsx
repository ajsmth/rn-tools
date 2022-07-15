// TODO!

// import * as React from "react";
// import { Animated } from "react-native";

// import { Stack } from "./create-async-stack";

// export function useBackgroundColor(stack: Stack<{ backgroundColor?: string }>) {
//   const animatedValue = React.useRef(new Animated.Value(0));
//   const bgColorHistory = React.useRef<string[]>([]);

//   const [colorStack, setColorStack] = React.useState(["rgba(0,0,0,0.0)"]);

//   React.useEffect(() => {
//     const unsub = stack.subscribe(({ state, event }) => {
//       if (event.action === "pushstart") {
//         const item = state.getItemByKey(event.key);

//         if (item?.data.backgroundColor != null) {
//           const currentColor =
//             bgColorHistory.current[bgColorHistory.current.length - 1] ||
//             "rgba(0,0,0,0.0)";

//           bgColorHistory.current.push(item.data.backgroundColor);

//           const nextColor =
//             bgColorHistory.current[bgColorHistory.current.length - 1];

//           setColorStack([currentColor, nextColor]);

//           animatedValue.current.stopAnimation();
//           animatedValue.current.setValue(0);

//           Animated.spring(animatedValue.current, {
//             toValue: 1,
//             useNativeDriver: false,
//           }).start();
//         }
//       }

//       if (event.action === "popstart") {
//         const item = state.getItemByKey(event.key);

//         if (item?.data.backgroundColor != null) {
//           const currentColor =
//             bgColorHistory.current.pop() || "rgba(0,0,0,0.0)";
//           const previousColor =
//             bgColorHistory.current[bgColorHistory.current.length - 1] ||
//             "rgba(0,0,0,0.0)";

//           animatedValue.current.stopAnimation();
//           animatedValue.current.setValue(0);

//           setColorStack([currentColor, previousColor]);

//           Animated.spring(animatedValue.current, {
//             toValue: 1,
//             useNativeDriver: false,
//           }).start();
//         }
//       }
//     });

//     return () => {
//       unsub();
//     };
//   }, []);

//   const backgroundColor =
//     colorStack.length <= 1
//       ? "rgba(0,0,0,0.0)"
//       : animatedValue.current.interpolate({
//           inputRange: [0, 1],
//           outputRange: [colorStack[0], colorStack[1]],
//         });

//   return backgroundColor;
// }
