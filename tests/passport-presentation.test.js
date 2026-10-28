import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { ref, computed, watch } from 'vue'
import { passportSpreads, latestTrip } from '../src/utils/passport-layout.js'

test('stickers remain on individual pages, including incomplete spreads', () => {
  for (const count of [0, 1, 2, 3, 4, 5, 9]) {
    const trips = Array.from({ length: count }, (_, id) => ({ id }))
    const spreads = passportSpreads(trips)
    assert.ok(spreads.every(spread => spread.length === 2 && spread.every(page => page.length <= 2)))
    assert.deepEqual(spreads.flat(2).map(item => item.trip.id), trips.map(trip => trip.id))
    assert.deepEqual(spreads.flat(2).map(item => item.number), trips.map((_, index) => index + 1))
  }
})

test('latest journey follows month rather than editorial display order', () => {
  const trips = [{ month: '2026.2' }, { month: '2024.06' }, { month: '2026.10' }]
  assert.equal(latestTrip(trips), trips[2])
  assert.equal(trips[0].month, '2026.2')
  assert.equal(latestTrip([]), null)
})

test('motion preference is shared, persisted and overridden by live system changes', async () => {
  const mounts = [], unmounts = [], listeners = new Set(), storage = new Map()
  const document = { documentElement: { dataset: {} } }
  const query = { matches: false, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) }
  const source = (await readFile(new URL('../src/utils/motion-preferences.js', import.meta.url), 'utf8')).replace(/^import .*$/gm, '').replace('export function', 'function')
  const use = vm.runInNewContext(source + ';useMotionPreferences', {
    ref, computed, watch, onMounted: fn => mounts.push(fn), onBeforeUnmount: fn => unmounts.push(fn),
    document, window: { matchMedia: () => query }, localStorage: { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) },
  })
  const home = use(), landmarks = use()
  mounts.forEach(fn => fn())
  assert.equal(listeners.size, 1)
  home.toggleMotion()
  assert.equal(landmarks.motionEnabled.value, false)
  assert.equal(document.documentElement.dataset.motion, 'off')
  assert.equal(storage.get('rinna-motion-enabled'), 'false')
  home.toggleMotion()
  query.matches = true; listeners.forEach(fn => fn())
  assert.equal(home.motionEnabled.value, false)
  query.matches = false; listeners.forEach(fn => fn())
  assert.equal(home.motionEnabled.value, true)
  unmounts.forEach(fn => fn())
  assert.equal(listeners.size, 0)
})
