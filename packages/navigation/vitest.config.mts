import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "expo-modules-core": path.resolve(
        __dirname,
        "mocks/expo-modules-core.mock.ts",
      ),
      "react-native-screens": path.resolve(
        __dirname,
        "mocks/react-native-screens.mock.tsx",
      ),
      "react-native": path.resolve(
        __dirname,
        "../core/mocks/react-native.mock.ts",
      ),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [path.resolve(__dirname, "../core/mocks/setup.ts")],
  },
});
