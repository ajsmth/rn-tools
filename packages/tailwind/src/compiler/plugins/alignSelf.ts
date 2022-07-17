import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "alignSelf",

  properties: {
    ["self"]: ["alignSelf"],
  },
};

const alignSelfPlugin = createPlugin(pluginConfig);

export { alignSelfPlugin as plugin, pluginConfig as config };
