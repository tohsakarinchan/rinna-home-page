import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fetchJson, fetchPostPage } from '../src/utils/api.js'
import { onRequest } from '../functions/api/visit-data.js'
import { onRequestGet } from '../functions/api/blog-list.js'
import vercelVisits from '../api/visit-data.js'

test('client rejects HTTP failures, empty bodies and malformed pages; supports both pagination formats', async (t) => {
  for (const response of [new Response('', { status: 502 }), new Response(''), Response.json({ error: 'failure' })]) {
    t.mock.method(globalThis, 'fetch', async () => response)
    await assert.rejects(fetchJson('/api/blog-list'))
    t.mock.restoreAll()
  }
  for (const data of [{ posts: [], has_more: true, next_cursor: 'next' }, { posts: [], hasMore: true, nextCursor: 'next' }]) {
    t.mock.method(globalThis, 'fetch', async () => Response.json(data))
    assert.equal((await fetchPostPage('/api/blog-list')).next_cursor, 'next')
    t.mock.restoreAll()
  }
  t.mock.method(globalThis, 'fetch', async () => Response.json({ posts: [], has_more: true }))
  await assert.rejects(fetchPostPage('/api/blog-list'))
})

test('Cloudflare forwards cursor and returns canonical pagination fields', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(JSON.parse(options.body).start_cursor, 'first-page')
    return Response.json({ results: [], has_more: true, next_cursor: 'second-page' })
  })
  const response = await onRequestGet({ env: {}, request: new Request('http://localhost/api/blog-list?cursor=first-page') })
  assert.deepEqual(await response.json(), { posts: [], has_more: true, next_cursor: 'second-page' })
})

test('visit endpoint reads all pages and returns equivalent Vercel and Cloudflare data', async (t) => {
  const env = { NOTION_TOKEN: 'test', NOTION_PLACES_DATABASE_ID: 'places', NOTION_VISITS_DATABASE_ID: 'visits' }
  const place = { id: 'tokyo', properties: { Name: { type: 'title', title: [{ plain_text: '东京都' }] }, Visited: { type: 'checkbox', checkbox: true } } }
  const visit = (date) => ({ id: date, properties: { Place: { type: 'relation', relation: [{ id: 'tokyo' }] }, ...(date.length === 7 ? { Month: { type: 'rich_text', rich_text: [{ plain_text: date }] } } : { Date: { type: 'date', date: { start: date } } }) } })
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    if (url.includes('/places/')) return Response.json({ results: [place], has_more: false })
    const cursor = JSON.parse(options.body).start_cursor
    return Response.json({ results: [visit(cursor ? '2020-01' : '2024-01-01')], has_more: !cursor, next_cursor: cursor ? null : 'older' })
  })
  const cf = await onRequest({ env, request: new Request('http://localhost/api/visit-data') })
  const expected = await cf.json()
  assert.deepEqual(expected.visit_records, [{ name: '东京都', firstVisitDate: '2020-01' }])
  const saved = Object.fromEntries(Object.keys(env).map(key => [key, process.env[key]]))
  Object.assign(process.env, env)
  try {
    let data
    const res = { setHeader() {}, status(code) { assert.equal(code, 200); return this }, json(value) { data = value; return this } }
    await vercelVisits({ method: 'GET' }, res)
    assert.deepEqual(data, expected)
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
})

test('Cloudflare visit endpoint handles missing config and unsupported methods', async () => {
  const call = (method, env) => onRequest({ request: new Request('http://localhost/api/visit-data', { method }), env })
  assert.equal((await call('OPTIONS', {})).status, 204)
  assert.equal((await call('POST', {})).status, 405)
  assert.equal((await call('GET', {})).status, 500)
  const response = await call('GET', { NOTION_TOKEN: 'test' })
  assert.equal(response.status, 200)
  assert.ok((await response.json()).warning)
})
