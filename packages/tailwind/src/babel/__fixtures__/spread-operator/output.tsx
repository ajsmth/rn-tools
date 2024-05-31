import TailwindWrapper from "@rn-tools/tailwind";
import * as React from "react";

function MyComponent() {
  return (
    <TailwindWrapper
      enablePanDownToClose
      {...bottomSheetProps}
      ref={bottomSheetRef}
      onChange={onChange}
      component={BottomSheet}
      styleSheet={styleSheet}
    >
      <TailwindWrapper
        push={push}
        pop={pop}
        focused={focused}
        updateProps={updateProps}
        {...props}
        component={Component}
        styleSheet={styleSheet}
      />
    </TailwindWrapper>
  );
}

const styleSheet = {};
