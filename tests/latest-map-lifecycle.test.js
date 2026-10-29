import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import vm from 'node:vm'
import * as echarts from 'echarts/core'
import { MapChart } from 'echarts/charts'
import { SVGRenderer } from 'echarts/renderers'
echarts.use([MapChart, SVGRenderer])

const noop = () => {}
const ref = value => ({ value })
async function component(file, globals, exports) {
  const root = process.env.RINNA_REVIEW_SOURCE_ROOT || process.cwd()
  const text = await readFile(resolve(root, 'src/components', file), 'utf8')
  const script = text.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  return vm.runInNewContext(script + `\n;({${exports}})`, {
    ref, computed: getter => ({ get value() { return getter() } }), watch: noop,
    onMounted: noop, onUnmounted: noop, defineExpose: noop, defineEmits: () => noop,
    defineAsyncComponent: noop, nextTick: async () => {}, structuredClone,
    MapChart: {}, TooltipComponent: {}, VisualMapComponent: {}, GeoComponent: {}, SVGRenderer: {},
    PREFECTURES: [{ name: '东京都' }], console: { error: noop },
    ...globals,
  })
}

test('overview keeps geographic proportions across narrow, wide and resized containers', async () => {
  const map = await component('JapanPrefectureMap.vue', {
    defineProps: () => ({ overview: true, compact: false, visitedPrefectures: [], landmarks: [] }),
    echarts: { use: noop },
  }, 'buildOption, setBounds: value => { overviewBounds = value }')
  map.setBounds([[134, 37], [141, 33]])
  echarts.registerMap('japan-prefecture', { type: 'FeatureCollection', features: [{
    type: 'Feature', properties: { name: '东京都' }, geometry: {
      type: 'Polygon', coordinates: [[[134,33],[141,33],[141,37],[134,37],[134,33]]],
    },
  }] })
  const chart = echarts.init(null, null, { renderer: 'svg', ssr: true, width: 280, height: 534 })
  try {
    const source = map.buildOption()
    delete source.tooltip; delete source.visualMap
    const option = structuredClone(source)
    option.animation = false
    chart.setOption(option)
    for (const [width, height] of [[280,534], [420,440], [900,440], [280,534]]) {
      chart.resize({ width, height })
      const project = point => chart.convertToPixel({ seriesIndex: 0 }, point)
      const origin = project([137,35]), east = project([138,35]), north = project([137,36])
      const ratio = Math.abs((east[0] - origin[0]) / (north[1] - origin[1]))
      assert.ok(Math.abs(ratio - .9) < 1e-6, `${width}px: stretched ratio ${ratio}`)
    }
  } finally { chart.dispose() }
})

test('prefecture highlighting preserves the visitor camera; reset remains explicit', async () => {
  const props = { visitedPrefectures: ['东京都'], activePrefecture: '', landmarks: [], overview: false, compact: false }
  let update, option, camera = { zoom: 4, center: [139.7, 35.7] }
  const chart = { getOption: () => ({ series: [camera] }), setOption: value => { option = value; camera = value.series[0] } }
  const map = await component('JapanPrefectureMap.vue', {
    defineProps: () => props, echarts: { use: noop },
    watch(source, callback, options) { if (options?.deep) update = callback },
  }, 'setChart: value => { chart = value }, resetView')
  map.setChart(chart)
  props.activePrefecture = '东京都'
  update()
  assert.equal(option.series[0].zoom, 4)
  assert.deepEqual(Array.from(option.series[0].center), [139.7, 35.7])
  assert.equal(option.series[0].data[0].value, 2)
  map.resetView()
  assert.equal(option.series[0].zoom, 2)
})

test('repeated retry clicks create one chart and teardown ignores late map responses', async () => {
  let resolveData, created = 0, unmount
  const pending = new Promise(resolve => { resolveData = resolve })
  const chart = { setOption: noop, getOption: () => ({ series: [{ zoom: 2 }] }), on: noop, dispose: noop }
  const map = await component('JapanPrefectureMap.vue', {
    defineProps: () => ({ visitedPrefectures: [], landmarks: [], overview: false }),
    loadJapanGeoJson: () => pending,
    fetch: async () => ({ ok: true, json: () => pending }),
    echarts: { use: noop, registerMap: noop, init: () => { created++; return chart } },
    onUnmounted: callback => { unmount = callback },
    window: { removeEventListener: noop }, document: { removeEventListener: noop },
  }, 'initChart, chartEl')
  map.chartEl.value = {}
  const first = map.initChart(), second = map.initChart()
  resolveData({ features: [] })
  await Promise.all([first, second])
  assert.equal(created, 1)
  const late = map.initChart()
  unmount()
  await late
  assert.equal(created, 1)
})

for (const failure of ['initialization', 'context loss']) {
  test(`3D ${failure} removes canvas, releases GPU resources and keeps the fallback`, async () => {
    let mount, unmount, loseContext
    const count = { removed: 0, geometry: 0, material: 0, disposed: 0, disconnected: 0 }
    const canvas = { setAttribute: noop, addEventListener: (_, callback) => { loseContext = callback }, removeEventListener: noop, remove: () => count.removed++ }
    const material = { dispose: () => count.material++ }, geometry = { dispose: () => count.geometry++ }
    const model = { traverse: callback => { callback({ geometry, material }); callback({ geometry, material }) } }
    const scene = await component('LandmarkScene.vue', {
      defineProps: () => ({ kind: 'tower', active: false }),
      useMotionPreferences: () => ({ motionEnabled: ref(true) }),
      onMounted: callback => { mount = callback }, onUnmounted: callback => { unmount = callback },
      buildLandmark: () => model, window: { devicePixelRatio: 1, matchMedia: () => ({ matches: false }) },
      requestAnimationFrame: () => 1, cancelAnimationFrame: noop,
      ResizeObserver: class { observe() {} disconnect() { count.disconnected++ } },
      T: {
        WebGLRenderer: class { domElement = canvas; setPixelRatio() {} setClearColor() {} dispose() { count.disposed++ } forceContextLoss() {} },
        Scene: class { add() {} }, HemisphereLight: class {}, DirectionalLight: class { position = { set: noop } },
        OrthographicCamera: class { constructor() { if (failure === 'initialization') throw new Error('GPU setup failed') } position = { set: noop }; lookAt() {} },
      },
    }, 'host, failed')
    scene.host.value = { appendChild: noop }
    mount()
    if (failure === 'context loss') loseContext?.()
    assert.equal(scene.failed.value, true)
    assert.equal(count.removed, 1)
    assert.equal(count.geometry, 1)
    assert.equal(count.material, 1)
    assert.equal(count.disposed, 1)
    unmount()
    assert.equal(count.disposed, 1, 'cleanup must be idempotent')
  })
}
