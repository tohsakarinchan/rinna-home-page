export const countries = [
  { id: 'cn', name: '中国', label: 'CHINA', domestic: true, center: [35, 105], landmarks: ['城市与山川'], nunu: { outfit: '', image: '' } },
  { id: 'jp', name: '日本', label: 'JAPAN', map: 'japan', center: [36, 138], landmarks: ['东京塔', '富士山'], nunu: { outfit: '', image: '' } },
  { id: 'fr', name: '法国', label: 'FRANCE', center: [47, 2], landmarks: ['巴黎天际线'], nunu: { outfit: '', image: '' } },
]
export const findCountry = id => countries.find(country => country.id === id)

// This legacy source is a Japan passport. Explicit unknown country codes must stay unknown.
export function tripCountry(trip) {
  const value = trip.countryId ?? trip.country
  if (value == null || value === '') return 'jp'
  const code = String(value).trim().toLowerCase()
  return ({ china: 'cn', 中国: 'cn', japan: 'jp', 日本: 'jp', france: 'fr', 法国: 'fr' })[code] || code
}
export const countryTrips = (trips, id) => trips.filter(trip => tripCountry(trip) === id)
export function regionGroups(trips) {
  return [...new Set(trips.map(trip => trip.region || trip.city || '地区待整理'))]
}
export function projectCountry(center, rotation = 90) {
  const lat = center[0] * Math.PI / 180, lon = (center[1] - rotation) * Math.PI / 180
  const depth = Math.cos(lat) * Math.cos(lon)
  return { x: 50 + Math.cos(lat) * Math.sin(lon) * 44, y: 50 - Math.sin(lat) * 44, visible: depth >= 0 }
}
