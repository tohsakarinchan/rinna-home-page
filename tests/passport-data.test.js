import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope } from 'vue'
import { usePassportData } from '../src/features/travel/composables/usePassportData.js'
import { fetchPassportSummary, fetchTripDetail } from '../src/features/travel/api/passport.js'

function setup(t, api) {
  const scope = effectScope()
  t.after(() => scope.stop())
  return { scope, state: scope.run(() => usePassportData(api)) }
}

test('switching trips ignores late responses and reuses loaded details', async t => {
  const requests = []
  const { state } = setup(t, {
    fetchDetail: (id, { signal }) => new Promise(resolve => requests.push({ id, signal, resolve })),
  })
  const first = state.selectTrip({ id: 'a' })
  const second = state.selectTrip({ id: 'b' })
  assert.equal(requests[0].signal.aborted, true)
  requests[1].resolve({ id: 'b', days: [{ id: 'day' }] })
  await second
  requests[0].resolve({ id: 'a', days: [] })
  await first
  assert.equal(state.selected.value.id, 'b')
  assert.equal(state.detailLoading.value, false)
  await state.selectTrip({ id: 'b' })
  assert.equal(requests.length, 2)
  assert.equal(state.selected.value.days.length, 1)
})

test('detail errors can retry; cancellation and all-trips selection ignore pending responses', async t => {
  let fail = true, pending
  const { state } = setup(t, {
    fetchDetail: async id => {
      if (fail) throw new Error('offline')
      return { id, days: [] }
    },
  })
  await state.selectTrip({ id: 'a' })
  assert.equal(state.detailError.value, true)
  fail = false
  await state.selectTrip({ id: 'a' })
  assert.equal(state.detailError.value, false)

  const { state: waiting } = setup(t, {
    fetchDetail: (id, { signal }) => new Promise(resolve => { pending = { id, signal, resolve } }),
  })
  const load = waiting.selectTrip({ id: 'b' })
  waiting.cancelDetail() // Closing the dialog.
  assert.equal(pending.signal.aborted, true)
  assert.equal(waiting.detailLoading.value, false)
  await waiting.selectTrip(null)
  pending.resolve({ id: 'b' })
  await load
  assert.equal(waiting.selected.value, null)
  assert.equal(waiting.detailError.value, false)
  const retry = waiting.selectTrip({ id: 'b' })
  assert.equal(waiting.detailLoading.value, true, 'cancelled response must not populate cache')
  pending.resolve({ id: 'b' })
  await retry
})

test('summary failure retries and newest summary wins', async t => {
  let fail = true
  const requests = []
  const { state } = setup(t, {
    fetchSummary: ({ signal }) => {
      if (fail) return Promise.reject(new Error('offline'))
      return new Promise(resolve => requests.push({ signal, resolve }))
    },
  })
  await state.loadPassport()
  assert.equal(state.passportError.value, true)
  assert.equal(state.passportLoading.value, false)
  fail = false
  const first = state.loadPassport(), second = state.loadPassport()
  assert.equal(requests[0].signal.aborted, true)
  assert.equal(state.passportError.value, false)
  requests[1].resolve([{ id: 'new' }])
  await second
  requests[0].resolve([{ id: 'old' }])
  await first
  assert.equal(state.trips.value[0].id, 'new')
  assert.equal(state.passportLoading.value, false)
})

test('disposing a passport cancels summary and detail without writing late results', async t => {
  let summary, detail
  const { state, scope } = setup(t, {
    fetchSummary: ({ signal }) => new Promise(resolve => { summary = { signal, resolve } }),
    fetchDetail: (id, { signal }) => new Promise(resolve => { detail = { signal, resolve } }),
  })
  const loads = [state.loadPassport(), state.selectTrip({ id: 'a' })]
  scope.stop()
  assert.equal(summary.signal.aborted, true)
  assert.equal(detail.signal.aborted, true)
  summary.resolve([{ id: 'late' }])
  detail.resolve({ id: 'a', days: ['late'] })
  await Promise.all(loads)
  assert.deepEqual(state.trips.value, [])
  assert.equal(state.selected.value.days, undefined)
})

test('passport API encodes IDs, forwards cancellation and rejects invalid payloads', async t => {
  const controller = new AbortController()
  const requests = []
  let payload = { trips: [{ id: 'a & b' }] }
  t.mock.method(globalThis, 'fetch', async (url, { signal }) => {
    requests.push({ url, signal })
    return Response.json(payload)
  })
  assert.equal((await fetchPassportSummary())[0].id, 'a & b')
  assert.equal(requests[0].url, '/api/passport?view=summary')
  assert.equal((await fetchTripDetail('a & b', { signal: controller.signal })).id, 'a & b')
  assert.equal(requests[1].url, '/api/passport?trip=a%20%26%20b')
  controller.abort()
  assert.equal(requests[1].signal.aborted, true)
  payload = { trips: [] }
  await assert.rejects(fetchTripDetail('missing'), /Missing trip/)
  payload = { trips: null }
  await assert.rejects(fetchPassportSummary(), /Invalid passport response/)
})
