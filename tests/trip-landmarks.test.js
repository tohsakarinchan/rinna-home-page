import test from 'node:test'
import assert from 'node:assert/strict'
import { tripLandmarks } from '../src/constants/trip-landmarks.js'
import { layoutLandmarks } from '../src/utils/landmark-layout.js'
test('confirmed visits work with Notion UUIDs and remain specific to their journey', () => {
 assert.deepEqual(tripLandmarks({ id: 'uuid', month: '2024.06' }).map(p => p.id), ['tokyo-tower'])
 assert.deepEqual(tripLandmarks({ month: '2026.03' }).map(p => p.id), [])
 assert.deepEqual(tripLandmarks({ month: '2025.01', prefectures: ['东京都', '京都府'] }), [])
})
test('match Japanese names, deduplicate and exclude provisional visits', () => {
 const trip = { days: [{ stops: [{ name: '東京タワー' }, { name: '清水寺', provisional: true }, { name: '下北沢' }] }, { stops: [{ name: '東京塔' }] }] }
 assert.deepEqual(tripLandmarks(trip).map(p => p.id), ['tokyo-tower'])
})
test('clustered models fit narrow and desktop maps', () => {
 for (const width of [240, 320, 680]) {
  const points = layoutLandmarks(Array.from({length:6}, (_, id) => ({id, anchorX:width-30, anchorY:170})), width, 390)
  assert.equal(points.length, 6)
  assert.equal(new Set(points.map(p => `${p.x},${p.y}`)).size, 6)
  for (const p of points) { assert.ok(p.x >= 44 && p.x <= width-44); assert.ok(p.y >=114 && p.y <=390) }
 }
 assert.deepEqual(layoutLandmarks([{anchorX:NaN,anchorY:10}],320,390), [])
 assert.deepEqual(layoutLandmarks([],0,0), [])
})
test('Kyoto, Uji and Nara landmarks follow actual stops regardless of trip month', () => {
 const points = tripLandmarks({month:'2024.06', days:[{stops:[{name:'清水寺'}, {name:'宇治橋'}, {name:'奈良'}]}]})
 assert.deepEqual(points.map(p => p.id), ['tokyo-tower','kiyomizu','nara'])
})