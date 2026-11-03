import { ref, onScopeDispose } from 'vue'
import { fetchAllPosts } from '../api/blog.js'

export function useJournalLinks() {
  const articles = ref([]), articlesLoading = ref(true), articlesError = ref(false)
  let controller
  async function loadArticles() {
    controller?.abort()
    const current = controller = new AbortController()
    articlesLoading.value = true
    articlesError.value = false
    try {
      const posts = await fetchAllPosts({ signal: current.signal })
      if (!current.signal.aborted) articles.value = posts
    } catch { if (!current.signal.aborted) articlesError.value = true }
    finally { if (!current.signal.aborted) articlesLoading.value = false }
  }
  onScopeDispose(() => controller?.abort())
  return { articles, articlesLoading, articlesError, loadArticles }
}
