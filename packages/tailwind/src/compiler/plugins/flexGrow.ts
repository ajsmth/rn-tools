import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "flexGrow",

  properties: {
    ["flex-grow"]: ["flexGrow"],
  },
};

const flexGrowPlugin = createPlugin(pluginConfig);

export { flexGrowPlugin as plugin, pluginConfig as config };
