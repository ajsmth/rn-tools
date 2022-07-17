import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "translate",

  properties: {
    ["translate"]: ["translate"],
    ["translate-x"]: ["translateX"],
    ["translate-y"]: ["translateY"],
  },

  includeNegativeValues: true,
};

const translatePlugin = createPlugin(pluginConfig);

export { translatePlugin as plugin, pluginConfig as config };
