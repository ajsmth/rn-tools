import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "overflow",

  properties: {
    ["overflow"]: ["overflow"],
  },
};

const overflowPlugin = createPlugin(pluginConfig);

export { overflowPlugin as plugin, pluginConfig as config };
