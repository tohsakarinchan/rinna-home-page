import { ref, onScopeDispose } from 'vue'
import { fetchPassportSummary, fetchTripDetail } from '../api/passport.js'

// State and detail cache belong to this passport instance, not the whole app.
export function usePassportData({ fetchSummary = fetchPassportSummary, fetchDetail = fetchTripDetail } = {}) {
  const trips = ref([])
  const selected = ref(null)
  const passportLoading = ref(true), passportError = ref(false)
  const detailLoading = ref(false), detailError = ref(false)
  const details = new Map()
  let summaryController, detailController

  function cancelDetail() {
    detailController?.abort()
    detailLoading.value = false
  }

  async function selectTrip(trip) {
    cancelDetail()
    selected.value = trip
    detailError.value = false
    if (!trip) return
    if (details.has(trip.id)) { selected.value = details.get(trip.id); return }
    const current = detailController = new AbortController()
    detailLoading.value = true
    try {
      const full = await fetchDetail(trip.id, { signal: current.signal })
      if (current.signal.aborted) return
      details.set(trip.id, full)
      selected.value = full
    } catch { if (!current.signal.aborted) detailError.value = true }
    finally { if (!current.signal.aborted) detailLoading.value = false }
  }

  async function loadPassport() {
    summaryController?.abort()
    const current = summaryController = new AbortController()
    passportLoading.value = true
    passportError.value = false
    try {
      const summary = await fetchSummary({ signal: current.signal })
      if (!current.signal.aborted) trips.value = summary
    } catch { if (!current.signal.aborted) passportError.value = true }
    finally { if (!current.signal.aborted) passportLoading.value = false }
  }

  onScopeDispose(() => {
    summaryController?.abort()
    cancelDetail()
  })

  return { trips, selected, passportLoading, passportError, detailLoading, detailError,
    loadPassport, selectTrip, cancelDetail }
}
