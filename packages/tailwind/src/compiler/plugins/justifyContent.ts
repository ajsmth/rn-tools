import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "justifyContent",

  properties: {
    ["justify"]: ["justifyContent"],
  },
};

const justifyContentPlugin = createPlugin(pluginConfig);

export { justifyContentPlugin as plugin, pluginConfig as config };
