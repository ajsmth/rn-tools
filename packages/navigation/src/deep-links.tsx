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

export function DeepLinks<T>({ path, handlers, children }: DeepLinksProps<T>) {
  let matchers = React.useRef(buildMatchers(handlers));

  React.useLayoutEffect(() => {
    matchers.current = buildMatchers(handlers);
  }, [handlers]);

  React.useEffect(() => {
    matchers.current.forEach(({ fn, handler }) => {
      let match = fn(path);
      if (match) {
        return setImmediate(() => handler(match.params as T));
      }
    });
  }, [path]);

  return <>{children}</>;
}
