import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "alignItems",

  properties: {
    ["items"]: ["alignItems"],
  },
};

const alignItemsPlugin = createPlugin(pluginConfig);

export { alignItemsPlugin as plugin, pluginConfig as config };
