import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "textTransform",

  properties: {
    [""]: ["textTransform"],
  },
};

const textTransformPlugin = createPlugin(pluginConfig);

export { textTransformPlugin as plugin, pluginConfig as config };
