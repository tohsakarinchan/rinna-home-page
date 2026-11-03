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

// Fractional stop index for a schematic route, including reverse progress.
export function routePrefix(points, progress) {
  if (!points.length || progress < 0) return []
  const end = Math.min(progress, points.length - 1)
  const index = Math.floor(end)
  const result = points.slice(0, index + 1)
  if (index < points.length - 1 && end > index) {
    const t = end - index
    result.push(points[index].map((v, axis) => v + (points[index + 1][axis] - v) * t))
  }
  return result
}
