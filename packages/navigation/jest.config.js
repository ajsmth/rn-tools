const { createJestConfig } = require("../core/jest-shared");

module.exports = createJestConfig({
  setupFilesAfterEnv: ["<rootDir>/../core/mocks/setup.ts"],
  moduleNameMapper: {
    "^expo-modules-core$": "<rootDir>/../core/mocks/expo-modules-core.mock.ts",
    "^react-native$": "<rootDir>/../core/mocks/react-native.mock.ts",
    "^react-native-screens$": "<rootDir>/mocks/react-native-screens.mock.tsx",
  },
});
