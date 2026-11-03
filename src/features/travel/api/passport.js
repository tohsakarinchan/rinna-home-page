import { fetchJson } from '../../../shared/lib/http.js'

export async function fetchPassportSummary({ signal } = {}) {
  const data = await fetchJson('/api/passport?view=summary', { signal })
  if (!Array.isArray(data.trips)) throw new Error('Invalid passport response')
  return data.trips
}

export async function fetchTripDetail(id, { signal } = {}) {
  const data = await fetchJson(`/api/passport?trip=${encodeURIComponent(id)}`, { signal })
  const trip = data.trips?.find(item => item.id === id)
  if (!trip) throw new Error('Missing trip')
  return trip
}
