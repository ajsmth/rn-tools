import { createTransitionStore } from "@rn-tools/core";
import * as React from "react";

export const STACK_SLOT = "stack-slot";
export const STACK_SCREEN = "stack-screen";

export const StackStoreContext = React.createContext(createTransitionStore());
