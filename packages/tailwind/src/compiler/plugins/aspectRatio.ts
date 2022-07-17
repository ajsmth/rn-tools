import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "aspectRatio",

  properties: {
    ["aspect-ratio"]: ["aspectRatio"],
  },
};

const aspectRatioPlugin = createPlugin(pluginConfig);

export { aspectRatioPlugin as plugin, pluginConfig as config };
