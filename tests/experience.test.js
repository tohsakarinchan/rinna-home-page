import test from 'node:test'
import assert from 'node:assert/strict'
import { reactive, ref, computed, nextTick, effectScope } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { routes, scrollBehavior } from '../src/app/routes.js'
import { createCueController } from '../src/features/experience/domain/cue-controller.js'
import { readingLocation } from '../src/features/experience/domain/reading-location.js'
import { createExperience } from '../src/features/experience/composables/useExperience.js'
import { countries, countryTrips, tripCountry, regionGroups, projectCountry } from '../src/features/travel/domain/countries.js'
import { useTripRoute } from '../src/features/travel/composables/useTripRoute.js'
import { usePassportData } from '../src/features/travel/composables/usePassportData.js'
import { assemblePassport } from '../server/notion-passport.js'
import { mountComposable, mockGlobal } from './helpers/vue.js'
import { signatureFrame, signatureTiming } from '../src/features/experience/domain/signature-intro.js'

test('signature dot stays hollow before reveal and its opening clears all viewport corners', () => {
  for (const [width, height] of [[1280, 720], [390, 844], [844, 390], [320, 568]]) {
    const waiting = signatureFrame(signatureTiming.dotEnd, width, height)
    assert.equal(waiting.dot, 1)
    assert.equal(waiting.hole, 0, 'writing the ring does not expose a thumbnail of the page')
    const start = signatureFrame(signatureTiming.revealStart, width, height)
    const opening = signatureFrame(signatureTiming.revealStart + 1, width, height)
    assert.ok(Math.abs(opening.radius - start.radius) < .01, 'the existing ring expands without a size jump')
    const finish = signatureFrame(signatureTiming.revealEnd, width, height)
    for (const [x, y] of [[0, 0], [width, 0], [0, height], [width, height]]) {
      assert.ok(finish.hole > Math.hypot(x - finish.cx, y - finish.cy), 'no covered corner remains when the overlay is removed')
    }
    assert.equal(finish.radius, finish.hole, 'the pen ring remains the edge of the page opening')
    assert.ok(waiting.cx > 0 && waiting.cx < width && waiting.cy > 0 && waiting.cy < height)
  }
})

test('cue replacement, skip, cancel and dispose never run stale navigation', () => {
  const pending = new Map(), old = [], calls = [], states = []
  let id = 0
  const cue = createCueController({
    schedule(fn) { pending.set(++id, fn); old.push(fn); return id },
    unschedule(key) { pending.delete(key) }, change: state => states.push(state),
  })
  cue.start({ kind: 'ride' }, () => calls.push('old'))
  cue.start({ kind: 'earth' }, () => calls.push('new'))
  old[0]()
  assert.deepEqual(calls, [])
  cue.finish(); cue.finish(); old[1]()
  assert.deepEqual(calls, ['new'])
  assert.equal(pending.size, 0)
  cue.start({ kind: 'ride' }, () => calls.push('cancelled'))
  cue.cancel(); old[2]()
  cue.start({ kind: 'ride' }, () => calls.push('no-motion'), false)
  assert.deepEqual(calls, ['new', 'no-motion'])
  cue.start({ kind: 'ride' }, () => calls.push('disposed'))
  cue.dispose(); old[3](); cue.start({ kind: 'ride' }, () => calls.push('late'), false)
  assert.deepEqual(calls, ['new', 'no-motion'])
  assert.equal(states.at(-1), null)
  assert.equal(pending.size, 0)
})

test('country adapters preserve legacy trips, explicit countries, empty states and domestic grouping', () => {
  const trips = [{ id: 'old' }, { id: 'cn', country: '中国', city: '上海' }, { id: 'fr', countryId: 'fr' }, { id: 'other', country: 'unknown' }, { id: 'cn2', country: 'CN' }]
  assert.deepEqual(countryTrips(trips, 'jp').map(t => t.id), ['old'])
  assert.deepEqual(countryTrips(trips, 'cn').map(t => t.id), ['cn', 'cn2'])
  assert.equal(tripCountry(trips[3]), 'unknown')
  assert.deepEqual(regionGroups(countryTrips(trips, 'cn')), ['上海', '地区待整理'])
  assert.equal(countryTrips([], 'fr').length, 0)
  assert.equal(projectCountry([0, 0], 0).visible, true)
  assert.equal(projectCountry([0, 0], 180).visible, false)
  for (const country of countries) {
    const point = projectCountry(country.center)
    assert.ok(point.x >= 0 && point.x <= 100 && point.y >= 0 && point.y <= 100)
  }
})

test('optional country fields cross the server boundary without requiring a data migration', () => {
  const text = value => ({ rich_text: [{ plain_text: value }] })
  const input = { trips: [{ id: 'cn', properties: { Country: text('cn'), Region: text('上海'), City: text('上海市') } }], days: [], places: [], stops: [], chapters: [] }
  const trip = assemblePassport(input).trips[0]
  assert.deepEqual([trip.country, trip.region, trip.city], ['cn', '上海', '上海市'])
})

test('real route table supports deep links, legacy entry, article links and back navigation', async () => {
  const stub = records => records.map(record => ({ ...record, ...(record.component ? { component: { render: () => null } } : {}), ...(record.children ? { children: stub(record.children) } : {}) }))
  const router = createRouter({ history: createMemoryHistory(), routes: stub(routes) })
  for (const [path, name] of [['/', 'home'], ['/eresh', 'eresh'], ['/archer', 'archer'], ['/travel', 'globe'], ['/travel/cn', 'country'], ['/travel/jp/trips/a%20b', 'trip']]) {
    await router.push(path)
    assert.equal(router.currentRoute.value.name, name)
  }
  assert.equal(router.currentRoute.value.params.tripId, 'a b')
  await router.push('/passport')
  assert.equal(router.currentRoute.value.path, '/travel/jp')
  await router.push('/blog/old-story')
  assert.equal(router.currentRoute.value.params.slug, 'old-story')
  const returned = new Promise(resolve => { const off = router.afterEach(() => { off(); resolve() }) })
  router.back(); await returned
  assert.equal(router.currentRoute.value.path, '/travel/jp')
  assert.equal(scrollBehavior({ name: 'country', params: { country: 'jp' } }, { name: 'trip', params: { country: 'jp' } }), false)
  assert.deepEqual(scrollBehavior({ name: 'country', params: { country: 'cn' } }, { name: 'trip', params: { country: 'jp' } }), { top: 0 })
  assert.equal(readingLocation('//outside.test/travel/jp'), '')
  assert.equal(readingLocation('/travel/jp?redirect=outside'), '')
  assert.equal(readingLocation('/travel/jp/trips/real-id'), '/travel/jp/trips/real-id')
})

test('trip deep links wait for summary, validate country, cancel on back and ignore late detail', async () => {
  const route = reactive({ params: { tripId: 'a' } }), scope = effectScope(), pending = [], paths = []
  let data, navigation
  scope.run(() => {
    data = usePassportData({ fetchDetail: (id, { signal }) => new Promise(resolve => pending.push({ id, signal, resolve })) })
    navigation = useTripRoute({ route, router: { push: path => paths.push(path), replace: path => paths.push(path) }, country: ref(countries[1]), trips: computed(() => countryTrips(data.trips.value, 'jp')), loading: data.passportLoading, selectTrip: data.selectTrip, cancelDetail: data.cancelDetail })
  })
  assert.equal(navigation.dialog.value, false)
  assert.equal(pending.length, 0)
  data.trips.value = [{ id: 'a' }, { id: 'b' }, { id: 'cn', country: 'cn' }]
  data.passportLoading.value = false
  await nextTick()
  assert.equal(navigation.dialog.value, true)
  assert.equal(pending[0].id, 'a')
  route.params.tripId = 'b'; await nextTick()
  assert.equal(pending[0].signal.aborted, true)
  pending[0].resolve({ id: 'a', days: ['stale'] }); await nextTick()
  assert.equal(data.selected.value.id, 'b')
  navigation.dialog.value = false
  assert.equal(paths.at(-1), '/travel/jp')
  route.params.tripId = undefined; await nextTick()
  assert.equal(navigation.dialog.value, false)
  pending[1].resolve({ id: 'b', days: ['late'] }); await nextTick()
  assert.equal(data.selected.value, null)
  route.params.tripId = 'cn'; await nextTick()
  assert.equal(navigation.missing.value, true)
  assert.equal(pending.length, 2)
  route.params.tripId = 'b'; await nextTick()
  scope.stop()
  assert.equal(pending[2].signal.aborted, true)
  pending[2].resolve({ id: 'b' })
})

test('experience honors session intro, route cancellation, visibility, motion changes and cleanup', async t => {
  const storage = new Map(), listeners = new Map(), pending = new Map(), pushes = []
  let timer = 0
  mockGlobal(t, 'sessionStorage', { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) })
  mockGlobal(t, 'localStorage', { getItem: () => null, setItem() {} })
  const doc = { hidden: false, documentElement: { dataset: {} }, addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name) }
  mockGlobal(t, 'document', doc)
  const query = { matches: false, addEventListener() {}, removeEventListener() {} }
  mockGlobal(t, 'window', { matchMedia: () => query })
  mockGlobal(t, 'setTimeout', fn => { pending.set(++timer, fn); return timer })
  mockGlobal(t, 'clearTimeout', id => pending.delete(id))
  const route = reactive({ path: '/', fullPath: '/' })
  const mounted = mountComposable(() => createExperience({ route, router: { push: path => pushes.push(path) } }))
  const state = mounted.state
  assert.equal(state.cue.value.kind, 'intro')
  state.skipCue()
  state.travelCue('ride', '/travel/jp')
  const stale = [...pending.values()][0]
  route.path = route.fullPath = '/eresh'; await nextTick(); stale()
  assert.deepEqual(pushes, [])
  state.travelCue('ride', '/travel/cn')
  doc.hidden = true; listeners.get('visibilitychange')()
  assert.equal(pending.size, 0)
  doc.hidden = false
  state.travelCue('ride', '/travel/jp')
  state.toggleMotion(); await nextTick()
  assert.deepEqual(pushes, ['/travel/jp'])
  assert.equal(pending.size, 0)
  route.path = route.fullPath = '/travel/jp/trips/a'; await nextTick()
  assert.equal(state.lastReading.value, '/travel/jp/trips/a')
  route.path = route.fullPath = '/travel/jp'; await nextTick()
  assert.equal(state.lastReading.value, '/travel/jp/trips/a', 'closing the reader keeps the last trip bookmark')
  mounted.unmount()
  assert.equal(listeners.size, 0)
  const again = mountComposable(() => createExperience({ route: reactive({ path: '/', fullPath: '/' }), router: { push() {} } }))
  assert.equal(again.state.cue.value, null)
  again.unmount()
  query.matches = true
  storage.delete('rinna-intro-seen')
  const reduced = mountComposable(() => createExperience({ route, router: { push: path => pushes.push(path) } }))
  assert.equal(reduced.state.motionEnabled.value, false)
  reduced.state.travelCue('ride', '/travel/cn')
  assert.equal(pushes.at(-1), '/travel/cn')
  assert.equal(pending.size, 0)
  reduced.unmount()
})
