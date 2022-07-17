import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "fontWeight",

  properties: {
    ["font"]: ["fontWeight"],
  },
};

const fontWeightPlugin = createPlugin(pluginConfig);

export { fontWeightPlugin as plugin, pluginConfig as config };
