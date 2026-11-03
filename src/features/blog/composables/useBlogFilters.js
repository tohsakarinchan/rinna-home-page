import { ref, computed } from 'vue'
import { normalizePrefectureTag } from '../../../shared/domain/prefectures.js'
import { fuzzyMatch, highlight as highlightSearch } from '../domain/search.js'

export function useBlogFilters(posts) {
  const searchQuery = ref(''), activeTag = ref('')
  const allTags = computed(() => {
      const set = new Set()
      posts.value.forEach(p => p.tags.forEach(t => set.add(t)))
      return [...set]
  })
  
  const filteredPosts = computed(() => {
      let list = posts.value
      if (activeTag.value) {
          const norm = activeTagNormalized.value
          list = list.filter(p =>
              p.tags.some(tag => tag === activeTag.value || (norm && normalizePrefectureTag(tag) === norm))
          )
      }
      const q = searchQuery.value.trim()
      if (q) {
          list = list.filter(p =>
              fuzzyMatch(p.title, q) || fuzzyMatch(p.summary, q) || p.tags.some(t => fuzzyMatch(t, q))
          )
      }
      return list
  })
  
  const activeTagNormalized = computed(() => normalizePrefectureTag(activeTag.value))
  
  function isTagActive(tag) {
      if (activeTag.value === tag) return true
      const n = normalizePrefectureTag(tag)
      return Boolean(n && n === activeTagNormalized.value)
  }
  
  
  return { searchQuery, activeTag, allTags, filteredPosts, activeTagNormalized, isTagActive,
    highlight: text => highlightSearch(text, searchQuery.value) }
}
