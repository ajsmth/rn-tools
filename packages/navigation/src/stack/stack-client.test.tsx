import { createStack } from "./stack-client";
import { Stack } from "./stack";
import { act, render, screen, within } from "@testing-library/react-native";
import { Text, View } from "react-native";

jest.mock("./native-stack.tsx", () => {
  return {
    NativeStack: ({ children }) => <>{children}</>,
    NativeScreen: ({ children }) => <>{children}</>,
  };
});

describe("createStack()", () => {
  test("pushing screens", () => {
    const stack = createStack();

    const result = render(
      <stack.Provider>
        <Stack rootScreen={<Text>Root</Text>} />
      </stack.Provider>,
    );

    act(() => {
      stack.push(<Text>Hi</Text>);
      stack.push(<Text>Hey</Text>);
    });

    expect(result.queryByText(/hi/i)).not.toBeNull();
    expect(result.queryByText(/hey/i)).not.toBeNull();
  });

  test("popping screens", () => {
    const stack = createStack();

    const result = render(
      <stack.Provider>
        <Stack rootScreen={<Text>Root</Text>} />
      </stack.Provider>,
    );

    act(() => {
      stack.push(<Text>Hi</Text>);
      stack.push(<Text>Hey</Text>);
      stack.pop();
    });

    expect(result.queryByText(/hi/i)).not.toBeNull();
    expect(result.queryByText(/hey/i)).toBeNull();
  });

  test("popping multiple", () => {
    const stack = createStack();

    const result = render(
      <stack.Provider>
        <Stack rootScreen={<Text>Root</Text>} />
      </stack.Provider>,
    );

    act(() => {
      stack.push(<Text>Hi</Text>);
      stack.push(<Text>Hey</Text>);
      stack.pop(2);
    });

    expect(result.queryByText(/hi/i)).toBeNull();
    expect(result.queryByText(/hey/i)).toBeNull();
  });

  test("cannot pop more than what is there", () => {
    const stack = createStack();

    const result = render(
      <stack.Provider>
        <Stack rootScreen={<Text>Root</Text>} />
      </stack.Provider>,
    );

    act(() => {
      stack.push(<Text>Hi</Text>);
      stack.push(<Text>Hey</Text>);
      stack.pop(100);
    });

    expect(result.queryByText(/hi/i)).toBeNull();
    expect(result.queryByText(/hey/i)).toBeNull();
  });

  test("multiple stacks nested", () => {
    const stack = createStack();

    render(
      <stack.Provider>
        <View testID="stack-1">
          <Stack
            id="1"
            rootScreen={
              <View testID="stack-2">
                <Stack id="2" rootScreen={<Text>Root2</Text>} />
              </View>
            }
          />
        </View>
      </stack.Provider>,
    );

    act(() => {
      stack.push(<Text>Hi</Text>);
      stack.push(<Text>Hey</Text>);
    });

    const stack2 = screen.getByTestId("stack-2");
    within(stack2).getByText(/hey/i);
  });

  test("multiple stacks pushed by id", () => {
    const stack = createStack();

    render(
      <stack.Provider>
        <View testID="stack-1">
          <Stack id="1" rootScreen={<Text>Root</Text>} />
        </View>
        <View testID="stack-2">
          <Stack id="2" rootScreen={<Text>Root2</Text>} />
        </View>
      </stack.Provider>,
    );

    act(() => {
      stack.push(<Text>Hi</Text>, { stackId: "1" });
      stack.push(<Text>Hey</Text>, { stackId: "2" });
    });

    const stack1 = screen.getByTestId("stack-1");
    const stack2 = screen.getByTestId("stack-2");

    within(stack1).getByText(/hi/i);
    expect(within(stack2).queryByText(/hi/i)).toBeNull();

    within(stack2).getByText(/hey/i);
    expect(within(stack1).queryByText(/hey/i)).toBeNull();
  });

  test("nested stacks pushing by id", () => {
    const stack = createStack();

    render(
      <stack.Provider>
        <View testID="stack-1">
          <Stack
            id="1"
            rootScreen={
              <View testID="stack-2">
                <Stack id="2" rootScreen={<Text>Root2</Text>} />
              </View>
            }
          />
        </View>
      </stack.Provider>,
    );

    act(() => {
      stack.push(<Text>Hi</Text>, { stackId: "1" });
      stack.push(<Text>Hey</Text>, { stackId: "2" });
    });

    const stack1 = screen.getByTestId("stack-1");
    const stack2 = screen.getByTestId("stack-2");

    within(stack1).getByText(/hi/i);
    expect(within(stack2).queryByText(/hi/i)).toBeNull();

    within(stack2).getByText(/hey/i);
    within(stack1).getByText(/hey/i);
  });
});
