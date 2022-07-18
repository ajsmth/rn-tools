import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "inset",

  properties: {
    ["inset"]: ["top", "left", "right", "bottom"],
    ["bottom"]: ["bottom"],
    ["top"]: ["top"],
    ["left"]: ["left"],
    ["right"]: ["right"],
    ["start"]: ["start"],
    ["end"]: ["end"],
  },
};

const insetPlugin = createPlugin(pluginConfig);

export { insetPlugin as plugin, pluginConfig as config };
