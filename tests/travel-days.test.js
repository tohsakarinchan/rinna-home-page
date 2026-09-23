import test from 'node:test'
import assert from 'node:assert/strict'
import { orderedDays, mapStops } from '../src/constants/travel-days.js'

test('first journey contains only the confirmed date and ordered nine stops', () => {
  const days = orderedDays('01')
  assert.equal(days.length, 1)
  assert.equal(days[0].date, '2024-06-07')
  assert.deepEqual(days[0].stops.map(s => s.id), ['narita','nozoki','chitose','stadium','gyoen','meiji','sancha','shimokita','ueno'])
  assert.equal(days[0].journal.length, 5)
  assert.deepEqual(orderedDays('02'), [])
})
test('city map excludes airport; full day includes it; all anchors are valid', () => {
  const day = orderedDays('01')[0]
  assert.equal(mapStops(day).length, 8)
  assert.equal(mapStops(day, true).length, 9)
  for (const stop of day.stops) {
    assert.ok(stop.geo[0] > 35 && stop.geo[0] < 36)
    assert.ok(stop.geo[1] > 139 && stop.geo[1] < 141)
    assert.ok(stop.note.length > 0)
  }
})
