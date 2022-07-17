import createPlugin from "./createPlugin";
import flattenColorPalette from "../util/flattenColorPalette";

const pluginConfig = {
  name: "color",

  properties: {
    ["border"]: ["borderColor"],
    ["border-r"]: ["borderRightColor"],
    ["border-l"]: ["borderLeftColor"],
    ["border-t"]: ["borderTopColor"],
    ["border-b"]: ["borderBottomColor"],
    ["border-s"]: ["borderStartColor"],
    ["border-end"]: ["borderEndColor"],
  },

  transformTheme: (colors: any) => flattenColorPalette(colors),
};

const borderColorPlugin = createPlugin(pluginConfig);

export {
  borderColorPlugin as plugin,
  pluginConfig as config,
}

