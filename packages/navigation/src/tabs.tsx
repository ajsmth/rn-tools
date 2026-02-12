import * as React from "react";
import {
  RenderTreeNode,
  useRenderNode,
  useSafeAreaInsets,
  nextRenderTreeIdForType,
} from "@rn-tools/core";
import {
  useTabActiveIndex,
  useNavigationStore,
  useNavigation,
} from "./navigation-client";

import * as RNScreens from "react-native-screens";
import { StyleSheet, View, type ViewStyle } from "react-native";

export type TabScreenOptions = {
  id: string;
  screen: React.ReactElement;
  tab: (props: {
    id: string;
    isActive: boolean;
    onPress: () => void;
  }) => React.ReactElement;
};

export type TabsHandle = {
  setActiveIndex: (index: number) => void;
};

export type TabsProps = {
  id?: string;
  active?: boolean;
  screens: TabScreenOptions[];
  tabbarPosition?: "top" | "bottom";
  tabbarStyle?: ViewStyle;
  children?: React.ReactNode;
};

const TabsRoot = React.memo(
  React.forwardRef<TabsHandle, TabsProps>(function TabsRoot(props, ref) {
    const tabsId = React.useRef(
      props.id ?? nextRenderTreeIdForType("tabs"),
    ).current;
    const navigation = useNavigation();

    React.useImperativeHandle(
      ref,
      () => ({
        setActiveIndex(index: number) {
          navigation.setActiveTab(index, { tabsId });
        },
      }),
      [tabsId, navigation],
    );

    return (
      <RenderTreeNode type="tabs" id={tabsId} active={props.active}>
        {props.children}
      </RenderTreeNode>
    );
  }),
);

const TabBar = React.memo(function TabBar(props: {
  screens: TabScreenOptions[];
  style?: ViewStyle;
  position: "top" | "bottom";
}) {
  const node = useRenderNode();
  const tabsId = node?.id ?? null;
  const activeIndex = useTabActiveIndex(tabsId);
  const navStore = useNavigationStore();
  const insets = useSafeAreaInsets();

  const tabbarStyle = React.useMemo(
    () => [
      styles.tabbar,
      props.position === "top" && { paddingTop: insets.top },
      props.position === "bottom" && { paddingBottom: insets.bottom },
      props.style,
    ],
    [props.position, props.style, insets.top, insets.bottom],
  );

  const handlePress = React.useCallback(
    (index: number) => {
      if (tabsId) {
        navStore.setState((prev) => {
          const tabs = new Map(prev.tabs);
          tabs.set(tabsId, { activeIndex: index });
          return { ...prev, tabs };
        });
      }
    },
    [tabsId, navStore],
  );

  return (
    <View style={tabbarStyle}>
      {props.screens.map((entry, index) => (
        <React.Fragment key={entry.id}>
          {entry.tab({
            id: entry.id,
            isActive: index === activeIndex,
            onPress: () => handlePress(index),
          })}
        </React.Fragment>
      ))}
    </View>
  );
});

const TabsSlot = React.memo(function TabsSlot(props: {
  screens: TabScreenOptions[];
}) {
  const node = useRenderNode();
  const tabsId = node?.id ?? null;
  const activeIndex = useTabActiveIndex(tabsId);

  return (
    <RNScreens.ScreenContainer style={StyleSheet.absoluteFill}>
      {props.screens.map((entry, index) => (
        <RNScreens.Screen
          key={entry.id}
          activityState={index === activeIndex ? 2 : 0}
          style={StyleSheet.absoluteFill}
        >
          <RenderTreeNode
            type="tab-screen"
            id={`${tabsId}/${entry.id}`}
            active={index === activeIndex}
          >
            {entry.screen}
          </RenderTreeNode>
        </RNScreens.Screen>
      ))}
    </RNScreens.ScreenContainer>
  );
});

export const Tabs = React.memo(
  React.forwardRef<TabsHandle, Omit<TabsProps, "children">>(
    function Tabs(props, ref) {
      const position = props.tabbarPosition ?? "bottom";

      const tabbar = React.useMemo(
        () => (
          <TabBar
            screens={props.screens}
            style={props.tabbarStyle}
            position={position}
          />
        ),
        [props.screens, props.tabbarStyle, position],
      );

      return (
        <TabsRoot ref={ref} {...props}>
          {position === "top" && tabbar}
          <View style={styles.slotContainer}>
            <TabsSlot screens={props.screens} />
          </View>
          {position === "bottom" && tabbar}
        </TabsRoot>
      );
    },
  ),
);

const styles = StyleSheet.create({
  tabbar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  slotContainer: {
    flex: 1,
  },
});
