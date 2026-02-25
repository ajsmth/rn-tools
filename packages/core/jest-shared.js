const preset = require("./jest-expo-preset");

const testMatch = ["**/?(*.)+(test).[t]s?(x)"];

const transformIgnorePatterns = [
  "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|navigation-rn|@sentry|@10play/tentap-editor|@rn-tools/.*)",
];

function createJestConfig(options = {}) {
  return {
    ...preset,
    testMatch,
    transformIgnorePatterns,
    ...options,
    moduleNameMapper: {
      ...(preset.moduleNameMapper || {}),
      ...(options.moduleNameMapper || {}),
    },
  };
}

module.exports = {
  createJestConfig,
  testMatch,
  transformIgnorePatterns,
};
