import type { ViewProps, TextProps, ImageProps } from "react-native";

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
}
