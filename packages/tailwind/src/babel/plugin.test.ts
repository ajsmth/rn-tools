import * as path from "path";
import pluginTester from "babel-plugin-tester";
import plugin from "./index";

const fixtures = path.join(__dirname, "__fixtures__");

pluginTester({
  pluginName: "@rn-toolkit/tailwind",
  plugin,
  fixtures,
  babelOptions: {
    plugins: ["@babel/plugin-syntax-jsx"],
    cwd: fixtures,
  },
});
