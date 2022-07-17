import createPlugin from "./createPlugin";
import flattenColorPalette from "../util/flattenColorPalette";

const pluginConfig = {
  name: "color",

  properties: {
    ["text"]: ["color"],
    ["text-s"]: ["textShadowColor"],
  },

  transformTheme: (colors: any) => flattenColorPalette(colors),
};

const textColorPlugin = createPlugin(pluginConfig);

export { textColorPlugin as plugin, pluginConfig as config };
