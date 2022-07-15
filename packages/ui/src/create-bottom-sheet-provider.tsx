import * as React from "react";
import { createStackStore, StackItem } from "@rn-toolkit/core";
import BottomSheet, { BottomSheetProps } from "@gorhom/bottom-sheet";

export type SheetProps = {
  push: (
    component: (props: SheetProps) => React.ReactElement<any>,
    options: BottomSheetProps
  ) => Promise<void>;
  pop: () => Promise<void>;
  updateProps: (updates: BottomSheetProps) => void;
  focused: boolean;
};

type BottomSheetItem = BottomSheetProps & {
  component: (props: SheetProps) => React.ReactElement<any>;
};

type BottomSheetStackItem = StackItem<BottomSheetItem>;

export function createBottomSheetProvider() {
  const stack = createStackStore<BottomSheetItem>();

  function Provider({ children }: { children: React.ReactNode }) {
    const [sheets, setSheets] = React.useState<BottomSheetStackItem[]>([]);

    React.useEffect(() => {
      const unsub = stack.store.subscribe(({ stack }) => {
        setSheets(stack);
      });

      return () => unsub();
    }, []);

    return (
      <>
        {sheets.map((sheet, index, arr) => {
          const focused = index === arr.length - 1;
          return (
            <BottomSheetItem key={sheet.id} sheet={sheet} focused={focused} />
          );
        })}
      </>
    );
  }

  function BottomSheetItem({
    sheet,
    focused,
  }: {
    sheet: BottomSheetStackItem;
    focused: boolean;
  }) {
    const {
      data: { component, ...bottomSheetProps },
      actions,
      id,
      status,
    } = sheet;

    const bottomSheetRef = React.useRef<BottomSheet>(null);

    const onPopEnd = React.useCallback(() => {
      return actions.popEnd(id);
    }, [id]);

    const onPushEnd = React.useCallback(() => {
      return actions.popEnd(id);
    }, [id]);

    React.useEffect(() => {
      if (status === "pushing") {
        bottomSheetRef.current?.expand();
        onPushEnd();
      }

      if (status === "popping") {
        bottomSheetRef.current?.close();
      }
    }, [status, onPushEnd]);

    const onChange = React.useCallback(
      (index: number) => {
        if (index === -1) {
          if (status !== "popping") {
            return pop();
          }
          return onPopEnd();
        }
      },
      [status, onPopEnd]
    );

    const updateProps = React.useCallback(
      (updates: BottomSheetProps) => {
        return actions.update(id, updates);
      },
      [id]
    );

    const Component = component;

    return (
      <BottomSheet
        enablePanDownToClose
        {...bottomSheetProps}
        ref={bottomSheetRef}
        onChange={onChange}
      >
        <Component
          push={push}
          pop={pop}
          focused={focused}
          updateProps={updateProps}
        />
      </BottomSheet>
    );
  }

  async function push(
    component: (props: SheetProps) => React.ReactElement<any>,
    options: BottomSheetProps
  ) {
    const item = stack.actions.push({
      component,
      ...options,
    });

    return await item.promises.push;
  }

  async function pop() {
    const item = stack.actions.pop();
    return item?.promises.pop;
  }

  return {
    Provider,
    push,
    pop,
  };
}
