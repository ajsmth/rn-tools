import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "skew",

  properties: {
    ["skew"]: ["skew"],
    ["skew-x"]: ["skewX"],
    ["skew-y"]: ["skewY"],
  },

  includeNegativeValues: true,
};

const skewPlugin = createPlugin(pluginConfig);

export { skewPlugin as plugin, pluginConfig as config };
