import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "opacity",

  properties: {
    ["opacity"]: ["opacity"],
  },
};

const opacityPlugin = createPlugin(pluginConfig);

export { opacityPlugin as plugin, pluginConfig as config };
