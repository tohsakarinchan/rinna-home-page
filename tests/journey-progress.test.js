import test from 'node:test'
import assert from 'node:assert/strict'
import { chapterStops } from '../src/utils/journey-progress.js'
import { orderedDays } from '../src/constants/travel-days.js'
test('Tokyo paragraphs follow the actual named stops without repeating previous stops', () => {
  assert.deepEqual(chapterStops(orderedDays('01')[0]), [[0], [1,2], [3,4,5], [6,7], [8]])
})
test('unmatched prose does not invent a location and explicit relations allow revisits', () => {
  const stops = [{ id:'a',name:'上野 · 寿司郎' }, { id:'b',name:'新宿御苑' }]
  assert.deepEqual(chapterStops({ stops, journal:[{text:'上野吃饭'}, {text:'照片整理中'}, {text:'新宿御苑'}, {text:'重访',stopIds:['a']}] }), [[0],[],[1],[0]])
})
