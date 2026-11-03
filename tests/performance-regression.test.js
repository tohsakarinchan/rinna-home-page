import test from 'node:test'
import assert from 'node:assert/strict'
import { createGeoLoader } from '../src/shared/lib/japan-geo.js'
import { passportResponse } from '../server/notion-passport.js'
import worker from '../worker/index.js'
import vercelCover from '../api/notion-cover.js'
import vercelList from '../api/blog-list.js'
import vercelPost from '../api/blog-post.js'

test('map instances share a request, reject errors, and retry failures', async () => {
  let calls = 0
  const load = createGeoLoader(async () => {
    calls++
    return calls === 1 ? new Response('', { status: 502 }) : Response.json({ features: [{ properties: {} }] })
  })
  const first = load()
  assert.equal(first, load())
  await assert.rejects(first)
  const [a, b] = await Promise.all([load(), load()])
  assert.equal(a, b)
  assert.equal(calls, 2)
})

test('Sites and Vercel render article media identically and reject partial block failures', async t => {
  const id = '22222222-2222-2222-2222-222222222222'
  let fail = false
  t.mock.method(globalThis, 'fetch', async url => {
    if (url.includes('/query')) return Response.json({ results: [{ id, properties: { Name: { title: [{ plain_text: 'Journey' }] } } }] })
    if (fail) return new Response('', { status: 502 })
    return Response.json({ results: [
      { id, type: 'heading_2', heading_2: { rich_text: [{ plain_text: 'Title' }] } },
      { id, type: 'image', image: { file: { url: 'https://example.com/temporary.jpg' }, caption: [] } },
    ], has_more: false })
  })
  const env = { NOTION_TOKEN: 'test', NOTION_DATABASE_ID: 'db' }
  const sites = await worker.fetch(new Request('https://site/api/blog-post?slug=journey'), env, { waitUntil() {} })
  let body
  await vercelPost({ method: 'GET', query: { slug: 'journey' } }, {
    setHeader() {}, status(code) { assert.equal(code, 200); return this }, json(value) { body = value },
  })
  assert.deepEqual(body, await sites.json())
  assert.ok(body.html.includes(`/api/notion-image?id=${id}`))
  fail = true
  t.mock.method(console, 'error', () => {})
  const failed = await worker.fetch(new Request('https://site/api/blog-post?slug=journey'), env, { waitUntil() {} })
  assert.equal(failed.status, 500)
})

test('passport summary skips detail databases; detail queries preserve publication and relation filters', async t => {
  const env = { NOTION_TOKEN: 'test', NOTION_PLACES_DATABASE_ID: 'places' }
  const ids = { trips: 'trips', days: 'days', stops: 'stops', chapters: 'chapters' }
  const calls = []
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const kind = url.split('/')[5]
    const body = JSON.parse(options.body)
    calls.push({ kind, body })
    let results = []
    if (kind === 'trips') results = [{ id: 'trip', properties: {} }]
    if (kind === 'days') results = [{ id: 'day', properties: { Trip: { relation: [{ id: 'trip' }] }, Date: { date: { start: '2026-01-01' } } } }]
    return Response.json({ results, has_more: false })
  })
  const invoke = query => passportResponse(new Request('https://site/api/passport' + query), env, ids)
  assert.equal((await invoke('?view=summary')).status, 200)
  assert.deepEqual(calls.map(c => c.kind), ['trips', 'places'])
  calls.length = 0
  const detail = await invoke('?trip=trip')
  assert.equal((await detail.json()).trips[0].days.length, 1)
  for (const kind of ['days', 'stops', 'chapters']) {
    const filter = calls.find(c => c.kind === kind).body.filter.and
    assert.deepEqual(filter[0], { property: 'Published', checkbox: { equals: true } })
    if (kind === 'days') assert.equal(filter[1].relation.contains, 'trip')
    else assert.equal(filter[1].or[0].relation.contains, 'day')
  }
  calls.length = 0
  assert.equal((await invoke('?trip=missing')).status, 404)
  assert.deepEqual(calls.map(c => c.kind), ['trips'])
})

test('Sites and Vercel expose equivalent refreshed covers and blog-list pagination', async t => {
  const id = '11111111-1111-1111-1111-111111111111'
  const page = { id, cover: { file: { url: 'https://example.com/fresh.jpg', expiry_time: new Date(Date.now() + 3600000).toISOString() } }, properties: {} }
  const env = { NOTION_TOKEN: 'test', NOTION_DATABASE_ID: 'db' }
  t.mock.method(globalThis, 'fetch', async url => Response.json(url.includes('/query') ? { results: [page], has_more: false, next_cursor: null } : page))
  const saved = { NOTION_TOKEN: process.env.NOTION_TOKEN, NOTION_DATABASE_ID: process.env.NOTION_DATABASE_ID }
  Object.assign(process.env, env)
  try {
    for (const [path, handler] of [[`/api/notion-cover?id=${id}`, vercelCover], ['/api/blog-list?cursor=next', vercelList]]) {
      const sites = await worker.fetch(new Request('https://site' + path), env, { waitUntil() {} })
      let status, body
      const headers = {}
      const res = { setHeader(k, v) { headers[k] = v }, status(v) { status = v; return this }, send(v) { body = v }, json(v) { body = JSON.stringify(v) } }
      await handler({ method: 'GET', url: path }, res)
      assert.equal(status, sites.status)
      assert.equal(body, await sites.text())
      assert.equal(headers.location, sites.headers.get('location') || undefined)
      if (path.includes('blog-list')) assert.equal(JSON.parse(body).posts[0].cover, `/api/notion-cover?id=${id}`)
    }
    const invalid = await worker.fetch(new Request('https://site/api/notion-image?id=bad'), env, { waitUntil() {} })
    assert.equal(invalid.status, 400)
  } finally {
    for (const [key, value] of Object.entries(saved)) if (value === undefined) delete process.env[key]; else process.env[key] = value
  }
})
