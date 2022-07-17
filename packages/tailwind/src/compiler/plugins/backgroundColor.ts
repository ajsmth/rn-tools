import createPlugin from "./createPlugin";
import flattenColorPalette from "../util/flattenColorPalette";

const pluginConfig = {
  name: "color",

  properties: {
    ["bg"]: ["backgroundColor"],
  },

  transformTheme: (colors: any) => flattenColorPalette(colors),
};

const bgColorPlugin = createPlugin(pluginConfig);

export { bgColorPlugin as plugin, pluginConfig as config };
