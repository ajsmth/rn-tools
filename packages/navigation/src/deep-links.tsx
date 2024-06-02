import { match } from "path-to-regexp";
import * as React from "react";

export type DeepLinkHandler<T> = {
  path: string;
  handler: (params: T) => void;
};

function buildMatchers<T>(handlers: DeepLinkHandler<T>[]) {
  return handlers.map(({ path, handler }) => {
    let fn = match(path, { decode: decodeURIComponent });
    return { fn, handler };
  });
}

type DeepLinksProps<T> = {
  path: string;
  handlers: DeepLinkHandler<T>[];
  children: React.ReactNode;
};

export function DeepLinks<T>({ path = '', handlers = [], children }: DeepLinksProps<T>) {
  React.useEffect(() => {
    let matchers = buildMatchers(handlers);

    for (let matcher of matchers) {
      let { fn, handler } = matcher;
      let match = fn(path);
      if (match) {
        setImmediate(() => handler(match.params as T));
        break;
      }
    }
  }, [path, handlers]);

  return <>{children}</>;
}
