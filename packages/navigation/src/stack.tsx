import * as React from "react";
import {
  RenderTreeNode,
  useRenderNode,
  nextRenderTreeIdForType,
} from "@rn-tools/core";
import {
  useStackScreens,
  useNavigation,
  STACK_TYPE,
  SCREEN_TYPE,
  type PushOptions,
} from "./navigation-client";

// TODO - replace with custom implementation
import * as RNScreens from "react-native-screens";
import { StyleSheet } from "react-native";

export type StackHandle = {
  push: (element: React.ReactElement, options?: PushOptions) => void;
  pop: () => void;
};

export type StackProps = {
  id?: string;
  active?: boolean;
  rootScreen?: React.ReactElement;
  children?: React.ReactNode;
};

const StackRoot = React.memo(
  React.forwardRef<StackHandle, StackProps>(function StackRoot(props, ref) {
    const stackId = React.useRef(
      props.id ?? nextRenderTreeIdForType(STACK_TYPE),
    ).current;
    const navigation = useNavigation();

    React.useImperativeHandle(
      ref,
      () => ({
        push(element: React.ReactElement, options?: PushOptions) {
          navigation.push(element, { ...options, stack: stackId });
        },
        pop() {
          navigation.pop({ stack: stackId });
        },
      }),
      [stackId, navigation],
    );

    return (
      <RenderTreeNode type={STACK_TYPE} id={stackId} active={props.active}>
        <RNScreens.ScreenStack style={StyleSheet.absoluteFill}>
          {props.rootScreen && <StackScreen>{props.rootScreen}</StackScreen>}
          {props.children}
        </RNScreens.ScreenStack>
      </RenderTreeNode>
    );
  }),
);

export type StackScreenProps = {
  id?: string;
  active?: boolean;
  children: React.ReactNode;
};

const defaultStyle = StyleSheet.create({
  screen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "white",
  },
});

const StackScreen = React.memo(function StackScreen(props: StackScreenProps) {
  return (
    <RNScreens.Screen style={defaultStyle.screen}>
      <RenderTreeNode type={SCREEN_TYPE} id={props.id} active={props.active}>
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
      {screens.map((screen, index, arr) => {
        if (screen.options?.wrapped === false) {
          return (
            <RenderTreeNode
              key={screen.options?.id ?? index}
              type={SCREEN_TYPE}
              id={screen.options?.id}
              active={index === arr.length - 1}
            >
              {screen.element}
            </RenderTreeNode>
          );
        }

        return (
          <StackScreen
            id={screen.options?.id}
            key={screen.options?.id ?? index}
            active={index === arr.length - 1}
          >
            {screen.element}
          </StackScreen>
        );
      })}
    </React.Fragment>
  );
});

export const Stack = React.memo(
  React.forwardRef<StackHandle, Omit<StackProps, "children">>(
    function Stack(props, ref) {
      return (
        <StackRoot ref={ref} {...props}>
          <StackSlot />
        </StackRoot>
      );
    },
  ),
);
