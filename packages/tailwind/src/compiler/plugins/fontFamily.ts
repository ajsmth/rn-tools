import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "fontFamily",

  properties: {
    ["font"]: ["fontFamily"],
  },
};

const fontFamilyPlugin = createPlugin(pluginConfig);

export { fontFamilyPlugin as plugin, pluginConfig as config };
