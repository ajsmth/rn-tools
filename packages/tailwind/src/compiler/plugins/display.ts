import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "display",
  properties: {
    [""]: ["display"],
  },
};

const displayPlugin = createPlugin(pluginConfig);

export { displayPlugin as plugin, pluginConfig as config };
