import createPlugin from "./createPlugin";

const pluginConfig = {
  name: "height",

  properties: {
    ["h"]: ["height"],
    ["max-h"]: ["maxHeight"],
    ["min-h"]: ["minHeight"],
  },
};

const heightPlugin = createPlugin(pluginConfig);

export { heightPlugin as plugin, pluginConfig as config };
