import * as React from "react";

export let StackIdContext = React.createContext<string>("");
export let ScreenIdContext = React.createContext<string>("");
export let ActiveContext = React.createContext<boolean>(true);
export let DepthContext = React.createContext<number>(0);
export let TabIdContext = React.createContext<string>("");
export let TabScreenIndexContext = React.createContext<number>(0);
