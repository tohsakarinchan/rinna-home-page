// Pinned same-origin data; provenance is in public/maps/README.md.
export const JAPAN_GEO_URL = '/maps/japan-c686f194.geojson'
// Share the immutable source across map instances. A failed request can be retried.
export function createGeoLoader(fetcher = (...args) => fetch(...args)) {
  let pending
  return () => {
    if (!pending) pending = fetcher(JAPAN_GEO_URL, {
      signal: AbortSignal.timeout(15000),
    }).then(async response => {
      if (!response.ok) throw new Error('Map unavailable')
      const data = await response.json()
      if (!Array.isArray(data.features) || !data.features.length) throw new Error('Invalid map')
      return data
    }).catch(error => { pending = undefined; throw error })
    return pending
  }
}
export const loadJapanGeoJson = createGeoLoader()
