export async function fetchJson(url, { signal } = {}) {
    const timeout = AbortSignal.timeout(30000)
    const response = await fetch(url, { signal: signal ? AbortSignal.any([signal, timeout]) : timeout })
    if (!response.ok) {
        const error = new Error(`Request failed (${response.status})`)
        error.status = response.status
        throw error
    }
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
