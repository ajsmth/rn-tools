import * as React from "react";
import { createTransitionStore } from "@rn-tools/core";

export const SHEET_NODE = "sheet";

export const SheetStoreContext = React.createContext(createTransitionStore());
