import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "flexWrap",

  properties: {
    [""]: ["flexWrap"],
  },
};

const flexWrapPlugin = createPlugin(pluginConfig);

export { flexWrapPlugin as plugin, pluginConfig as config };
