// ref: https://github.com/tailwindlabs/tailwindcss/blob/master/src/lib/regex.js
const REGEX_SPECIAL = /[\\^$.*+?()[\]{}|]/g;
const REGEX_HAS_SPECIAL = RegExp(REGEX_SPECIAL.source);

/**
 * @param {string|RegExp|Array<string|RegExp>} source
 */
function toSource(source: any) {
  source = Array.isArray(source) ? source : [source];

  source = source.map((item: any) =>
    item instanceof RegExp ? item.source : item
  );

  return source.join("");
}

/**
 * @param {string|RegExp|Array<string|RegExp>} source
 */
export function pattern(source: any) {
  return new RegExp(toSource(source), "g");
}

/**
 * @param {string|RegExp|Array<string|RegExp>} source
 */
export function withoutCapturing(source: any) {
  return new RegExp(`(?:${toSource(source)})`, "g");
}

/**
 * @param {Array<string|RegExp>} sources
 */
export function any(sources: any) {
  return `(?:${sources.map(toSource).join("|")})`;
}

/**
 * @param {string|RegExp} source
 */
export function optional(source: any) {
  return `(?:${toSource(source)})?`;
}

/**
 * @param {string|RegExp|Array<string|RegExp>} source
 */
export function zeroOrMore(source: any) {
  return `(?:${toSource(source)})*`;
}

/**
 * Generate a RegExp that matches balanced brackets for a given depth
 * We have to specify a depth because JS doesn't support recursive groups using ?R
 *
 * Based on https://stackoverflow.com/questions/17759004/how-to-match-string-within-parentheses-nested-in-java/17759264#17759264
 *
 * @param {string|RegExp|Array<string|RegExp>} source
 */
export function nestedBrackets(open: any, close: any, depth = 1): any {
  return withoutCapturing([
    escape(open),
    /[^\s]*/,
    depth === 1
      ? `[^${escape(open)}${escape(close)}\s]*`
      : any([
          `[^${escape(open)}${escape(close)}\s]*`,
          nestedBrackets(open, close, depth - 1),
        ]),
    /[^\s]*/,
    escape(close),
  ]);
}

export function escape(string: string) {
  return string && REGEX_HAS_SPECIAL.test(string)
    ? string.replace(REGEX_SPECIAL, "\\$&")
    : string || "";
}
