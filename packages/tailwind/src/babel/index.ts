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
  isJSXElement,
  isJSXIdentifier,
  jsxAttribute,
  JSXElement,
  jSXExpressionContainer,
  jsxIdentifier,
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

export default function tailwindBabelPlugin(): PluginObj {
  let configPath = resolve(process.cwd(), "tailwind.config.js");
  let tailwindConfig = {};
  if (fs.existsSync(configPath)) {
    tailwindConfig = require(configPath);
  }
  let theme = build(tailwindConfig);

  return {
    pre(state) {
      this.cache = new Map();
      // @ts-ignore
      this.cache.set("styles", []);
    },
    visitor: {
      Program: {
        enter(path, state) {
          // @ts-ignore
          if (state?.filename?.includes("/node_modules/")) {
            return;
          }

          const extractor = defaultExtractor(tailwindConfig);
          const classes = extractor(state.file.code);
          const styleSheet: any = {};

          classes.forEach((className: string) => {
            if (
              theme[className] != null &&
              typeof theme[className] === "object"
            ) {
              styleSheet[className] = theme[className];
            }
          });

          const stylesExpression = variableDeclaration("const", [
            variableDeclarator(
              identifier("styleSheet"),
              babelSerializeLiteral(styleSheet)
            ),
          ]);

          path.node.body.push(stylesExpression as any);
          let s = { includesTailwindComponent: false };
          path.traverse(convertToComponentWrapper, s);

          if (s.includesTailwindComponent) {
            let importStatement = importDeclaration(
              [importDefaultSpecifier(identifier("TailwindWrapper"))],
              stringLiteral("@rn-toolkit/tailwind")
            );

            // @ts-ignore
            path.node.body.unshift(importStatement);
          }
        },
      },
    },
    post(state) {},
  };
}

// @ts-ignore
// TODO: REF
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
    }

    if (hasStylesProp) {
      // @ts-ignore
      let elementName = openingElement.name.name;

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
  JSXSpreadAttribute(path, state: any) {
    // TODO - figure out why this is throwing - potentially multiple imports?
    // state.includesTailwindComponent = true;
    // // @ts-ignore
    // let element: JSXElement = path.findParent((p) => isJSXElement(p));

    // if (element != null) {
    //   // @ts-ignore
    //   let openingElement = element.node.openingElement;
    //   // @ts-ignore
    //   let elementName = openingElement.name.name;

    //   // @ts-ignore
    //   openingElement.name = jsxIdentifier("TailwindWrapper");

    //   // @ts-ignore
    //   if (element.node.closingElement != null) {
    //     // @ts-ignore
    //     element.node.closingElement.name = jsxIdentifier("TailwindWrapper");
    //   }

    //   openingElement.attributes.push(
    //     // @ts-ignore
    //     jsxAttribute(
    //       jsxIdentifier("component"),
    //       jSXExpressionContainer(identifier(elementName))
    //     )
    //   );

    //   openingElement.attributes.push(
    //     // @ts-ignore
    //     jsxAttribute(
    //       jsxIdentifier("styleSheet"),
    //       jSXExpressionContainer(identifier("styleSheet"))
    //     )
    //   );
    // }
  },
};
