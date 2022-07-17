import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "padding",

  properties: {
    ["p"]: ["padding"],
    ["pt"]: ["paddingTop"],
    ["pb"]: ["paddingBottom"],
    ["pl"]: ["paddingLeft"],
    ["pr"]: ["paddingRight"],
    ["px"]: ["paddingHorizontal"],
    ["py"]: ["paddingVertical"],
    ["ps"]: ["paddingStart"],
    ["pe"]: ["paddingEnd"],
  },
};

const paddingPlugin = createPlugin(pluginConfig);

export { paddingPlugin as plugin, pluginConfig as config };
