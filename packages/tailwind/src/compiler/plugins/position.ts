import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "position",

  properties: {
    [""]: ["position"],
  },
};

const positionPlugin = createPlugin(pluginConfig);

export { positionPlugin as plugin, pluginConfig as config };
