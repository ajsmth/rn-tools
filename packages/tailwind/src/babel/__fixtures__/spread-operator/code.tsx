import * as React from 'react'

function MyComponent() {
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
        {...props}
      />
    </BottomSheet>
  );
}