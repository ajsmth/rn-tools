const { createJestConfig } = require("./jest-shared");

module.exports = createJestConfig({
  setupFilesAfterEnv: ["<rootDir>/mocks/setup.ts"],
  moduleNameMapper: {
    "^expo-modules-core$": "<rootDir>/mocks/expo-modules-core.mock.ts",
    "^react-native$": "<rootDir>/mocks/react-native.mock.ts",
  },
});
