import { chapterStops } from './journey-progress.js'

export function openingPhotos(day) {
  if (!day) return []
  const routes = chapterStops(day)
  const urls = day.journal.flatMap((chapter, index) => chapter.photos?.length
    ? chapter.photos.map(photo => photo.url)
    : routes[index].map(i => day.stops[i].photo?.url))
  return [...new Set(urls.filter(Boolean))].slice(0, 2)
}

export function canWarmPhotos(connection) {
  return !connection?.saveData && !['slow-2g', '2g', '3g'].includes(connection?.effectiveType)
    && !(connection?.downlink > 0 && connection.downlink < 1.5)
}

export function createJourneyWarmup() {
  const links = []
  const images = new Map()
  return {
    connect(day) {
      const origins = new Set(['https://tile.openstreetmap.org'])
      for (const url of openingPhotos(day)) {
        try { origins.add(new URL(url, document.baseURI).origin) } catch { /* Ignore malformed photo URLs. */ }
      }
      for (const origin of origins) {
        if (origin === location.origin || links.some(link => link.href === origin + '/')) continue
        const link = document.createElement('link')
        link.rel = 'preconnect'
        link.href = origin
        document.head.append(link)
        links.push(link)
      }
    },
    photos(day) {
      if (!canWarmPhotos(navigator.connection)) return
      for (const url of openingPhotos(day)) {
        if (images.has(url)) continue
        const image = new Image()
        image.fetchPriority = 'low'
        image.decoding = 'async'
        images.set(url, image)
        image.src = url
      }
    },
    dispose() {
      links.forEach(link => link.remove())
      images.forEach(image => { image.removeAttribute('src') })
      images.clear()
    },
  }
}
