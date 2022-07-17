import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "direction",

  properties: {
    ["direction"]: ["direction"],
  },
};

const directionPlugin = createPlugin(pluginConfig);

export { directionPlugin as plugin, pluginConfig as config };
