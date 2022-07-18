import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "width",

  properties: {
    ["w"]: ["width"],
    ["max-w"]: ["maxWidth"],
    ["min-w"]: ["minWidth"],
  },
};

const widthPlugin = createPlugin(pluginConfig);

export { widthPlugin as plugin, pluginConfig as config };
