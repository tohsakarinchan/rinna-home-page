export async function fetchJson(url) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000) })
    if (!response.ok) throw new Error(`Request failed (${response.status})`)
    const data = await response.json()
    if (!data || typeof data !== 'object' || data.error) throw new Error('Invalid API response')
    return data
}

export async function fetchPostPage(url) {
    const data = await fetchJson(url)
    const hasMore = data.has_more ?? data.hasMore
    const nextCursor = data.next_cursor ?? data.nextCursor ?? null
    if (!Array.isArray(data.posts) || typeof hasMore !== 'boolean' ||
        (hasMore && (typeof nextCursor !== 'string' || !nextCursor))) {
        throw new Error('Invalid blog page')
    }
    return { ...data, has_more: hasMore, next_cursor: nextCursor }
}
