import test from 'node:test'
import assert from 'node:assert/strict'
import { mountComposable, mockGlobal } from './helpers/vue.js'
import { useMotionPreferences } from '../src/shared/composables/useMotionPreferences.js'
import { ref, effectScope } from 'vue'
import { usePassportNavigation } from '../src/features/travel/composables/usePassportNavigation.js'
import { passportSpreads, latestTrip, passportPageStacks } from '../src/features/travel/domain/passport-layout.js'

test('paper stacks transfer leaves between sides and bound large collection depth', () => {
  assert.deepEqual(passportPageStacks(0, 0), { leftLeaves:0, rightLeaves:0, leftDepth:0, rightDepth:0 })
  assert.equal(passportPageStacks(1, 0).rightDepth, 0)
  for (const count of [2, 3, 12, 100]) {
    for (let index = 0; index < count; index++) {
      const stack = passportPageStacks(count, index)
      assert.equal(stack.leftLeaves + stack.rightLeaves, count - 1)
      assert.equal(stack.leftLeaves, index)
      assert.equal(stack.rightLeaves, count - index - 1)
      assert.ok(stack.leftDepth <= 12 && stack.rightDepth <= 12)
    }
    assert.equal(passportPageStacks(count, 0).leftDepth, 0)
    assert.equal(passportPageStacks(count, count - 1).rightDepth, 0)
    assert.equal(passportPageStacks(count, count + 1).leftLeaves, count - 1)
  }
})

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

test('motion preference is shared, persisted and overridden by live system changes', t => {
  const listeners = new Set(), storage = new Map()
  const query = { matches: false, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) }
  mockGlobal(t, 'document', { documentElement: { dataset: {} } })
  mockGlobal(t, 'window', { matchMedia: () => query })
  mockGlobal(t, 'localStorage', { getItem: key => storage.get(key), setItem: (key, value) => storage.set(key, value) })
  const home = mountComposable(useMotionPreferences), landmarks = mountComposable(useMotionPreferences)
  assert.equal(listeners.size, 1)
  home.state.toggleMotion()
  assert.equal(landmarks.state.motionEnabled.value, false)
  assert.equal(document.documentElement.dataset.motion, 'off')
  assert.equal(storage.get('rinna-motion-enabled'), 'false')
  home.state.toggleMotion()
  query.matches = true; listeners.forEach(fn => fn())
  assert.equal(home.state.motionEnabled.value, false)
  query.matches = false; listeners.forEach(fn => fn())
  assert.equal(home.state.motionEnabled.value, true)
  home.unmount()
  assert.equal(listeners.size, 1)
  landmarks.unmount()
  assert.equal(listeners.size, 0)
})

test('passport navigation respects boundaries, animation lock, and reduced motion', async t => {
  const scope = effectScope()
  t.after(() => scope.stop())
  const spreads = ref(passportSpreads(Array.from({ length: 9 }, (_, id) => ({ id }))))
  const effects = ref(true)
  const state = scope.run(() => usePassportNavigation(spreads, effects))
  state.turnPage(-1)
  assert.equal(state.spreadIndex.value, 0)
  state.turnPage(1)
  assert.equal(state.currentSpread.value[0][0].number, 5)
  state.turnPage(1)
  assert.equal(state.spreadIndex.value, 1, 'ignore repeated clicks during a turn')
  state.turning.value = false // Vue after-enter
  state.turnPage(-1)
  assert.equal(state.turnDirection.value, 'backward')
  effects.value = false
  await Promise.resolve()
  assert.equal(state.turning.value, false)
  state.turnPage(1)
  state.turnPage(1)
  state.turnPage(1)
  assert.equal(state.spreadIndex.value, 2)
  assert.equal(state.currentSpread.value[0][0].number, 9)
  assert.equal(state.currentSpread.value[1].length, 0)
  let prevented = false
  state.handlePageKey({ key: 'ArrowLeft', preventDefault: () => { prevented = true }, currentTarget: { closest: () => null } })
  assert.equal(prevented, true)
  assert.equal(state.spreadIndex.value, 1)
  state.handlePageKey({ key: 'ArrowLeft', ctrlKey: true })
  assert.equal(state.spreadIndex.value, 1)
  spreads.value = []
  await Promise.resolve()
  assert.equal(state.spreadIndex.value, 0)
  assert.deepEqual(Array.from(state.currentSpread.value, page => page.length), [0, 0])
})


test('touch swipes turn four-card spreads without turning on scroll, taps or cancellation', async t => {
  const scope = effectScope()
  t.after(() => scope.stop())
  const spreads = ref(passportSpreads(Array.from({ length: 9 }, (_, id) => ({ id }))))
  const state = scope.run(() => usePassportNavigation(spreads, ref(false)))
  const surface = { clientWidth: 360, setPointerCapture() {} }
  const event = (x, y, pointerType = 'touch') => ({ clientX: x, clientY: y, pointerId: 1, isPrimary: true, pointerType, currentTarget: surface })
  const swipe = (x, y, pointerType) => {
    state.startSwipe(event(200, 100, pointerType))
    state.moveSwipe(event(x, y, pointerType))
    state.endSwipe(event(x, y, pointerType))
  }
  swipe(90, 108)
  assert.equal(state.spreadIndex.value, 1)
  let prevented = false, stopped = false
  state.guardSwipeClick({ preventDefault: () => { prevented = true }, stopPropagation: () => { stopped = true } })
  assert.equal(prevented && stopped, true, 'a swipe must not open a journey')
  swipe(310, 105)
  assert.equal(state.spreadIndex.value, 0)
  swipe(120, 270)
  assert.equal(state.spreadIndex.value, 0, 'vertical scroll stays on the current spread')
  swipe(195, 102)
  state.guardSwipeClick({ preventDefault: () => assert.fail('tap must remain clickable'), stopPropagation() {} })
  swipe(90, 100, 'mouse')
  assert.equal(state.spreadIndex.value, 0)
  state.startSwipe(event(200, 100))
  state.cancelSwipe()
  state.endSwipe(event(90, 100))
  assert.equal(state.spreadIndex.value, 0)
  swipe(310, 100)
  assert.equal(state.spreadIndex.value, 0, 'first spread cannot swipe backwards')
})

test('two-sided leaves show the correct old front and new back in both directions', t => {
  const scope = effectScope(); t.after(() => scope.stop())
  const spreads = ref(passportSpreads(Array.from({ length: 9 }, (_, id) => ({ id }))))
  const effects = ref(true), state = scope.run(() => usePassportNavigation(spreads, effects))
  state.turnPage(1)
  assert.equal(state.turnLayer.value.front[0].number, 3)
  assert.equal(state.turnLayer.value.back[0].number, 5)
  assert.equal(state.turnLayer.value.stationary[0].number, 1)
  state.turnPage(1)
  assert.equal(state.spreadIndex.value, 1)
  state.finishTurn()
  assert.equal(state.turnLayer.value, null)
  state.turnPage(-1)
  assert.equal(state.turnLayer.value.front[0].number, 5)
  assert.equal(state.turnLayer.value.back[0].number, 3)
  assert.equal(state.turnLayer.value.stationary[0].number, 7)
  state.finishTurn()
})

test('mouse and touch drag progress, short-drag return, preference changes and disposal', async t => {
  const pending = new Map(); let id = 0
  mockGlobal(t, 'setTimeout', fn => { pending.set(++id, fn); return id })
  mockGlobal(t, 'clearTimeout', key => pending.delete(key))
  const scope = effectScope(); t.after(() => scope.stop())
  const spreads = ref(passportSpreads(Array.from({ length: 9 }, (_, id) => ({ id }))))
  const effects = ref(true), state = scope.run(() => usePassportNavigation(spreads, effects))
  const surface = { clientWidth: 400, setPointerCapture() {} }
  const event = (x, y = 100) => ({ clientX:x, clientY:y, pointerId:1, pointerType:'mouse', button:0, isPrimary:true, currentTarget:surface })
  state.startSwipe(event(250)); state.moveSwipe(event(225))
  assert.equal(state.dragProgress.value, .125)
  assert.equal(state.spreadIndex.value, 0, 'preview does not commit a page')
  state.endSwipe(event(225))
  assert.equal(state.returning.value, true)
  assert.equal(state.turning.value, true)
  state.finishTurn()
  assert.equal(state.spreadIndex.value, 0)
  state.startSwipe(event(250)); state.moveSwipe(event(100)); state.endSwipe(event(100))
  assert.equal(state.spreadIndex.value, 1)
  assert.equal(state.dragProgress.value, .75)
  assert.ok(state.duration.value < 720)
  effects.value = false; await Promise.resolve()
  assert.equal(state.turnLayer.value, null)
  assert.equal(state.turning.value, false)
  assert.equal(pending.size, 0)
  effects.value = true; await Promise.resolve()
  state.turnPage(1)
  assert.equal(state.turnLayer.value.back[0].number, 9)
  assert.equal(pending.size, 1)
  scope.stop()
  assert.equal(pending.size, 0, 'unmount clears the fallback timer')
})
