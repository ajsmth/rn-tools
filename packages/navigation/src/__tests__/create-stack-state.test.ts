// import { createStackState } from "../create-stack-state";

// describe("createStackState()", () => {
//   test("init", () => {
//     const stack = createStackState({ random: "data" });
//     expect(stack.getState().extraData.random).toEqual("data");
//   });

//   test("listen for push changes", () => {
//     const stack = createStackState();
//     const listener = jest.fn();
//     stack.listen(listener);
//     const screen = stack.pushScreen({ hi: "there" });
//     expect(screen.status).toEqual("pushing");
//     expect(listener).toHaveBeenLastCalledWith("pushstart", screen);
//     screen.fns.pushEnd();
//     expect(screen.status).toEqual("settled");
//     expect(listener).toHaveBeenLastCalledWith("pushend", screen);
//     expect(stack.getState().screens.length).toEqual(1);
//   });

//   test("listen for pop changes", () => {
//     const stack = createStackState();
//     const listener = jest.fn();
//     stack.listen(listener);
//     const screen = stack.pushScreen({ hi: "there" });
//     stack.popScreen();
//     expect(screen.status).toEqual("popping");
//     expect(listener).toHaveBeenLastCalledWith("popstart", screen);
//     screen.fns.popEnd();
//     expect(screen.status).toEqual("popped");
//     expect(listener).toHaveBeenLastCalledWith("popend", screen);
//     expect(stack.getState().screens.length).toEqual(0);
//   });

//   test("listen for arbitrary data changs", () => {
//     const stack = createStackState();
//     const listener = jest.fn();
//     stack.listen(listener);
//     stack.setState({ wow: "cool" });
//     expect(listener).toHaveBeenLastCalledWith("statechange", { wow: "cool" });
//     const state = stack.getState();
//     expect(state.extraData).toEqual({ wow: "cool" });
//   });
// });
