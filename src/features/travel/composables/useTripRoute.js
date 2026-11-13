import { ref, computed, watch, onScopeDispose } from 'vue'

export function useTripRoute({ route, router, country, trips, loading, selectTrip, cancelDetail }) {
  const overview = ref(false)
  const requested = computed(() => route.params.tripId || '')
  const missing = computed(() => !loading.value && !!requested.value && !trips.value.some(trip => trip.id === requested.value))
  const base = () => `/travel/${country.value.id}`
  const dialog = computed({
    get: () => overview.value || (!!requested.value && !loading.value && !missing.value),
    set: open => {
      if (!open) {
        overview.value = false
        cancelDetail()
        if (requested.value) router.replace(base())
      }
    },
  })
  watch([requested, loading, trips], () => {
    overview.value = false
    const trip = !loading.value && trips.value.find(item => item.id === requested.value)
    selectTrip(trip || null)
  }, { immediate: true })
  function openTrip(trip) {
    if (!trip) { overview.value = true; return selectTrip(null) }
    if (requested.value === trip.id) return selectTrip(trip)
    return router.push(`${base()}/trips/${encodeURIComponent(trip.id)}`)
  }
  onScopeDispose(cancelDetail)
  return { dialog, missing, openTrip }
}
