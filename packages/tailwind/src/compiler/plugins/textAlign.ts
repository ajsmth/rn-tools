import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "textAlign",

  properties: {
    ["text"]: ["textAlign"],
  },
};

const textAlignPlugin = createPlugin(pluginConfig);

export { textAlignPlugin as plugin, pluginConfig as config };
