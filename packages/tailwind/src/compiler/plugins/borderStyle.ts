import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "borderStyle",

  properties: {
    [""]: ["borderStyle"]
  }
};

const borderStylePlugin = createPlugin(pluginConfig);

export {
  borderStylePlugin as plugin,
  pluginConfig as config,
}
