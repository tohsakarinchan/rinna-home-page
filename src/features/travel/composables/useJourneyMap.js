import { computed, ref, shallowRef, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { routePrefix } from '../domain/journey-progress.js'
import { useReadingProgress } from './useReadingProgress.js'
import { useMotionPreferences } from '../../../shared/composables/useMotionPreferences.js'

// One Leaflet instance owns markers, popup and route animation for a mounted journey.
export function useJourneyMap(props, day, page, emit, { L }) {
  const mapEl = ref(null)

  const active = ref('')
  const selectedStop = computed(() => day.value.stops.find(s => s.id === active.value))
  const tileError = ref(false)
  const previewStop = ref(null)
  const previewIndex = computed(() => day.value.stops.findIndex(s => s.id === previewStop.value?.id))
  const popupHost = shallowRef(null)
  const photoFailed = ref(false)
  let map, tiles, layers, observer, popup, closeTimer, progressLine, baseLine, zoomControl
  let cardRevision = 0, disposed = false
  const markers = new Map()
  function cancelClose() { clearTimeout(closeTimer) }
  function closeCard() {
    cardRevision++
    cancelClose()
    map?.closePopup()
    active.value = ''
    previewStop.value = null
  }
  function scheduleClose() {
    cancelClose()
    if (active.value) return
    closeTimer = setTimeout(() => {
      if (active.value) return
      if (popupHost.value?.matches(':hover') || popupHost.value?.contains(document.activeElement)) return
      closeCard()
    }, 350)
  }
  async function showCard(stop, pinned = false) {
    cancelClose()
    if (!pinned && active.value) return
    const revision = ++cardRevision
    if (previewStop.value?.id !== stop.id) photoFailed.value = false
    previewStop.value = stop
    if (pinned) active.value = stop.id
    popup.options.autoPan = pinned && !docked.value
    popup.options.offset = L.point(0, -12)
    popup.setLatLng(stop.geo).setContent(popupHost.value).openOn(map)
    await nextTick()
    if (disposed || revision !== cardRevision || previewStop.value?.id !== stop.id) return
    popup.update()
    const element = popup.getElement()
    element?.classList.remove('preview-shifted')
    // Keep hover previews inside the map without panning the marker away from the pointer.
    if ((!pinned || docked.value) && element) {
      const bounds = mapEl.value.getBoundingClientRect()
      const card = element.getBoundingClientRect()
      let dx = Math.max(bounds.left + 10 - card.left, Math.min(0, bounds.right - 10 - card.right))
      const dy = Math.max(bounds.top + 10 - card.top, Math.min(0, bounds.bottom - 28 - card.bottom))
      if (dy > 0) {
        const sideShift = card.width / 2 + 24
        if (card.right + sideShift < bounds.right - 10) dx = sideShift
        else if (card.left - sideShift > bounds.left + 10) dx = -sideShift
      }
      if (dx || dy) {
        popup.options.offset = L.point(dx, -12 + dy)
        element.classList.add('preview-shifted')
        popup.update()
      }
    }
  }
  function fit(includeArrival) {

    closeCard()
    if (!map) return
    if (docked.value) { fitReadingSegment(); return }
    map.closePopup()
    const stops = day.value.stops.filter(s => Array.isArray(s.geo))
    if (stops.length) map.fitBounds(L.latLngBounds(stops.map(s => s.geo)), { padding: [35, 35], maxZoom: 14, animate: false })
    else map.setView([36.2, 138.2], 5, { animate: false })
  }
  function focusStop(stop) {
    cancelClose()
    active.value = stop.id
    if (!docked.value) map?.setView(stop.geo, stop.zoom || 16, { animate: false })
    showCard(stop, true)
    if (!docked.value) mapEl.value?.scrollIntoView({ behavior: 'instant', block: 'nearest' })
  }
  function renderDay() {
    stopMotion()
    routePosition = -1
    closeCard()
    layers.clearLayers()
    markers.clear()
    baseLine = L.polyline(day.value.stops.map(s => s.geo), { color: '#38665e', weight: 2, opacity: .65, dashArray: '5 8', interactive: false }).addTo(layers)
    day.value.stops.forEach((stop, index) => {
      const icon = L.divIcon({ className: `day-pin ${stop.provisional ? 'pending' : ''}`, html: `<span>${index + 1}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] })
      const marker = L.marker(stop.geo, { icon, title: stop.name, alt: stop.name }).addTo(layers)
      marker.on('mouseover', () => {
        if (window.matchMedia('(hover: hover) and (min-width: 601px)').matches) showCard(stop)
      }).on('mouseout', scheduleClose).on('click', () => focusStop(stop))
      markers.set(stop.id, marker)
    })
    progressLine = L.polyline([], { color: '#34594f', weight: 4, dashArray: '5 8', interactive: false }).addTo(layers)
    fit(false)
  }
  function retryTiles() { tileError.value = false; tiles?.redraw() }
  function gateMapWheel(event) {
    // Capture before Leaflet's wheel listener: ordinary scrolling stays with the page.
    // Let popup content scroll normally and leave browser zoom shortcuts outside the map alone.
    if (docked.value || !event.ctrlKey || event.target.closest('.leaflet-popup, .leaflet-control')) {
      event.stopImmediatePropagation()
      return
    }
    event.preventDefault()
  }
  watch(page, async (current, previous) => {
    await nextTick()
    if (disposed) return
    if (map) renderDay()
    animateElement(journeyEl.value, [
      { opacity: .35, transform: 'translateX(' + (current > previous ? 14 : -14) + 'px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ], 260)
    journeyEl.value?.querySelector('.day-pager button')?.focus({ preventScroll: true })
  })
  onMounted(() => {
    mapEl.value.addEventListener('wheel', gateMapWheel, { capture: true, passive: false })
    map = L.map(mapEl.value, {
      scrollWheelZoom: true, wheelPxPerZoomLevel: 120, wheelDebounceTime: 80,
      keyboard: true, zoomAnimation: false, fadeAnimation: false,
      zoomControl: false,
    })
    zoomControl = L.control.zoom({ zoomInTitle: '放大地图（+）', zoomOutTitle: '缩小地图（−）' }).addTo(map)
    popupHost.value = document.createElement('div')
    L.DomEvent.disableClickPropagation(popupHost.value)
    L.DomEvent.disableScrollPropagation(popupHost.value)
    popup = L.popup({ className: 'journey-popup', maxWidth: 280, minWidth: 220, offset: [0, -12], autoPanPadding: [12, 12], closeButton: true, closeOnClick: false })
    map.on('popupclose', () => { cancelClose(); active.value = ''; previewStop.value = null })
    map.on('click', closeCard)
    map.on('dragstart zoomstart', () => { if (!active.value) closeCard() })
    tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' })
    tiles.on('tileerror', () => { tileError.value = true }).addTo(map)
    layers = L.layerGroup().addTo(map)
    renderDay()
    let firstResize = true
    observer = new ResizeObserver(() => {
      if (!props.active || reading.changingLayout) return
      mapEl.value.style.setProperty('--place-card-width', `${Math.max(160, mapEl.value.clientWidth - 28)}px`)
      map.invalidateSize({ pan: false })
      if (docked.value) fitReadingSegment()
      else if (firstResize) fit(false)
      firstResize = false
      if (previewStop.value) showCard(previewStop.value, !!active.value)
    })
    observer.observe(mapEl.value)
    reading.mount()
  })
  onBeforeUnmount(() => {
    disposed = true
    cancelClose()
    stopMotion()
    reading.dispose()
    mapEl.value?.removeEventListener('wheel', gateMapWheel, true)
    observer?.disconnect()
    map?.remove()
  })
  const readingMapEl = ref(null)
  const { motionEnabled } = useMotionPreferences()
  const motionAllowed = computed(() => props.motionEnabled && motionEnabled.value)
  let routeFrame, routePosition = -1
  const animations = new Set()
  function stopMotion() {
    cancelAnimationFrame(routeFrame)
    reading.cancelCamera()
    animations.forEach(animation => animation.cancel())
    animations.clear()
    map?.stop()
  }
  function animateElement(element, frames, duration = 320) {
    if (!motionAllowed.value || !element?.animate) return
    const animation = element.animate(frames, { duration, easing: 'cubic-bezier(.22,1,.36,1)' })
    animations.add(animation)
    animation.onfinish = animation.oncancel = () => animations.delete(animation)
  }
  function revealPhoto(event) {
    animateElement(event.target, [{ opacity: .35 }, { opacity: 1 }], 420)
    queueReading()
  }
  function drawRoute(target) {
    cancelAnimationFrame(routeFrame)
    const points = day.value.stops.map(stop => stop.geo)
    if (!motionAllowed.value || target < 0) {
      routePosition = target
      progressLine?.setLatLngs(routePrefix(points, target))
      return
    }
    const from = Math.max(0, routePosition)
    const start = performance.now()
    function frame(now) {
      const t = Math.min(1, (now - start) / 520)
      routePosition = from + (target - from) * (1 - (1 - t) ** 3)
      progressLine?.setLatLngs(routePrefix(points, routePosition))
      if (t < 1) routeFrame = requestAnimationFrame(frame)
    }
    routeFrame = requestAnimationFrame(frame)
  }
  watch(motionAllowed, () => {
    stopMotion()
    reading.resetRoute()
    updateReadingMap()
  })
  const reading = useReadingProgress({ props, day, page, emit, L, readingMapEl, markers,
    runtime: { get map() { return map }, get zoomControl() { return zoomControl }, get baseLine() { return baseLine } },
    closeCard, stopMotion, animateElement, drawRoute, fit })
  const { journeyEl, mapSlot, docked, slotHeight, readingChapter, readingLabel, chapterRoutes,
    fitReadingSegment, updateReadingMap, queueReading } = reading
  return { mapEl, active, selectedStop, tileError, previewStop, previewIndex, popupHost, photoFailed,
    cancelClose, closeCard, scheduleClose, focusStop, fit, retryTiles, revealPhoto,
    readingMapEl, motionAllowed, journeyEl, mapSlot, docked, slotHeight, readingChapter, readingLabel, chapterRoutes,
    jumpToChapter: reading.jumpToChapter,
    updatePopup: () => popup?.update() }

}
