try {
  const ExpoModulesCore = require("expo-modules-core");
  if (ExpoModulesCore && typeof ExpoModulesCore === "object") {
    if (!ExpoModulesCore.uuid || typeof ExpoModulesCore.uuid !== "object") {
      ExpoModulesCore.uuid = {};
    }
    if (!ExpoModulesCore.NativeModulesProxy || typeof ExpoModulesCore.NativeModulesProxy !== "object") {
      ExpoModulesCore.NativeModulesProxy = {};
    }
  }
} catch {
  // Ignore; jest-expo setup will handle module mocking.
}

require("jest-expo/src/preset/setup.js");
