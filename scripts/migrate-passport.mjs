// Run without --apply to inspect. Existing rows are never updated or deleted.
import { readFileSync, existsSync, writeFileSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { createHash } from 'node:crypto'
import { trips } from '../src/constants/trips.js'
import { travelDays } from '../src/constants/travel-days.js'
import { passportParent, databaseTitles, passportSchema } from '../server/passport-schema.js'
import { notionClient, queryPages, propertyText } from '../server/notion-passport.js'

const env = { ...process.env }
for (const path of ['.env.local', '.dev.vars']) if (existsSync(path)) Object.assign(env, parseEnv(readFileSync(path, 'utf8')))
if (!env.NOTION_TOKEN || !env.NOTION_PLACES_DATABASE_ID || !env.NOTION_VISITS_DATABASE_ID) throw new Error('Missing Notion configuration')
const apply = process.argv.includes('--apply')
const api = notionClient(env.NOTION_TOKEN)
const request = async (...args) => {
  const result = await api(...args)
  await new Promise(resolve => setTimeout(resolve, 360))
  return result
}
const rt = content => {
  const value = String(content || '')
  return value ? (value.match(/[\s\S]{1,1800}/g) || []).map(content => ({ type: 'text', text: { content } })) : []
}
const rich = value => ({ rich_text: rt(value) })
const title = value => ({ title: rt(value) })
const num = value => ({ number: value ?? null })
const check = value => ({ checkbox: !!value })
const link = value => ({ url: value || null })
const relation = id => ({ relation: id ? [{ id }] : [] })
const normalize = id => id?.replaceAll('-', '')
const hash = pages => createHash('sha256').update(JSON.stringify([...pages].sort((a, b) => a.id.localeCompare(b.id)))).digest('hex')
const existingPlaces = await queryPages(request, env.NOTION_PLACES_DATABASE_ID)
const existingVisits = await queryPages(request, env.NOTION_VISITS_DATABASE_ID)
const before = { places: hash(existingPlaces), visits: hash(existingVisits) }
const placesByName = new Map(existingPlaces.map(p => [propertyText(p, 'Name'), p.id]))
for (const trip of trips) for (const name of trip.prefectures) if (!placesByName.has(name)) throw new Error(`Existing Place missing: ${name}`)

let cursor
const databases = []
do {
  const data = await request('search', 'POST', { filter: { property: 'object', value: 'database' }, page_size: 100, ...(cursor ? { start_cursor: cursor } : {}) })
  databases.push(...data.results)
  cursor = data.has_more ? data.next_cursor : null
} while (cursor)
const ids = {}, indexes = {}
for (const kind of ['trips', 'days', 'stops', 'chapters']) {
  const matches = databases.filter(d => normalize(d.parent?.page_id) === normalize(passportParent) && d.title.map(t => t.plain_text).join('') === databaseTitles[kind])
  if (matches.length > 1) throw new Error(`Duplicate database: ${kind}`)
  let db = matches[0]
  if (!db && apply) db = await request('databases', 'POST', { parent: { type: 'page_id', page_id: passportParent }, title: rt(databaseTitles[kind]), is_inline: true, properties: passportSchema(kind, ids, env.NOTION_PLACES_DATABASE_ID) })
  if (!db) { console.log(`Would create database: ${databaseTitles[kind]}`); continue }
  ids[kind] = db.id
  const expected = passportSchema(kind, ids, env.NOTION_PLACES_DATABASE_ID)
  for (const [name, type] of Object.entries(expected)) {
    const field = db.properties[name]
    if (!field || field.type !== Object.keys(type)[0]) throw new Error(`Schema mismatch: ${kind}.${name}`)
    if (type.relation && normalize(field.relation.database_id) !== normalize(type.relation.database_id)) throw new Error(`Relation mismatch: ${kind}.${name}`)
  }
  const rows = await queryPages(request, db.id)
  const index = new Map()
  for (const row of rows) {
    const key = propertyText(row, 'Key')
    if (!key) throw new Error(`Missing Key in ${kind}; reconcile manually before importing`)
    if (index.has(key)) throw new Error(`Duplicate Key: ${key}`)
    index.set(key, row.id)
  }
  indexes[kind] = index
  console.log(`${kind}: ${rows.length} existing rows`)
}
if (!apply) {
  console.log(JSON.stringify({ mode: 'read-only', existingPlaces: existingPlaces.length, existingVisits: existingVisits.length, databases: ids, seed: { trips: trips.length, days: 1, stops: 9, chapters: 5 } }))
  process.exit(0)
}
let created = 0, skipped = 0
async function ensureRow(kind, key, properties) {
  if (indexes[kind].has(key)) { skipped++; return indexes[kind].get(key) }
  const page = await request('pages', 'POST', { parent: { database_id: ids[kind] }, properties: { Key: rich(key), Published: check(true), ...properties } })
  indexes[kind].set(key, page.id)
  created++
  console.log(`Created ${kind}: ${key}`)
  return page.id
}
for (const [i, trip] of trips.entries()) {
  const tripId = await ensureRow('trips', `trip-${trip.id}`, {
    Name: title(trip.title), Month: rich(trip.month), Order: num(i + 1), Subtitle: rich(trip.subtitle), Destinations: rich(trip.places),
    Places: { relation: trip.prefectures.map(name => ({ id: placesByName.get(name) })) }, Icon: rich(trip.icon), Stamp: rich(trip.stamp), Color: rich(trip.color), Effect: rich(trip.effect),
  })
  for (const day of travelDays[trip.id] || []) {
    const references = [
      { text: '动漫地标参考：' }, { text: 'Anitabi · 路人女主', url: 'https://anitabi.cn/map?bangumiId=100403' },
      { text: '（のぞき坂贡献者：卜卜口）；' }, { text: 'Anitabi · MyGO', url: 'https://anitabi.cn/map?bangumiId=428735' },
      { text: '；' }, { text: 'Anitabi · 言叶之庭', url: 'https://anitabi.cn/map?bangumiId=58949' },
      { text: '。MyGO 点位原始来源：' }, { text: '贡献者地图', url: 'https://www.google.com/maps/d/viewer?mid=1Bx4IeQCQlmRdjJCSQ5vLfxQ8DyhBLYE' },
      { text: '。查询于 2026-09-22；Anitabi 衍生地标数据按 ' }, { text: 'CC BY-NC-SA 4.0', url: 'https://creativecommons.org/licenses/by-nc-sa/4.0/' }, { text: ' 共享。未使用动画截图。' },
    ]
    const dayId = await ensureRow('days', `day-${trip.id}-${day.date}`, {
      Name: title(day.title), Trip: relation(tripId), Date: { date: { start: day.date } }, Day: num(day.day), Subtitle: rich(day.subtitle),
      'Journal title': rich('把画面，走成一天。'), 'Journal notice': rich('游记草稿 · 根据你提供的行程代拟，待你审阅。未补造天气、班次、消费或拍摄经历。'),
      'Location notice': rich('のぞき坂为根据“坡道”描述补充的候选；国立竞技场名称待确认。三轩茶屋、下北泽和上野为区域示意，未推断具体到访店铺。地标信息是资料补充，不等于到访证明。'),
      References: { rich_text: references.map(r => ({ type: 'text', text: { content: r.text, ...(r.url ? { link: { url: r.url } } : {}) } })) },
    })
    for (const [index, stop] of day.stops.entries()) {
      await ensureRow('stops', `stop-${trip.id}-${day.date}-${stop.id}`, {
        Name: title(stop.name), Day: relation(dayId), Order: num(index + 1), Category: rich(stop.category), Latitude: num(stop.geo[0]), Longitude: num(stop.geo[1]), Zoom: num(stop.zoom),
        'Outside city': check(stop.outsideCity), Provisional: check(stop.provisional), Notes: rich(stop.note), Source: link(stop.source), Contributor: rich(stop.contributor), 'Original source': link(stop.originalSource),
        License: link(stop.source ? 'https://creativecommons.org/licenses/by-nc-sa/4.0/' : ''), Photo: { files: [] }, 'Photo alt': rich(''), 'Photo credit': rich(''), 'Photo source': link(''),
      })
    }
    for (const [index, chapter] of day.journal.entries()) await ensureRow('chapters', `chapter-${trip.id}-${day.date}-${index + 1}`, { Name: title(chapter.heading), Day: relation(dayId), Order: num(index + 1), Body: rich(chapter.text) })
  }
}
const afterPlaces = await queryPages(request, env.NOTION_PLACES_DATABASE_ID)
const afterVisits = await queryPages(request, env.NOTION_VISITS_DATABASE_ID)
if (before.places !== hash(afterPlaces) || before.visits !== hash(afterVisits)) throw new Error('Existing travel data changed during migration; investigate before deployment')
const receipt = { databases: ids, created, skipped, preserved: { places: afterPlaces.length, visits: afterVisits.length }, verifiedAt: new Date().toISOString() }
writeFileSync('.vercel/passport-migration.json', JSON.stringify(receipt, null, 2))
console.log(JSON.stringify(receipt, null, 2))
