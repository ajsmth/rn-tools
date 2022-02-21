import * as React from "react";
import BottomSheet from "@gorhom/bottom-sheet";

import { BottomSheetProps } from "./types";

export function BottomSheetItem(props: BottomSheetProps) {
  const { data, status, pop, onPushEnd, onPopEnd } = props;
  const { bottomSheetProps } = data;

  const bottomSheetRef = React.useRef<BottomSheet>(null);

  React.useEffect(() => {
    if (status === "pushing") {
      bottomSheetRef.current?.expand();
      onPushEnd();
    }

    if (status === "popping") {
      bottomSheetRef.current?.close();
    }
  }, [status]);

  const onChange = React.useCallback(
    (index: number) => {
      if (index === -1) {
        if (status !== "popping") {
          pop();
        }
        onPopEnd();
      }
    },
    [status]
  );

  const Component = data.component;

  return (
    <BottomSheet
      enablePanDownToClose
      {...bottomSheetProps}
      ref={bottomSheetRef}
      onChange={onChange}
    >
      <Component {...props} />
    </BottomSheet>
  );
}
