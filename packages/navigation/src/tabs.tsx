import * as React from "react";
import {
  RenderTreeNode,
  useRenderNode,
  useSafeAreaInsets,
} from "@rn-tools/core";
import { useTabActiveIndex, useNavigationStore } from "./navigation";

import * as RNScreens from "react-native-screens";
import { StyleSheet, View, type ViewStyle } from "react-native";

export type TabScreenEntry = {
  id: string;
  screen: React.ReactElement;
  tab: (props: {
    id: string;
    isActive: boolean;
    onPress: () => void;
  }) => React.ReactElement;
};

export type TabsProps = {
  id?: string;
  active?: boolean;
  screens: TabScreenEntry[];
  tabbarPosition?: "top" | "bottom";
  tabbarStyle?: ViewStyle;
  children?: React.ReactNode;
};

function TabsRoot(props: TabsProps) {
  return (
    <RenderTreeNode type="tabs" id={props.id} active={props.active}>
      {props.children}
    </RenderTreeNode>
  );
}

function TabBar(props: {
  screens: TabScreenEntry[];
  style?: ViewStyle;
  position: "top" | "bottom";
}) {
  const node = useRenderNode();
  const tabsId = node?.id ?? null;
  const activeIndex = useTabActiveIndex(tabsId);
  const navStore = useNavigationStore();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.tabbar,
        props.position === "top" && { paddingTop: insets.top },
        props.position === "bottom" && { paddingBottom: insets.bottom },
        props.style,
      ]}
    >
      {props.screens.map((entry, index) => (
        <React.Fragment key={entry.id}>
          {entry.tab({
            id: entry.id,
            isActive: index === activeIndex,
            onPress: () => {
              if (tabsId) {
                navStore.setState((prev) => {
                  const tabs = new Map(prev.tabs);
                  tabs.set(tabsId, { activeIndex: index });
                  return { ...prev, tabs };
                });
              }
            },
          })}
        </React.Fragment>
      ))}
    </View>
  );
}

function TabsSlot(props: { screens: TabScreenEntry[] }) {
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
}

export function Tabs(props: Omit<TabsProps, "children">) {
  const position = props.tabbarPosition ?? "bottom";
  const tabbar = (
    <TabBar
      screens={props.screens}
      style={props.tabbarStyle}
      position={position}
    />
  );

  return (
    <TabsRoot {...props}>
      {position === "top" && tabbar}
      <View style={{ flex: 1 }}>
        <TabsSlot screens={props.screens} />
      </View>
      {position === "bottom" && tabbar}
    </TabsRoot>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
});
