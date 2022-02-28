import * as React from "react";
import { StyleSheet, useColorScheme } from "react-native";

type StyleFn<T> = (classNames: string | T) => any;

type PrimitiveProps<S> = {
  styles?: S | string;
  selectors?: {
    dark?: string;
    light?: string;
  };
};

export function createPrimitive<T, F>(
  component: React.ComponentType<T>,
  styleFn: StyleFn<F>,
  base?: T
) {
  const Component = React.forwardRef<any, T & PrimitiveProps<F>>(
    (props, ref) => {
      const { styles = "", selectors } = props;
      const theme = useTheme();
      const themeStyle = selectors?.[theme] ?? "";
      return React.createElement(component, {
        ...base,
        ...props,
        style: StyleSheet.flatten([
          styleFn(styles),
          styleFn(themeStyle),
          // @ts-ignore
          props.style,
        ]),
        ref,
      });
    }
  );

  return Component;
}

type ThemePreference = "light" | "dark" | "no-preference";
type Theme = "light" | "dark";

const ThemeContext = React.createContext<Theme>("light");
const useTheme = () => React.useContext(ThemeContext);

type ThemeProviderProps = {
  children: React.ReactNode;
  themePreference?: ThemePreference;
};

export function ThemeProvider({
  children,
  themePreference = "no-preference",
}: ThemeProviderProps) {
  const systemTheme = useColorScheme();

  const theme = React.useMemo(() => {
    if (themePreference !== "no-preference") {
      return themePreference;
    }

    return systemTheme ?? "light";
  }, [themePreference]);

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
}
