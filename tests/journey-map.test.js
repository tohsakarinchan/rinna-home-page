import test from 'node:test'
import assert from 'node:assert/strict'
import { ref, reactive, computed, nextTick } from 'vue'
import { mountComposable, mockGlobal } from './helpers/vue.js'
import { useJourneyMap } from '../src/features/travel/composables/useJourneyMap.js'

const noop = () => {}

test('journey keeps one map through docking, page changes and activation; teardown frees all resources', async t => {
  const frames = new Map(), timers = new Map(), windowEvents = new Map(), scrollEvents = new Map(), motionEvents = new Set()
  let sequence = 0, removed = 0, disconnected = 0, creates = 0, fits = 0, routes = 0
  mockGlobal(t, 'requestAnimationFrame', fn => { const id = ++sequence; frames.set(id, fn); return id })
  mockGlobal(t, 'cancelAnimationFrame', id => frames.delete(id))
  t.mock.method(globalThis, 'setTimeout', fn => { const id = ++sequence; timers.set(id, fn); return id })
  t.mock.method(globalThis, 'clearTimeout', id => timers.delete(id))
  const query = { matches: false, addEventListener: (_, fn) => motionEvents.add(fn), removeEventListener: (_, fn) => motionEvents.delete(fn) }
  mockGlobal(t, 'window', { innerWidth: 1200, matchMedia: () => query, addEventListener: (name, fn) => windowEvents.set(name, fn), removeEventListener: name => windowEvents.delete(name) })
  mockGlobal(t, 'document', { documentElement: { dataset: {} }, createElement: () => ({}), activeElement: null })
  mockGlobal(t, 'ResizeObserver', class { observe() {} disconnect() { disconnected++ } })
  mockGlobal(t, 'localStorage', { getItem: () => null })
  const scrollRoot = { scrollTop: 0, scrollHeight: 2000, clientHeight: 600, getBoundingClientRect: () => ({ top: 100 }),
    addEventListener: (name, fn) => scrollEvents.set(name, fn), removeEventListener: name => scrollEvents.delete(name), scrollTo: noop }
  const control = { addTo() { return this }, remove: noop }
  const map = { on() { return this }, closePopup: noop, stop: noop, remove() { removed++ }, setView: noop,
    fitBounds() { fits++ }, invalidateSize: noop, getSize: () => ({ x: 400, y: 400 }) }
  for (const name of ['dragging', 'scrollWheelZoom', 'doubleClickZoom', 'touchZoom', 'boxZoom', 'keyboard']) map[name] = { enable: noop, disable: noop }
  const popup = { options: {}, setLatLng() { return this }, setContent() { return this }, openOn() { return this }, update: noop, getElement: () => null }
  const L = {
    map: () => { creates++; return map }, control: { zoom: () => control },
    DomEvent: { disableClickPropagation: noop, disableScrollPropagation: noop }, popup: () => popup,
    tileLayer: () => ({ on() { return this }, addTo() { return this }, redraw: noop }),
    layerGroup: () => ({ addTo() { return this }, clearLayers: noop }),
    polyline: () => ({ addTo() { return this }, setLatLngs() { routes++ }, setStyle: noop }),
    divIcon: value => value, point: (x, y) => [x, y],
    marker: () => ({ options: {}, addTo() { return this }, on() { return this }, getElement: () => ({ classList: { toggle: noop, remove: noop } }) }),
    latLngBounds: () => ({ getSouthWest: () => ({ equals: () => false }), getNorthEast: () => ({}) }),
  }
  const data = { stops: [{ id: 'a', name: '东京', geo: [35, 139] }, { id: 'b', name: '京都', geo: [34, 135] }], journal: [{ heading: '东京', text: '' }] }
  const props = reactive({ active: true, motionEnabled: false, initialPage: 0, mapHost: {}, days: [data, data] })
  const page = ref(0), day = computed(() => props.days[page.value]), layouts = []
  const surface = { clientWidth: 400, style: { setProperty: noop }, addEventListener: noop, removeEventListener: noop }
  let bottom = -10
  const mounted = mountComposable(() => {
    const state = useJourneyMap(props, day, page, (_, value) => layouts.push(value), { L })
    state.mapEl.value = surface
    state.mapSlot.value = { offsetHeight: 300, getBoundingClientRect: () => ({ bottom, top: 0 }) }
    state.journeyEl.value = { closest: () => scrollRoot, getBoundingClientRect: () => ({ left: 0 }),
      querySelector: () => null, querySelectorAll: () => [{ getBoundingClientRect: () => ({ top: 110, bottom: 300 }) }] }
    return state
  })
  const flush = async () => { const pending = [...frames.values()]; frames.clear(); for (const fn of pending) await fn(1000); await nextTick() }
  await flush(); await flush()
  assert.equal(mounted.state.docked.value, true)
  assert.equal(mounted.state.readingLabel.value, '东京')
  assert.ok(routes > 0 && fits > 0)
  bottom = 500
  scrollEvents.get('scroll')()
  await flush()
  assert.equal(mounted.state.docked.value, false)
  props.initialPage = 1
  await nextTick(); await nextTick()
  assert.equal(page.value, 1)
  props.active = false
  await nextTick()
  props.active = true
  await nextTick(); await flush()
  assert.equal(creates, 1)
  assert.ok(layouts.includes(true) && layouts.includes(false))
  mounted.unmount()
  assert.equal(removed, 1)
  assert.equal(disconnected, 1)
  assert.equal(frames.size, 0)
  assert.equal(timers.size, 0)
  assert.equal(scrollEvents.size, 0)
  assert.equal(windowEvents.size, 0)
  assert.equal(motionEvents.size, 0)
})
