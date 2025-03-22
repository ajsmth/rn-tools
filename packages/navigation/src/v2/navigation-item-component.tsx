import * as React from "react";

import {
  createNavigationItem,
  type NavigationItemType,
} from "./navigation-item";
type RenderProps = {
  state: ReturnType<NavigationItemType["getState"]>;
  item: NavigationItemType;
};
export type NavigationItemProps = {
  render: (props: RenderProps) => React.ReactNode;
};

let NavigationItemContext = React.createContext<NavigationItemType | null>(
  null
);


export const NavigationItem = React.memo(function NavigationItem(
  props: NavigationItemProps
) {
  let parent = React.useContext(NavigationItemContext);
  let navigationItemRef = React.useRef(createNavigationItem({ parent }));
  let [navigationItemState, setNavigationItemState] = React.useState(
    navigationItemRef.current.getState()
  );

  React.useLayoutEffect(() => {
    let unsub = navigationItemRef.current.subscribe((state) =>
      setNavigationItemState(state)
    );

    return () => {
      unsub();
    };
  }, []);

  let renderProps = React.useMemo(() => {
    return {
      state: navigationItemState,
      item: navigationItemRef.current,
    };
  }, [navigationItemState]);

  return (
    <NavigationItemContext.Provider value={navigationItemRef.current}>
      {props.render(renderProps)}
    </NavigationItemContext.Provider>
  );
});
