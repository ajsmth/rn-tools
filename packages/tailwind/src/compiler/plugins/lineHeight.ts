import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "lineHeight",

  properties: {
    ["leading"]: ["lineHeight"],
  },
};

const lineHeightPlugin = createPlugin(pluginConfig);

export { lineHeightPlugin as plugin, pluginConfig as config };
