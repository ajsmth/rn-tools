import * as React from "react";
import { RenderTreeNode, useRenderNode } from "@rn-tools/core";
import {
  useStackScreens,
  useNavigation,
  type PushScreenOptions,
} from "./navigation";

// TODO - replace with custom implementation
import * as RNScreens from "react-native-screens";
import { StyleSheet } from "react-native";

export type StackHandle = {
  pushScreen: (element: React.ReactElement, options?: PushScreenOptions) => void;
  popScreen: () => void;
};

export type StackProps = {
  id?: string;
  active?: boolean;
  rootScreen?: React.ReactElement;
  children?: React.ReactNode;
};

const StackRoot = React.memo(function StackRoot(props: StackProps) {
  return (
    <RenderTreeNode type="stack" id={props.id} active={props.active}>
      <RNScreens.ScreenStack style={StyleSheet.absoluteFill}>
        {props.rootScreen && <StackScreen>{props.rootScreen}</StackScreen>}
        {props.children}
      </RNScreens.ScreenStack>
    </RenderTreeNode>
  );
});

export type StackScreenProps = {
  id?: string;
  active?: boolean;
  children: React.ReactNode;
};

const StackScreen = React.memo(function StackScreen(props: StackScreenProps) {
  return (
    <RNScreens.Screen style={StyleSheet.absoluteFill}>
      <RenderTreeNode type="screen" id={props.id} active={props.active}>
        {props.children}
      </RenderTreeNode>
    </RNScreens.Screen>
  );
});

const StackSlot = React.memo(function StackSlot() {
  const node = useRenderNode();
  const stackKey = node?.id ?? null;
  const screens = useStackScreens(stackKey);

  return (
    <React.Fragment>
      {screens.map((screen, index, arr) => (
        <StackScreen
          id={screen.options?.id}
          key={screen.options?.id ?? index}
          active={index === arr.length - 1}
        >
          {screen.element}
        </StackScreen>
      ))}
    </React.Fragment>
  );
});

export const Stack = React.memo(
  React.forwardRef<StackHandle, Omit<StackProps, "children">>(
    function Stack(props, ref) {
      const navigation = useNavigation();
      const node = useRenderNode();
      const stackId = props.id ?? node?.id ?? null;

      React.useImperativeHandle(ref, () => ({
        pushScreen(element: React.ReactElement, options?: PushScreenOptions) {
          if (stackId) {
            navigation.pushScreen(element, { ...options, stackId });
          }
        },
        popScreen() {
          if (stackId) {
            navigation.popScreen({ stackId });
          }
        },
      }), [stackId, navigation]);

      return (
        <StackRoot {...props}>
          <StackSlot />
        </StackRoot>
      );
    },
  ),
);
