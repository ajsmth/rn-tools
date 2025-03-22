type MountStatus = 'initial' | 'mounting' | 'mounted' | 'unmounting' | 'unmounted'
type Listener = (data: NavigationItemState) => void

export type NavigationItemType = {
  onMountStart: () => void,
  onMount: () => void,
  onUnmountStart: () => void,
  onUnmount: () => void,
  subscribe: (listener: Listener) => () => void
  getState: () => NavigationItemState,
  getParent: () => NavigationItemType | null,
  children: NavigationItemType[]
}
type NavigationItemState = {
  mountStatus: MountStatus,
  isFocused: boolean
}

export function createNavigationItem({ parent, navigationTree }: { parent: NavigationItemType | null, navigationTree: unknown }) {
  let listeners: Listener[] = []
  let mountStatus: MountStatus = 'initial'
  let isFocused: boolean = parent ? parent.getState().isFocused : true
  let unsub = parent ? parent.subscribe((state: NavigationItemState) => {
    if (isFocused !== state.isFocused) {
      isFocused = state.isFocused
      scheduleListenerUpdate()
    }
  }) : null
  let children: NavigationItemType[] = []

  function subscribe(listener: Listener) {
    listeners.push(listener)
    return () => {
      listeners = listeners.filter(l => l !== listener)
    }
  }

  function getState() {
    return {
      mountStatus,
      isFocused,
    }
  }

  function getParent() {
    return parent
  }


  let timerRef: NodeJS.Timeout | null = null
  function debounce(fn: () => unknown, timeoutMs: number) {
    clearTimeout(timerRef)

    timerRef = setTimeout(() => {
      fn()
    }, timeoutMs)
  }

  function _scheduleListenerUpdate() {
    let dataToEmit = getState()
    listeners.forEach(listener => listener(dataToEmit))
  }

  function scheduleListenerUpdate() {
    debounce(_scheduleListenerUpdate, 1)
  }

  function onMountStart() {
    mountStatus = 'mounting'
    scheduleListenerUpdate()
  }

  function onMount() {
    mountStatus = 'mounted'
    scheduleListenerUpdate()
  }

  function onUnmountStart() {
    mountStatus = 'unmounting'
    scheduleListenerUpdate()
  }

  function onUnmount() {
    mountStatus = 'unmounted'
    scheduleListenerUpdate()
    if (unsub != null) {
      unsub()
    }
  }

  return {
    onMountStart,
    onMount,
    onUnmountStart,
    onUnmount,
    subscribe,
    getState,
    getParent,
    children
  }
}


