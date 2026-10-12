// Explicit relations take priority. Otherwise match place names, never guess by paragraph count.
export function chapterStops(day) {
  let last = -1
  return day.journal.map(chapter => {
    const text = `${chapter.heading} ${chapter.text}`
    const indices = day.stops.flatMap((stop, index) => {
      const name = stop.name.split(/[·・]/)[0].trim()
      const matches = Array.isArray(chapter.stopIds) ? chapter.stopIds.includes(stop.id) : name.length > 1 && text.includes(name) && index > last
      return matches ? [index] : []
    })
    if (indices.length) last = Math.max(last, ...indices)
    return indices
  })
}
