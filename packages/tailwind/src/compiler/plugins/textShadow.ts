import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "textShadow",

  properties: {
    ["text-shadow"]: [],
  },
};

const textShadowPlugin = createPlugin(pluginConfig);

export { textShadowPlugin as plugin, pluginConfig as config };
