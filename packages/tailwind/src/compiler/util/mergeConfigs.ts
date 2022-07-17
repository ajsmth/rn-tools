const colors = require("../../colors");

function getColor(colorName: string) {
  const [name, value] = colorName.split("-");
  const color = colors[name] ? colors[name][value] : colorName;
  return color || "";
}

const themeFns = {
  color: getColor,
};

function mergeConfigs(...configs: any[]): any {
  const theme = {};

  configs.forEach((config) => {
    if (config && config.theme) {
      const { extend = {}, ...overrides } = config.theme;

      Object.keys(overrides).forEach((key) => {
        // @ts-ignore
        theme[key] = config.theme[key];
      });

      Object.keys(extend).forEach((key) => {
        let extension = extend[key];

        if (typeof extension === "function") {
          extension = extension(themeFns);
        }

        // @ts-ignore
        theme[key] = {
          // @ts-ignore
          ...theme[key],
          ...extension,
        };
      });
    }
  });

  return {
    theme,
  };
}

export default mergeConfigs;
