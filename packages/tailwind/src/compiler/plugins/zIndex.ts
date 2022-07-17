import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "zIndex",

  properties: {
    ["z"]: ["zIndex"],
  },
};

const zIndexPlugin = createPlugin(pluginConfig);

export { zIndexPlugin as plugin, pluginConfig as config };
