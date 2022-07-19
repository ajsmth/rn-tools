// import * as React from "react";

// import { createStore } from "@rn-toolkit/core";

// type TabStore = {
//   tabs: TabItem[];
//   activeIndex: number;
// };

// type TabItem = {
//   actions: {
//     jumpEnd: (id: number) => void;
//   };
// };

// type TabEvent = "jumpTo" | "add" | "remove";

// export function createTabNavigator() {
//   const store = createStore<TabStore, TabEvent>();

//   let activeIndex = 0;
//   let byId: any = {};
//   let ids: number[] = [];
//   let id = 0;

//   function jumpTo(index: number) {
//     let tab = ids[index];
//     if (tab != null) {
//       activeIndex = index;
//       store.setState({ activeIndex });
//       store.emit("jumpTo");
//     }
//   }

//   function add(screen: any) {
//     id += 1;
//     ids.push(id);
//     byId[id] = screen;
//     store.setState({ tabs: ids.map((id) => byId[id]).filter(Boolean) });
//     store.emit("add");
//   }

//   function remove(id: number) {
//     let screen = byId[id];

//     if (screen != null) {
//       ids = ids.filter((i) => id !== i);
//       delete byId[id];
//       store.setState({ tabs: ids.map((id) => byId[id]).filter(Boolean) });
//       store.emit("remove");
//     }
//   }

//   const actions = {
//     jumpTo,
//     add,
//     remove,
//   };

//   const ActiveIndexContext = React.createContext(0);

//   function Navigator({ children }: any) {
//     const [tabs, setTabs] = React.useState<any[]>([]);
//     const [activeIndex, setActiveIndex] = React.useState(0);

//     React.useEffect(() => {
//       const unsub = store.subscribe((state) => {
//         setTabs(state.tabs);
//         setActiveIndex(state.activeIndex);
//       });
//       return () => unsub();
//     }, []);

//     return (
//       <ActiveIndexContext.Provider value={activeIndex}>
//         {children}
//       </ActiveIndexContext.Provider>
//     );
//   }

//   function Screen({ children }: any) {
//     React.useLayoutEffect(() => {
//       // add(this)
//     }, [])

//   }

//   function TabBar({ children }: any) {}
//   function Tab({ children }: any) {}

//   return {
//     actions,
//     store,
//   };
// }
