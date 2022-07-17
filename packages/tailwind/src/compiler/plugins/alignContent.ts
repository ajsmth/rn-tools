import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "alignContent",

  properties: {
    ["content"]: ["alignContent"],
  },
};

const alignContentPlugin = createPlugin(pluginConfig);

export {
  alignContentPlugin as plugin,
  pluginConfig as config,
}
