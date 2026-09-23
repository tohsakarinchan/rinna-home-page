import test from 'node:test'
import assert from 'node:assert/strict'
import { assemblePassport, passportResponse, queryPages } from '../server/notion-passport.js'

const text = value => ({ rich_text: [{ plain_text: value }] })
const number = value => ({ number: value })
const relation = id => ({ relation: [{ id }] })
const page = (id, properties) => ({ id, properties })
function fixture() {
  return {
    trips: [page('trip', { Name: text('旅行'), Month: text('2024.06'), Places: relation('tokyo'), Color: text('url(bad)'), Icon: text('mdi-map'), Effect: text('snow') })],
    places: [page('tokyo', { Name: text('东京都') })],
    days: [page('later', { Name: text('后一天'), Trip: relation('trip'), Date: { date: { start: '2024-06-08' } } }), page('first', { Name: text('第一天'), Trip: relation('trip'), Date: { date: { start: '2024-06-07' } }, References: { rich_text: [{ plain_text: '来源', href: 'https://example.com/source' }] } })],
    stops: [page('second', { Name: text('区域'), Day: relation('first'), Order: number(2), Latitude: number(35.7), Longitude: number(139.7), Provisional: { checkbox: true }, Source: { url: 'javascript:alert(1)' } }), page('arrival', { Name: text('机场'), Day: relation('first'), Order: number(1), Latitude: number(35.77), Longitude: number(140.39), 'Outside city': { checkbox: true }, Photo: { files: [{ file: { url: 'https://example.com/photo.jpg' } }] }, 'Photo credit': text('本人') })],
    chapters: [page('chapter', { Name: text('草稿'), Day: relation('first'), Body: { rich_text: [{ plain_text: '第一段' }, { plain_text: '第二段' }] } })],
  }
}
test('passport uses Notion relations, dates, stop order, photos and complete rich text', () => {
  const data = assemblePassport(fixture())
  const trip = data.trips[0]
  assert.deepEqual(trip.prefectures, ['东京都'])
  assert.equal(trip.color, '#355c78')
  assert.deepEqual(trip.days.map(d => d.date), ['2024-06-07', '2024-06-08'])
  assert.deepEqual(trip.days[0].stops.map(s => s.id), ['arrival', 'second'])
  assert.equal(trip.days[0].stops[0].photo.credit, '本人')
  assert.equal(trip.days[0].stops[1].photo, undefined)
  assert.equal(trip.days[0].stops[1].source, '')
  assert.equal(trip.days[0].stops[1].provisional, true)
  assert.equal(trip.days[0].journal[0].text, '第一段第二段')
  assert.equal(trip.days[0].references[0].url, 'https://example.com/source')
  assert.deepEqual(trip.days[1].stops, [])
  const invalid = fixture()
  invalid.stops[0].properties.Latitude = number(null)
  assert.throws(() => assemblePassport(invalid), /coordinates/)
})
test('Notion pagination keeps the publication filter on every page', async () => {
  const calls = []
  const pages = await queryPages(async (path, method, body) => {
    calls.push(body)
    return { results: [{ id: body.start_cursor || 'one' }], has_more: !body.start_cursor, next_cursor: 'two' }
  }, 'db', true)
  assert.deepEqual(pages.map(p => p.id), ['one', 'two'])
  assert.ok(calls.every(c => c.filter.property === 'Published' && c.filter.checkbox.equals))
})
test('passport API returns safe errors, empty data and filters unpublished content', async t => {
  const request = new Request('https://local/api/passport')
  const env = { NOTION_TOKEN: 'private-test-token', NOTION_PLACES_DATABASE_ID: 'places' }
  const ids = { trips: 'trips', days: 'days', stops: 'stops', chapters: 'chapters' }
  assert.equal((await passportResponse(request, {}, ids)).status, 503)
  assert.equal((await passportResponse(new Request(request, { method: 'POST' }), env, ids)).status, 405)
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (!url.includes('/places/')) assert.deepEqual(JSON.parse(options.body).filter, { property: 'Published', checkbox: { equals: true } })
    return Response.json({ results: [], has_more: false })
  })
  const empty = await passportResponse(request, env, ids)
  assert.equal(empty.status, 200)
  assert.deepEqual(await empty.json(), { trips: [] })
  t.mock.restoreAll()
  t.mock.method(globalThis, 'fetch', async () => { throw new Error(env.NOTION_TOKEN) })
  const failed = await passportResponse(request, env, ids)
  assert.equal(failed.status, 502)
  assert.ok(!(await failed.text()).includes(env.NOTION_TOKEN))
})
