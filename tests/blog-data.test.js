import test from 'node:test'
import assert from 'node:assert/strict'
import { effectScope, ref } from 'vue'
import { useBlogData } from '../src/features/blog/composables/useBlogData.js'
import { useBlogFilters } from '../src/features/blog/composables/useBlogFilters.js'
import { buildVisitSummary } from '../src/features/blog/domain/visits.js'
import { fetchPosts, fetchPost, fetchVisits } from '../src/features/blog/api/blog.js'

function setup(t, api) {
  const scope = effectScope()
  t.after(() => scope.stop())
  return { scope, state: scope.run(() => useBlogData(api)) }
}
const page = (posts, next = null) => ({ posts, has_more: Boolean(next), next_cursor: next })

test('blog loads pages, merges map records once and retries failed pagination', async t => {
  const a = { id: 'a', tags: ['东京'] }, b = { id: 'b', tags: ['京都'] }
  let failMore = true
  const { state } = setup(t, { getPosts: async (cursor, size) => {
    if (!cursor) return page([a], 'next')
    if (size === 6 && failMore) throw new Error('offline')
    return page([b])
  } })
  await state.loadInitialPosts()
  assert.deepEqual(state.posts.value.map(p => p.id), ['a'])
  assert.deepEqual(state.mapPosts.value.map(p => p.id), ['a', 'b'])
  await state.loadMore()
  assert.ok(state.loadMoreError.value)
  assert.equal(state.hasMore.value, true)
  failMore = false
  await state.loadMore()
  assert.equal(state.loadMoreError.value, '')
  assert.equal(state.hasMore.value, false)
  assert.deepEqual(state.posts.value.map(p => p.id), ['a', 'b'])
  assert.equal(state.mapPosts.value.length, 2)
})

test('new initial request supersedes old pages; disposal cancels list, visits and map sync', async t => {
  const requests = [], visits = []
  const { state, scope } = setup(t, {
    getPosts: (cursor, size, { signal }) => new Promise(resolve => requests.push({ cursor, size, signal, resolve })),
    getVisits: ({ signal }) => new Promise(resolve => visits.push({ signal, resolve })),
  })
  const first = state.loadInitialPosts(), second = state.loadInitialPosts()
  assert.equal(requests[0].signal.aborted, true)
  requests[1].resolve(page([{ id: 'new' }], 'next'))
  await second
  assert.equal(requests[2].size, 100)
  requests[0].resolve(page([{ id: 'old' }]))
  await first
  assert.equal(state.posts.value[0].id, 'new')
  const visit = state.loadVisitData()
  scope.stop()
  assert.ok(requests.every(r => r.signal.aborted))
  assert.equal(visits[0].signal.aborted, true)
  requests[2].resolve(page([{ id: 'late' }]))
  visits[0].resolve({ visited_places: ['京都'], visit_records: [] })
  await visit
  assert.deepEqual(state.mapPosts.value.map(p => p.id), ['new'])
  assert.deepEqual(state.notionVisitedPlaces.value, [])
})

test('blog and visit errors have separate retry states; map retry accepts click events', async t => {
  let fail = true
  const { state } = setup(t, {
    getPosts: async () => { if (fail) throw new Error('offline'); return page([]) },
    getVisits: async () => { if (fail) throw new Error('offline'); return { visited_places: [], visit_records: [], warning: 'disabled' } },
  })
  await Promise.all([state.loadInitialPosts(), state.loadVisitData(), state.retryMapSync({ type: 'click' })])
  assert.ok(state.loadError.value && state.visitError.value && state.mapSyncError.value)
  fail = false
  await Promise.all([state.loadInitialPosts(), state.loadVisitData()])
  assert.equal(state.loadError.value, '')
  assert.equal(state.visitError.value, '')
  assert.ok(state.visitWarning.value)
  await state.retryMapSync({ type: 'click' })
  assert.equal(state.mapSyncError.value, false)
})

test('blog filters normalize prefectures, search words and escape displayed HTML', () => {
  const posts = ref([{ id: 'a', title: 'Tokyo journey', summary: '<旅途>', tags: ['东京'] }, { id: 'b', title: '京都', summary: '', tags: ['京都'] }])
  const state = useBlogFilters(posts)
  state.activeTag.value = '东京都'
  assert.equal(state.filteredPosts.value[0].id, 'a')
  assert.equal(state.isTagActive('东京'), true)
  state.searchQuery.value = 'tokyo journey'
  assert.equal(state.filteredPosts.value.length, 1)
  state.searchQuery.value = 'unmatched'
  assert.equal(state.filteredPosts.value.length, 0)
  state.searchQuery.value = '旅途'
  assert.equal(state.highlight('<旅途>'), '&lt;<mark class="search-highlight">旅途</mark>&gt;')
})

test('visit records override publication dates while retaining deduplicated prefectures', () => {
  const result = buildVisitSummary([
    { date: '2024-01-01', tags: ['东京', '东京都'] },
    { date: 'invalid', tags: ['京都'] },
  ], ['奈良'], [{ name: '东京', firstVisitDate: '2024-06-07' }])
  assert.deepEqual(result.visitedPrefectures, ['东京都', '京都府', '奈良县'])
  assert.equal(result.visitRecords.length, 1)
  assert.equal(result.visitRecords[0].firstVisitLabel, '2024/06/07')
})

test('blog API owns URL encoding and validates article and visit payloads', async t => {
  const urls = []
  let payload = page([])
  t.mock.method(globalThis, 'fetch', async url => { urls.push(url); return Response.json(payload) })
  await fetchPosts('a & b', 100)
  assert.equal(urls[0], '/api/blog-list?page_size=100&cursor=a+%26+b')
  payload = { meta: {}, html: '' }
  await fetchPost('旅行 & 日常')
  assert.equal(urls[1], '/api/blog-post?slug=%E6%97%85%E8%A1%8C%20%26%20%E6%97%A5%E5%B8%B8')
  payload = { html: '' }
  await assert.rejects(fetchPost('missing'), /Invalid article/)
  await assert.rejects(fetchVisits(), /Invalid visit data/)
})
