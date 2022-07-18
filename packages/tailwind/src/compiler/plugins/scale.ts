import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "scale",

  properties: {
    ["scale"]: ["scale"],
    ["scale-x"]: ["scaleX"],
    ["scale-y"]: ["scaleY"],
  },

  includeNegativeValues: true,
};

const scalePlugin = createPlugin(pluginConfig);

export { scalePlugin as plugin, pluginConfig as config };
