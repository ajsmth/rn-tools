import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "boxShadow",

  properties: {
    ["shadow"]: [],
  },
};

const alignItemsPlugin = createPlugin(pluginConfig);

export { alignItemsPlugin as plugin, pluginConfig as config };
