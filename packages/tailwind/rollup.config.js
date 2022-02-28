import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "@rollup/plugin-typescript";
import jsx from "acorn-jsx";
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: "src/index.ts",
    output: {
      file: "build/index.js",
      format: "cjs",
      exports: "named",
    },
    plugins: [json(), typescript({ tsconfig: "./tsconfig.json", declarationDir: "./" })],
    acornInjectPlugins: [jsx()],
    external: ["react", "react-native"],
  },
  {
    input: "cli/index.js",
    output: {
      file: "build/cli.js",
      format: "cjs",
      exports: "default",
    },
    plugins: [
      commonjs({
        ignoreDynamicRequires: true,
      }),
      terser(),
    ],
    external: [
      "fs",
      "path",
      "util",
      "glob",
      "cli-progress",
      "yargs/yargs",
      "yargs/helpers",
      "chalk",
    ],
  },
];
