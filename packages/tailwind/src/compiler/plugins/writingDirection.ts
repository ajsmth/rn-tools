import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "writingDirection",

  properties: {
    ["text-direction"]: ["writingDirection"],
  },
};

const writingDirectionPlugin = createPlugin(pluginConfig);

export { writingDirectionPlugin as plugin, pluginConfig as config };
