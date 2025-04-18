import { NavigationItemType } from './navigation-item'


// - find focused navigation item 
// - find focused navigation item of given type - stack, tabs, etc

export function createNavigationRenderTree() {

  let tree: NavigationItemType[] = []

  function appendChild(child: NavigationItemType, parent: NavigationItemType | null) {
    if (parent == null) {
      tree.push(child)
    }

    let found = false
    while (!found) {
      for (let i = 0; i < tree.length - 1; i++) {
        let item = tree[i]
        if (item === parent) {
          parent.children.push(child)
          found = true
        }
      }
    }
  }

  return {
    appendChild
  }
}
