import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "textDecoration",

  properties: {
    [""]: ["textDecoration"],
  },
};

const textDecorationPlugin = createPlugin(pluginConfig);

export { textDecorationPlugin as plugin, pluginConfig as config };
