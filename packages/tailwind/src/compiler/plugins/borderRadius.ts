import createPlugin from "./createPlugin";

const keys = {
  topLeft: "borderTopLeftRadius",
  topRight: "borderTopRightRadius",
  bottomLeft: "borderBottomLeftRadius",
  bottomRight: "borderBottomRightRadius",
};

const pluginConfig = {
  name: "borderRadius",

  properties: {
    ["rounded"]: ["borderRadius"],
    ["rounded-t"]: [keys.topLeft, keys.topRight],
    ["rounded-b"]: [keys.bottomLeft, keys.bottomRight],
    ["rounded-l"]: [keys.topLeft, keys.bottomLeft],
    ["rounded-r"]: [keys.topRight, keys.bottomRight],
    ["rounded-tl"]: [keys.topLeft],
    ["rounded-tr"]: [keys.topRight],
    ["rounded-bl"]: [keys.bottomLeft],
    ["rounded-br"]: [keys.bottomRight],
  },
};

const borderRadiusPlugin = createPlugin(pluginConfig);

export {
  borderRadiusPlugin as plugin,
  pluginConfig as config,
}
