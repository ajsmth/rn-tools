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
type SetThemePreference = (themePreference: ThemePreference) => void;

const ThemeContext = React.createContext<Theme>("light");
const useTheme = () => React.useContext(ThemeContext);

const ThemePreferenceContext = React.createContext<SetThemePreference>(
  () => {}
);

export const useSetThemePreference = () =>
  React.useContext(ThemePreferenceContext);

type ThemeProviderProps = {
  children: React.ReactNode;
  initialThemePreference?: ThemePreference;
};

export function ThemeProvider({
  children,
  initialThemePreference = "no-preference",
}: ThemeProviderProps) {
  const systemTheme = useColorScheme();

  const [themePreference, setThemePreference] = React.useState<ThemePreference>(
    initialThemePreference
  );

  const theme = React.useMemo(() => {
    if (themePreference !== "no-preference") {
      return themePreference;
    }

    return systemTheme ?? "light";
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      <ThemePreferenceContext.Provider value={setThemePreference}>
        {children}
      </ThemePreferenceContext.Provider>
    </ThemeContext.Provider>
  );
}
