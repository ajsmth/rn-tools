import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "flexShrink",

  properties: {
    ["flex-shrink"]: ["flexShrink"],
  },
};

const flexShrinkPlugin = createPlugin(pluginConfig);

export { flexShrinkPlugin as plugin, pluginConfig as config };
