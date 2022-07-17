import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "flexDirection",

  properties: {
    ["flex"]: ["flexDirection"],
  },
};

const flexDirectionPlugin = createPlugin(pluginConfig);

export { flexDirectionPlugin as plugin, pluginConfig as config };
