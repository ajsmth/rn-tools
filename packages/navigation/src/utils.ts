export let generateStackId = createIdGenerator("stack");
export let generateScreenId = createIdGenerator("screen");
export let generateTabId = createIdGenerator("tab");

function createIdGenerator(name: string) {
  let counter = 0;

  return function generateId() {
    return name + "-" + counter++;
  };
}


export let serializeTabIndexKey = (tabId: string, index: number) =>
  `${tabId}-${index}`;
