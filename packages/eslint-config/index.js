
/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  parserOptions: {
    ecmaVersion: "latest",
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    commonjs: true,
    es6: true,
    node: true,
  },

  // Base config
  extends: ["eslint:recommended"],

  ignorePatterns: ["**/**.md"],

  overrides: [
    // React
    {
      files: ["**/*.{js,jsx,ts,tsx}"],
      plugins: ["react", "jsx-a11y"],
      extends: [
        "plugin:react/recommended",
        "plugin:react/jsx-runtime",
        "plugin:react-hooks/recommended",
        "plugin:jsx-a11y/recommended",
        "prettier",
      ],
      settings: {
        react: {
          version: "detect",
        },

        "import/ignore": ["react-native"],
      },
      rules: {
        "react/no-unescaped-entities": "off",
      },
    },

    // Typescript
    {
      files: ["**/*.{ts,tsx}"],
      plugins: ["@typescript-eslint", "import", "unused-imports"],
      parser: "@typescript-eslint/parser",
      settings: {
        "import/internal-regex": "^~/",
        "import/resolver": {
          node: {
            extensions: [".ts", ".tsx"],
          },
          typescript: {
            alwaysTryTypes: true,
          },
        },
      },
      extends: [
        "plugin:@typescript-eslint/recommended",
        "plugin:@typescript-eslint/stylistic",
        "plugin:import/recommended",
        "plugin:import/typescript",
        "prettier",
      ],
      rules: {
        "eslint/prefer-const": 0,
        "prefer-const": 0,

        "unused-imports/no-unused-imports": 0,
        "unused-imports/no-unused-vars": [
          "warn",
          {
            vars: "all",
            varsIgnorePattern: "^_",
            args: "after-used",
            argsIgnorePattern: "^_",
          },
        ],

        "import/order": [
          "error",
          {
            alphabetize: { caseInsensitive: true, order: "asc" },
            groups: ["builtin", "external", "internal", "parent", "sibling"],
            "newlines-between": "always",
          },
        ],

        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/consistent-type-definitions": "off",
      },
    },

    // Jest/Vitest
    {
      files: ["**/*.test.{js,jsx,ts,tsx}"],
      plugins: ["jest", "jest-dom", "testing-library"],
      extends: [
        "plugin:jest/recommended",
        "plugin:jest-dom/recommended",
        "plugin:testing-library/react",
        "prettier",
      ],
      env: {
        "jest/globals": true,
      },
      settings: {
        jest: {
          // we're using vitest which has a very similar API to jest
          // (so the linting plugins work nicely), but it means we have to explicitly
          // set the jest version.
          version: 28,
        },
      },
    },

    // Node
    {
      files: [".eslintrc.js", "mocks/**/*.js"],
      env: {
        node: true,
      },
    },
  ],
}; 