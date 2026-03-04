# Sheets Target API (Design Only)

## Goal

Unify the two entry points so they use the same internal lifecycle:

1. Declarative mount: `<Sheet id="...">...</Sheet>`
2. Imperative open: `sheets.present(id)`
3. Imperative define+open: `sheets.present(<Element />, { id, ...options })`

All should resolve to one canonical id-based sheet definition path.

## Public API

```ts
type SheetsClient = {
  present: {
    (id: string): string;
    (element: React.ReactElement, options: SheetOptions & { id: string }): string;
  };
  dismiss: (id?: string) => void;
  dismissAll: () => void;
  remove: (id: string) => void;
};
```

```tsx
type SheetProps = SheetDefinitionOptions & {
  id: string;
  children: React.ReactNode;
};
```

`wrapped` remains supported for callers who want custom rendering behavior.

## Expected Behavior

- `Sheet` and `present(element, { id })` both register/update the same sheet definition for `id`.
- `present(id)` opens using the currently registered definition for `id`.
- `dismiss(id)` closes that id.
- `dismiss()` closes active/top-most sheet by render-tree resolution.
- `dismissAll()` closes all active sheets.
- `remove(id)` removes the sheet entry for that id.


## Internal Constraints

- No split between “declarative” and “imperative” modes internally.
- No separate id namespaces/prefixes for inline entries.
- One canonical id identity path for definition + open/close lifecycle.
- Sheet slot rendering path should be shared for both entry modes.

## Notes

This file captures intended behavior only; it is not an implementation.
