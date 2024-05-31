import type { PluginObj, Visitor } from "@babel/core";
import {
  arrayExpression,
  booleanLiteral,
  Expression,
  identifier,
  importDeclaration,
  importDefaultSpecifier,
  isExpression,
  isJSXAttribute,
  isJSXIdentifier,
  isJSXNamespacedName,
  isJSXSpreadAttribute,
  jsxAttribute,
  jSXExpressionContainer,
  JSXIdentifier,
  jsxIdentifier,
  JSXMemberExpression,
  JSXNamespacedName,
  JSXOpeningElement,
  nullLiteral,
  numericLiteral,
  objectExpression,
  objectProperty,
  stringLiteral,
  unaryExpression,
  variableDeclaration,
  variableDeclarator,
} from "@babel/types";
import * as fs from "fs";
import { resolve } from "path";
import { defaultExtractor } from "../extractor/defaultExtractor";
import build from "../compiler/build";
import * as fg from "fast-glob";

export default function tailwindBabelPlugin(): PluginObj {
  let tailwindConfig = getTailwindConfig();
  let filenames = getFileNames(tailwindConfig.content);
  let theme = build(tailwindConfig);
  let extractor = defaultExtractor(tailwindConfig);

  return {
    visitor: {
      Program: {
        enter(path, { filename, file: { code } }) {
          if (filename != null && filenames.includes(filename)) {
            let state = { includesTailwindComponent: false };
            path.traverse(convertToComponentWrapper, state);

            if (state.includesTailwindComponent) {
              let styleSheetExpression = getStylesheetExpression(
                extractor,
                code,
                theme
              );

              path.node.body.push(styleSheetExpression as any);

              let importStatement = importDeclaration(
                [importDefaultSpecifier(identifier("TailwindWrapper"))],
                stringLiteral("@rn-tools/tailwind")
              );

              path.node.body.unshift(importStatement as any);
            }
          }
        },
      },
    },
  };
}

function getTailwindConfig() {
  let configPath = resolve(process.cwd(), "tailwind.config.js");
  let tailwindConfig: { content: string[] } = {
    content: ["**/**.{tsx,js}"],
  };

  if (fs.existsSync(configPath)) {
    let config = require(configPath);
    tailwindConfig = {
      ...tailwindConfig,
      ...config,
    };
  }

  return tailwindConfig;
}

function getFileNames(globs: string[]) {
  let filenames = fg
    .sync(
      globs.map((str) => resolve(process.cwd(), str)),
      {
        cwd: process.cwd(),
        ignore: ["node_modules/*"],
      }
    )
    .filter((path) => !path.includes("node_modules"));
  return filenames;
}

function getStylesheetExpression(extractor: any, code: string, theme: any) {
  const classes = extractor(code);
  const styleSheet: any = {};

  classes.forEach((className: string) => {
    if (theme[className] != null && typeof theme[className] === "object") {
      styleSheet[className] = theme[className];
    }
  });

  const stylesheetExpression = variableDeclaration("const", [
    variableDeclarator(
      identifier("styleSheet"),
      babelSerializeLiteral(styleSheet)
    ),
  ]);

  return stylesheetExpression;
}

// @ts-ignore
// ref: https://github.com/marklawlor/nativewind/blob/next/packages/nativewind/src/postcss/serialize.ts
function babelSerializeLiteral(literal: any): Expression {
  if (isExpression(literal)) {
    return literal;
  }

  if (literal === null) {
    return nullLiteral();
  }

  switch (typeof literal) {
    case "number":
      return numericLiteral(literal);
    case "string":
      return stringLiteral(literal);
    case "boolean":
      return booleanLiteral(literal);
    case "undefined":
      return unaryExpression("void", numericLiteral(0), true);
    default:
      if (Array.isArray(literal)) {
        return arrayExpression(literal.map((n) => babelSerializeLiteral(n)));
      }

      if (typeof literal === "object") {
        return objectExpression(
          Object.keys(literal)
            .filter((k) => {
              return typeof literal[k] !== "undefined";
            })
            .map((k) => {
              return objectProperty(
                stringLiteral(k),
                babelSerializeLiteral(literal[k])
              );
            })
        );
      }

      return nullLiteral();
  }
}

const convertToComponentWrapper: Visitor = {
  JSXElement(path, state: any) {
    let hasStylesProp = false;
    let openingElement = path.node.openingElement;

    for (let attribute of openingElement.attributes) {
      if (
        isJSXAttribute(attribute) &&
        isJSXIdentifier(attribute.name, { name: "styles" })
      ) {
        hasStylesProp = true;
        state.includesTailwindComponent = true;
        break;
      }

      if (isJSXSpreadAttribute(attribute)) {
        hasStylesProp = true;
        state.includesTailwindComponent = true;
        break;
      }
    }
    // @ts-ignore
    let elementName = getJSXElementName(openingElement);

    if (hasStylesProp) {
      // @ts-ignore
      openingElement.name = jsxIdentifier("TailwindWrapper");

      if (path.node.closingElement != null) {
        // @ts-ignore
        path.node.closingElement.name = jsxIdentifier("TailwindWrapper");
      }

      openingElement.attributes.push(
        // @ts-ignore
        jsxAttribute(
          jsxIdentifier("component"),
          jSXExpressionContainer(identifier(elementName))
        )
      );

      openingElement.attributes.push(
        // @ts-ignore
        jsxAttribute(
          jsxIdentifier("styleSheet"),
          jSXExpressionContainer(identifier("styleSheet"))
        )
      );
    }
  },
};

// ref: https://github.com/marklawlor/nativewind/blob/next/packages/nativewind/src/babel/utils/get-jsx-element-name.ts
export function getJSXElementName(node: JSXOpeningElement) {
  return getElementName(node.name);
}

/**
 * Recursive helper function for getJSXElementName
 */
function getElementName(
  node: JSXIdentifier | JSXNamespacedName | JSXMemberExpression
): string {
  if (isJSXIdentifier(node)) {
    return node.name;
  } else if (isJSXNamespacedName(node)) {
    return node.name.name;
  } else {
    return getElementName(node.object);
  }
}
