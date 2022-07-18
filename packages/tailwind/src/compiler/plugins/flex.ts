import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "flex",

  properties: {
    ["flex"]: ["flex"],
  },
};

const flexPlugin = createPlugin(pluginConfig);

export { flexPlugin as plugin, pluginConfig as config };
