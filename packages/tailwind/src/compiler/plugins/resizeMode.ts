import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "resizeMode",

  properties: {
    ["resize"]: ["resizeMode"],
  },
};

const resizeModePlugin = createPlugin(pluginConfig);

export { resizeModePlugin as plugin, pluginConfig as config };
