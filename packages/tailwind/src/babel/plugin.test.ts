import * as path from "path";
import pluginTester from "babel-plugin-tester";
import plugin from "./plugin";

const fixtures = path.join(__dirname, "__fixtures__");

pluginTester({
  pluginName: "@rn-tools/tailwind",
  plugin,
  fixtures,
  babelOptions: {
    plugins: ["@babel/plugin-syntax-jsx"],
    cwd: fixtures,
  },
});
