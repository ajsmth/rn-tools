import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "fontSize",

  properties: {
    ["text"]: ["fontSize"],
  },
};

const fontSizePlugin = createPlugin(pluginConfig);

export { fontSizePlugin as plugin, pluginConfig as config };
