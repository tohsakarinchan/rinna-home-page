import { normalizePrefectureTag } from '../../../shared/domain/prefectures.js'

function parseVisitTimestamp(input = '') {
    const ts = Date.parse(String(input || '').trim())
    return Number.isFinite(ts) ? ts : Number.NaN
}

function formatVisitDate(input = '') {
    if (/^\d{4}-\d{2}$/.test(input)) return input.replace('-', '/')
    const ts = parseVisitTimestamp(input)
    if (!Number.isFinite(ts)) return input || '--'
    const pad = n => String(n).padStart(2, '0')
    const d = new Date(ts)
    const hasTime = /T|\s/.test(String(input))
    return hasTime
        ? `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
        : `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
}

export function buildVisitSummary(mapPosts, notionVisitedPlaces, notionVisitRecords) {
  const visitedPrefectures = (() => {
      const set = new Set()
      mapPosts.forEach(post => {
          post.tags.forEach(tag => { const n = normalizePrefectureTag(tag); if (n) set.add(n) })
      })
      notionVisitedPlaces.forEach(placeName => {
          const n = normalizePrefectureTag(placeName)
          if (n) set.add(n)
      })
      return [...set]
  })()

  const firstVisitEntries = (() => {
      const firstVisit = new Map()
      mapPosts.forEach(post => {
          const ts = parseVisitTimestamp(post.date)
          if (!Number.isFinite(ts)) return
          post.tags.forEach(tag => {
              const n = normalizePrefectureTag(tag)
              if (!n) return
              const prev = firstVisit.get(n)
              if (!prev || ts < prev.ts) firstVisit.set(n, { name: n, ts, rawDate: post.date })
          })
      })
      notionVisitRecords.forEach(record => {
          const n = normalizePrefectureTag(record?.name || '')
          if (!n) return
          const rawDate = record?.firstVisitDate || ''
          const ts = parseVisitTimestamp(rawDate)
          if (!Number.isFinite(ts)) return
          // Explicit travel records take precedence over article publication dates.
          firstVisit.set(n, { name: n, ts, rawDate })
      })
      return [...firstVisit.values()]
  })()

  const visitRecords = (() => {
      return firstVisitEntries
          .sort((a, b) => a.ts - b.ts)
          .map(item => ({ name: item.name, ts: item.ts, firstVisitLabel: formatVisitDate(item.rawDate) }))
  })()


  return { visitedPrefectures, visitRecords }
}
