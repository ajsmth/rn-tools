const { createMetroConfiguration } = require("expo-yarn-workspaces");
const withExpoPreview = require("expo-component-preview/withExpoComponentPreview");
const config = createMetroConfiguration(__dirname);

module.exports = withExpoPreview(config);
