import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "rotate",

  properties: {
    ["rotate"]: ["rotate"],
    ["rotate-x"]: ["rotateX"],
    ["rotate-y"]: ["rotateY"],
  },

  includeNegativeValues: true,
};

const rotatePlugin = createPlugin(pluginConfig);

export { rotatePlugin as plugin, pluginConfig as config };
