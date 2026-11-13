import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { parse, compileScript } from 'vue/compiler-sfc'
import { h, ref, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { mountComponent } from './helpers/vue.js'
import { countries } from '../src/features/travel/domain/countries.js'

// Compile the real SFC and mount with Vue's custom renderer; this does not launch a browser.
async function component(relative) {
  const url = new URL(relative, import.meta.url)
  const { descriptor } = parse(await fs.readFile(url, 'utf8'))
  const script = compileScript(descriptor, { id: relative, inlineTemplate: true }).content
    .replace(/from\s+(['"])([^'"]+)\1/g, (_, quote, source) => `from ${quote}${source === 'vue' ? import.meta.resolve('vue') : new URL(source, url).href}${quote}`)
  return (await import(`data:text/javascript;base64,${Buffer.from(script).toString('base64')}`)).default
}
function find(root, match) {
  return [root, ...(root.children || []).flatMap(child => find(child, match))].filter(match)
}

test('globe unmounts failed media, restores projection selection and releases media on page exit', async () => {
  const TravelGlobe = await component('../src/features/travel/components/TravelGlobe.vue')
  let released = 0, selected
  const BrokenMedia = {
    setup() {
      onMounted(() => { throw new Error('WebGL unavailable') })
      onBeforeUnmount(() => released++)
      return () => h('canvas')
    },
  }
  const mounted = mountComponent({ render: () => h(TravelGlobe, { visited: [countries[1]], onSelect: value => { selected = value } }, { renderer: () => h(BrokenMedia) }) })
  await nextTick()
  assert.equal(released, 1)
  assert.equal(find(mounted.root, node => node.tag === 'canvas').length, 0)
  const markers = find(mounted.root, node => node.class === 'globe-marker')
  assert.equal(markers.length, 1)
  markers[0].onClick()
  assert.equal(selected.id, 'jp')
  mounted.unmount()
  assert.equal(mounted.root.children.length, 0)
  const HealthyMedia = { setup() { onBeforeUnmount(() => released++); return () => h('canvas') } }
  const healthy = mountComponent({ render: () => h(TravelGlobe, { visited: [] }, { renderer: () => h(HealthyMedia) }) })
  assert.equal(find(healthy.root, node => node.tag === 'canvas').length, 1)
  healthy.unmount()
  assert.equal(released, 2, 'normal page exit also unmounts the renderer so it can dispose resources')
})

test('scene image failure displays a placeholder and a new form retries its own asset', async () => {
  const SceneStage = await component('../src/features/experience/components/SceneStage.vue')
  const scene = ref({ id: 'one', title: 'One', portrait: '/one.png' })
  const mounted = mountComponent({ render: () => h(SceneStage, { scene: scene.value }) })
  const image = find(mounted.root, node => node.tag === 'img')[0]
  image.onError()
  await nextTick()
  assert.equal(find(mounted.root, node => node.tag === 'img').length, 0)
  assert.equal(find(mounted.root, node => node.class === 'scene-placeholder').length, 1)
  scene.value = { id: 'two', title: 'Two', portrait: '/two.png' }
  await nextTick()
  assert.equal(find(mounted.root, node => node.tag === 'img')[0].src, '/two.png')
  mounted.unmount()
})
