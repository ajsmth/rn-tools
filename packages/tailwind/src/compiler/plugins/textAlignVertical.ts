import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "textAlignVertical",

  properties: {
    ["text-vertical"]: ["textAlignVertical"],
  },
};

const textAlignPlugin = createPlugin(pluginConfig);

export { textAlignPlugin as plugin, pluginConfig as config };
