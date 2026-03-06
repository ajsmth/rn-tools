import { createSheets } from "./sheets-client";
import { render, act, within } from "@testing-library/react-native";
import { Text } from "react-native";
import { Sheet } from "./sheet";

jest.mock("./native-bottom-sheet.tsx", () => {
  return {
    // TODO: - mock the onSheetChange callback to test behaviour
    NativeBottomSheet: ({ children, isOpen }) => {
      if (!isOpen) return null;
      return <>{children}</>;
    },
  };
});

describe("createSheets()", () => {
  test("adding sheets", () => {
    const sheets = createSheets();

    const result = render(
      <sheets.Provider>
        <Text>Hi</Text>
      </sheets.Provider>,
    );

    act(() => {
      sheets.push(<Text>Pushed!</Text>);
    });

    result.getByText(/pushed/i);

    act(() => {
      sheets.push(<Text>Second</Text>);
    });

    result.getByText(/second/i);
  });

  test("removing sheets", () => {
    const sheets = createSheets();

    const result = render(
      <sheets.Provider>
        <Text>Hey</Text>
      </sheets.Provider>,
    );

    act(() => {
      sheets.push(<Text>Push1</Text>);
      sheets.push(<Text>Push2</Text>);
    });

    result.getByText(/push1/i);
    result.getByText(/push2/i);

    act(() => {
      sheets.dismiss();
    });

    expect(result.queryByText(/push2/i)).toBeNull();
  });

  test("removing all sheets", () => {
    const sheets = createSheets();

    const result = render(
      <sheets.Provider>
        <Text>Hey</Text>
      </sheets.Provider>,
    );

    act(() => {
      sheets.push(<Text>Push1</Text>);
      sheets.push(<Text>Push2</Text>);
    });

    result.getByText(/push2/i);

    act(() => {
      sheets.dismissAll();
    });

    expect(result.queryByText(/push2/i)).toBeNull();
    expect(result.queryByText(/push1/i)).toBeNull();
  });

  test("pushing and removing by id", () => {
    const sheets = createSheets();

    const result = render(
      <sheets.Provider>
        <Text>Hey</Text>
      </sheets.Provider>,
    );

    act(() => {
      sheets.push(<Text>Push1</Text>, { id: "1" });
      sheets.push(<Text>Push2</Text>, { id: "2" });
    });

    expect(result.queryByText(/push1/i)).not.toBeNull();

    act(() => {
      sheets.dismiss("1");
    });

    expect(result.queryByText(/push1/i)).toBeNull();
    expect(result.queryByText(/push2/i)).not.toBeNull();

    act(() => {
      sheets.dismiss("1");
    });

    expect(result.queryByText(/push1/i)).toBeNull();
  });

  test("declarative sheets toggling visibility", () => {
    const sheets = createSheets();

    const result = render(
      <sheets.Provider>
        <Sheet id="1">
          <Text>MySheet</Text>
        </Sheet>
      </sheets.Provider>,
    );

    expect(result.queryByText(/mysheet/i)).toBeNull();

    act(() => {
      sheets.show("1");
    });

    expect(result.queryByText(/mysheet/i)).not.toBeNull();

    act(() => {
      sheets.dismiss("1");
    });

    expect(result.queryByText(/mysheet/i)).toBeNull();
  });
});
