import type { ViewProps, TextProps, ImageProps, PressableProps } from "react-native";

declare module "react-native" {
  interface ViewProps {
    styles?: string;
  }

  interface TextProps {
    styles?: string;
  }

  interface ImageProps {
    styles?: string;
  }

  interface TouchableWithoutFeedbackProps {
    styles?: string;
  }

  interface PressableProps {
    styles?: string;
  }
}
