import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "letterSpacing",

  properties: {
    ["tracking"]: ["letterSpacing"],
  },
};

const letterSpacingPlugin = createPlugin(pluginConfig);

export { letterSpacingPlugin as plugin, pluginConfig as config };
