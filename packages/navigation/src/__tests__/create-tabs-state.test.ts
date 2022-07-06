// import { createTabState } from "../create-tabs-state";

// describe("createTabState()", () => {
//   test("init", () => {
//     const tabs = createTabState({ wow: "cool" });
//     expect(tabs.getState().extraData).toEqual({ wow: "cool" });
//   });

//   test("add and remove screens", () => {
//     const tabs = createTabState({ wow: "cool" });
//     const listener = jest.fn();
//     tabs.listen(listener);
//     const screen = tabs.addScreen({ awesome: "yes" });
//     expect(tabs.getState().screens.length).toEqual(1);
//     expect(listener).toHaveBeenLastCalledWith("add", screen);
//     tabs.removeScreen(screen.id);
//     expect(listener).toHaveBeenLastCalledWith("remove", screen);
//   });
// });
