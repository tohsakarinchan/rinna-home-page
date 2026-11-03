import { fetchJson, fetchPostPage } from '../../../shared/lib/http.js'

export const BLOG_PAGE_SIZE = 6

export function fetchPosts(cursor = null, pageSize = BLOG_PAGE_SIZE, { signal } = {}) {
  const params = new URLSearchParams({ page_size: pageSize })
  if (cursor) params.append('cursor', cursor)
  return fetchPostPage(`/api/blog-list?${params}`, { signal })
}

export async function fetchPost(slug, { signal } = {}) {
  const data = await fetchJson(`/api/blog-post?slug=${encodeURIComponent(slug)}`, { signal })
  if (!data.meta || typeof data.html !== 'string') throw new Error('Invalid article')
  return data
}

export async function fetchVisits({ signal } = {}) {
  const data = await fetchJson('/api/visit-data', { signal })
  if (!Array.isArray(data.visited_places) || !Array.isArray(data.visit_records)) throw new Error('Invalid visit data')
  return data
}

export async function fetchAllPosts({ signal } = {}) {
  const posts = []
  let cursor = null
  do {
    const page = await fetchPosts(cursor, 100, { signal })
    posts.push(...page.posts)
    cursor = page.has_more ? page.next_cursor : null
  } while (cursor)
  return posts
}
