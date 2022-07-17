import defaultConfig from "../defaultConfig";
import defaultPlugins from "./plugins";
import mergeConfigs from "./util/mergeConfigs";

function build(customConfig: any) {
  let styles = {};
  let mergedConfig = mergeConfigs(defaultConfig, customConfig);

  defaultPlugins.forEach((plugin) => {
    let style = plugin(mergedConfig.theme);
    Object.assign(styles, style);
  });

  return styles;
}

export default build;
