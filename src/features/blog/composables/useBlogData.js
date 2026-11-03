import { ref, onScopeDispose } from 'vue'
import { fetchPosts, fetchVisits, BLOG_PAGE_SIZE } from '../api/blog.js'

export function useBlogData({ getPosts = fetchPosts, getVisits = fetchVisits } = {}) {
  const posts = ref([]), mapPosts = ref([]), notionVisitedPlaces = ref([]), notionVisitRecords = ref([])
  const loading = ref(true), loadingMore = ref(false), hasMore = ref(false), nextCursor = ref(null)
  const loadError = ref(''), loadMoreError = ref('')
  const visitLoading = ref(false), visitError = ref(''), visitWarning = ref('')
  const mapSyncLoading = ref(false), mapSyncError = ref(false)
  let listController, mapController, visitController

  function mergeMapPosts(items) {
    const merged = new Map(mapPosts.value.map(post => [post.id, post]))
    items.forEach(post => { if (post?.id) merged.set(post.id, post) })
    mapPosts.value = [...merged.values()]
  }

  async function retryMapSync(initialPage) {
    if (mapSyncLoading.value) return
    const current = mapController = new AbortController()
    mapSyncLoading.value = true
    mapSyncError.value = false
    try {
      let page = Array.isArray(initialPage?.posts) ? initialPage : await getPosts(null, 100, { signal: current.signal })
      while (!current.signal.aborted) {
        mergeMapPosts(page.posts)
        if (!page.has_more) break
        page = await getPosts(page.next_cursor, 100, { signal: current.signal })
      }
    } catch { if (!current.signal.aborted) mapSyncError.value = true }
    finally { if (!current.signal.aborted) mapSyncLoading.value = false }
  }

  async function loadInitialPosts() {
    listController?.abort()
    mapController?.abort()
    const current = listController = new AbortController()
    loading.value = true
    loadingMore.value = false
    mapSyncLoading.value = false
    mapSyncError.value = false
    loadError.value = loadMoreError.value = ''
    try {
      const data = await getPosts(null, BLOG_PAGE_SIZE, { signal: current.signal })
      if (current.signal.aborted) return
      posts.value = data.posts
      mapPosts.value = data.posts
      hasMore.value = data.has_more
      nextCursor.value = data.next_cursor
      void retryMapSync(data)
    } catch { if (!current.signal.aborted) loadError.value = '文章加载失败，请稍后重试。' }
    finally { if (!current.signal.aborted) loading.value = false }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value || loading.value) return
    const current = listController
    loadingMore.value = true
    loadMoreError.value = ''
    try {
      const data = await getPosts(nextCursor.value, BLOG_PAGE_SIZE, { signal: current.signal })
      if (current.signal.aborted) return
      posts.value = [...posts.value, ...data.posts]
      mergeMapPosts(data.posts)
      hasMore.value = data.has_more
      nextCursor.value = data.next_cursor
    } catch { if (!current.signal.aborted) loadMoreError.value = '加载更多失败，请点击下方按钮重试。' }
    finally { if (!current.signal.aborted) loadingMore.value = false }
  }

  async function loadVisitData() {
    visitController?.abort()
    const current = visitController = new AbortController()
    visitLoading.value = true
    visitError.value = visitWarning.value = ''
    try {
      const data = await getVisits({ signal: current.signal })
      if (current.signal.aborted) return
      notionVisitedPlaces.value = data.visited_places
      notionVisitRecords.value = data.visit_records
      if (data.warning) visitWarning.value = '额外到访记录尚未启用，目前显示游记中的足迹。'
    } catch { if (!current.signal.aborted) visitError.value = '到访记录加载失败，目前仅显示已加载的足迹。' }
    finally { if (!current.signal.aborted) visitLoading.value = false }
  }

  onScopeDispose(() => { listController?.abort(); mapController?.abort(); visitController?.abort() })
  return { posts, mapPosts, notionVisitedPlaces, notionVisitRecords, loading, loadingMore, hasMore,
    loadError, loadMoreError, visitLoading, visitError, visitWarning, mapSyncLoading, mapSyncError,
    loadInitialPosts, loadMore, loadVisitData, retryMapSync }
}
