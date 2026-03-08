import * as React from "react";
import { TABS_SCREEN, TabStoreContext } from "./tabs-constants";
import { TreeNode, useStore } from "@rn-tools/core";
import * as RNScreens from "react-native-screens";
import {
  StyleProp,
  StyleSheet,
  ViewStyle,
  View,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "@rn-tools/core";

type TabProps = {
  id?: string;
  screens: TabScreen[];
  tabbarPosition?: "top" | "bottom";
  tabbarContainerStyle?: StyleProp<ViewStyle>;
};

type TabTriggerProps = {
  id: string;
  isActive?: boolean;
};

type TabScreen = {
  id: string;
  element: React.ReactElement;
  tab?: (props: TabTriggerProps) => React.ReactNode;
};

export type TabsHandle = {
  tab: (index: number) => void;
};

let counter = 0;

export const Tabs = React.memo(
  React.forwardRef<TabsHandle, Omit<TabProps, "children">>(
    function Tabs(props, ref) {
      const { tabbarPosition, tabbarContainerStyle, screens } = props;
      const position = tabbarPosition ?? "bottom";

      const id = React.useRef(props.id ?? `tabs-${counter++}`).current;
      const store = React.useContext(TabStoreContext);

      const activeIndex = useStore(store, (state) => state.activeById[id]);

      const tabbar = React.useMemo(
        () => (
          <TabBar
            screens={screens}
            style={tabbarContainerStyle}
            position={position}
            activeIndex={activeIndex}
            tabsId={id}
          />
        ),
        [screens, tabbarContainerStyle, activeIndex, position, id],
      );

      return (
        <React.Fragment>
          {position === "top" && tabbar}
          <View style={styles.slotContainer}>
            <TabsSlot activeIndex={activeIndex} screens={props.screens} />
          </View>
          {position === "bottom" && tabbar}
        </React.Fragment>
      );
    },
  ),
);

const TabBar = React.memo(function TabBar(props: {
  screens: TabScreen[];
  activeIndex: number;
  style?: StyleProp<ViewStyle>;
  position: "top" | "bottom";
  tabsId: string;
}) {
  const { tabsId, screens, activeIndex, style, position } = props;
  const insets = useSafeAreaInsets();

  const tabbarStyle = React.useMemo(
    () => [
      styles.tabbar,
      position === "top" && { paddingTop: insets.top },
      position === "bottom" && { paddingBottom: insets.bottom },
      style,
    ],
    [position, style, insets.top, insets.bottom],
  );

  const store = React.useContext(TabStoreContext);

  const handlePress = React.useCallback(
    (index: number) => {
      store.setState((prev) => {
        return {
          ...prev,
          activeById: {
            ...prev.activeById,
            [tabsId]: index,
          },
        };
      });
    },
    [tabsId],
  );

  return (
    <View style={tabbarStyle}>
      {screens.map((screen, index) => (
        <Pressable
          style={styles.tab}
          onPress={() => handlePress(index)}
          key={screen.id}
        >
          {screen.tab?.({
            id: screen.id,
            isActive: index === props.activeIndex,
          })}
        </Pressable>
      ))}
    </View>
  );
});

const TabsSlot = React.memo(function TabsSlot(props: {
  screens: TabScreen[];
  activeIndex: number;
}) {
  const { activeIndex, screens } = props;

  return (
    <RNScreens.ScreenContainer style={StyleSheet.absoluteFill}>
      {screens.map((screen, index) => (
        <RNScreens.Screen
          key={screen.id}
          activityState={index === activeIndex ? 2 : 0}
          style={StyleSheet.absoluteFill}
        >
          <TreeNode
            type={TABS_SCREEN}
            id={screen.id}
            active={index === activeIndex}
          >
            {screen.element}
          </TreeNode>
        </RNScreens.Screen>
      ))}
    </RNScreens.ScreenContainer>
  );
});

const styles = StyleSheet.create({
  tabbar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  tab: {
    flex: 1,
  },
  slotContainer: {
    flex: 1,
  },
});
