import { createRenderer } from 'vue'

// Exercise actual Vue mounting, watchers and disposal without a browser.
const renderer = createRenderer({
  createElement: () => ({ children: [] }), createText: text => ({ text }), createComment: text => ({ text }),
  setText(node, text) { node.text = text }, setElementText(node, text) { node.text = text },
  parentNode: node => node.parent, nextSibling: () => null, patchProp() {},
  insert(node, parent) { node.parent = parent; parent.children.push(node) },
  remove(node) { node.parent.children = node.parent.children.filter(child => child !== node) },
})

export function mountComposable(setup) {
  let state
  const app = renderer.createApp({ setup() { state = setup(); return () => null } })
  app.mount({ children: [] })
  return { state, unmount: () => app.unmount() }
}

export function mockGlobal(t, name, value) {
  const original = Object.getOwnPropertyDescriptor(globalThis, name)
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value })
  t.after(() => original ? Object.defineProperty(globalThis, name, original) : delete globalThis[name])
}
