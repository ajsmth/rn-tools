import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "textDecorationStyle",

  properties: {
    ["text-decoration"]: ["textDecorationStyle"],
  },
};

const textDecorationStylePlugin = createPlugin(pluginConfig);

export { textDecorationStylePlugin as plugin, pluginConfig as config };
