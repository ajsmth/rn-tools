const path = require("node:path");
const basePreset = require("jest-expo/jest-preset");

const setupFiles = (basePreset.setupFiles || []).filter(
  (file) => !file.includes("jest-expo/src/preset/setup.js"),
);

module.exports = {
  ...basePreset,
  setupFiles: [...setupFiles, path.join(__dirname, "jest-expo-setup.js")],
};
