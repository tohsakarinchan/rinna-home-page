import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createGeoLoader, JAPAN_GEO_URL } from '../src/shared/lib/japan-geo.js'

test('map loads pinned local data with all 47 prefectures and intact geometry', async () => {
  assert.equal(JAPAN_GEO_URL, '/maps/japan-c686f194.geojson')
  const bytes = await readFile(new URL('../public' + JAPAN_GEO_URL, import.meta.url))
  assert.equal(createHash('sha256').update(bytes).digest('hex'), '37ef4ef8797d3d3efaecedc37d568d156954347eef5f46c920ddffd745034f1a')
  const load = createGeoLoader(async (url, options) => {
    assert.equal(url, JAPAN_GEO_URL)
    assert.ok(options.signal)
    return new Response(bytes)
  })
  const data = await load()
  assert.equal(data.type, 'FeatureCollection')
  assert.equal(data.features.length, 47)
  assert.equal(new Set(data.features.map(f => f.properties.nam_ja)).size, 47)
  assert.ok(data.features.every(f => ['Polygon', 'MultiPolygon'].includes(f.geometry.type) && f.geometry.coordinates.length))
})

test('a timed out request is discarded so retry can succeed', async () => {
  let calls = 0
  const load = createGeoLoader(async () => {
    if (++calls === 1) throw new DOMException('signal timed out', 'TimeoutError')
    return Response.json({ features: [{ properties: {} }] })
  })
  await assert.rejects(load(), { name: 'TimeoutError' })
  assert.equal((await load()).features.length, 1)
  assert.equal(calls, 2)
})
