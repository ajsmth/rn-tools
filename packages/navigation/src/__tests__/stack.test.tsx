import { fireEvent, render } from "@testing-library/react-native";
import { Button, Text } from "react-native";

import { navigation } from "../navigation";
import { Stack } from "../stack";

describe("<Stack />", () => {
  beforeEach(() => {
    navigation.reset();
  });

  test("render", () => {
    let { getByText } = render(
      <Stack.Navigator
        rootScreen={
          <>
            <Text>Stack works!</Text>
          </>
        }
      />
    );
    let element = getByText("Stack works!");
    expect(element).toBeTruthy();
  });

  test("pushing a screen works", () => {
    let { getByText, queryByText } = render(
      <Stack.Navigator
        rootScreen={
          <Button
            title="Push"
            onPress={() =>
              navigation.pushScreen(
                <Stack.Screen>
                  <Text>Pushed screen!</Text>
                </Stack.Screen>
              )
            }
          />
        }
      />
    );

    expect(queryByText("Pushed screen")).toBe(null);
    fireEvent.press(getByText("Push"));
    getByText("Pushed screen!");
  });
});
