import { ref, computed, watch, nextTick } from 'vue'
import { chapterStops } from '../domain/journey-progress.js'

// Reading owns docking and chapter selection; map operations are supplied by the map owner.
export function useReadingProgress({ props, day, page, emit, runtime, L, readingMapEl, markers, closeCard, stopMotion, animateElement, drawRoute, fit }) {
  const journeyEl = ref(null)
  const mapSlot = ref(null)
  const docked = ref(false)
  const slotHeight = ref(0)
  const readingChapter = ref(-1)
  const chapterRoutes = computed(() => chapterStops(day.value))
  const readingLabel = computed(() => {
    const indices = chapterRoutes.value[readingChapter.value] || []
    return indices.length ? indices.map(i => day.value.stops[i].name).join(' → ') : '这一日的足迹'
  })
  let disposed = false
  let scrollRoot, readingFrame, cameraTimer, changingLayout = false, lastRoute = '__reset__', lastSegment = null
  function setMapInteraction() {
    const map = runtime.map
    if (!map) return
    for (const name of ['dragging', 'scrollWheelZoom', 'doubleClickZoom', 'touchZoom', 'boxZoom', 'keyboard']) {
      map[name]?.[docked.value ? 'disable' : 'enable']()
    }
    if (docked.value) runtime.zoomControl.remove()
    else runtime.zoomControl.addTo(map)
    markers.forEach(marker => { marker.options.autoPanOnFocus = !docked.value })
  }
  function fitReadingSegment() {
    const map = runtime.map
    if (!map || !docked.value) return
    const indices = chapterRoutes.value[readingChapter.value] || []
    const key = indices.join(',')
    // Unmapped paragraphs retain the last segment instead of returning to the whole day.
    if (!indices.length && lastSegment !== null) return
    const points = (indices.length ? indices.map(i => day.value.stops[i]) : day.value.stops).map(s => s.geo)
    if (points.length) {
      const size = map.getSize()
      // Fit the segment into roughly 70% of the viewport, with room for marker icons.
      // A single location keeps street context; nearby distinct locations may zoom closer.
      const bounds = L.latLngBounds(points)
      const singleLocation = bounds.getSouthWest().equals(bounds.getNorthEast())
      map.fitBounds(bounds, {
        padding: [Math.max(32, size.x * .15), Math.max(32, size.y * .15)],
        maxZoom: singleLocation ? 17 : 18,
        animate: false,
      })
    }
    lastSegment = key
  }
  function updateReadingMap() {
    const map = runtime.map
    if (!map || !docked.value) return
    const indices = chapterRoutes.value[readingChapter.value] || []
    const atEnd = readingChapter.value >= 0 && scrollRoot.scrollHeight - scrollRoot.scrollTop - scrollRoot.clientHeight < 28
    const key = atEnd ? '__end__' : indices.join(',')
    if (lastRoute === key) return
    lastRoute = key
    closeCard()
    const end = atEnd ? day.value.stops.length - 1 : indices.length ? Math.max(...indices) : -1
    drawRoute(end)
    runtime.baseLine?.setStyle({ opacity: end >= 0 ? .22 : .65 })
    day.value.stops.forEach((stop, i) => {
      const element = markers.get(stop.id)?.getElement()
      element?.classList.toggle('reading-pin', indices.includes(i))
      element?.classList.toggle('future-pin', end >= 0 && i > end)
    })
    clearTimeout(cameraTimer)
    if (indices.join(',') !== lastSegment) cameraTimer = setTimeout(fitReadingSegment, 180)
  }
  function queueReading() {
    if (disposed || !props.active) return
    cancelAnimationFrame(readingFrame)
    readingFrame = requestAnimationFrame(syncReading)
  }
  async function syncReading() {
    const map = runtime.map
    if (disposed || !props.active || !scrollRoot || changingLayout || !mapSlot.value) return
    const top = scrollRoot.getBoundingClientRect().top
    const shouldDock = !!props.mapHost && window.innerWidth >= 1000 && mapSlot.value.getBoundingClientRect().bottom < top + (docked.value ? 64 : 0)
    if (shouldDock !== docked.value) {
      changingLayout = true
      stopMotion()
      const oldLeft = journeyEl.value.getBoundingClientRect().left
      const blocks = [...journeyEl.value.querySelectorAll('.day-stops, .day-journal header, [data-chapter], .day-references')]
      const anchor = blocks.find(el => el.getBoundingClientRect().bottom > top + 24) || mapSlot.value
      const before = anchor.getBoundingClientRect().top
      if (shouldDock) slotHeight.value = mapSlot.value.offsetHeight
      docked.value = shouldDock
      closeCard()
      setMapInteraction()
      lastSegment = null
      emit('layout', shouldDock)
      await nextTick()
      if (disposed) return
      scrollRoot.scrollTop += anchor.getBoundingClientRect().top - before
      map.invalidateSize({ pan: false })
      const shift = oldLeft - journeyEl.value.getBoundingClientRect().left
      animateElement(journeyEl.value, [{ transform: `translateX(${shift}px)`, opacity: .85 }, { transform: 'translateX(0)', opacity: 1 }])
      animateElement(readingMapEl.value, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], 380)
      lastRoute = '__reset__'
      if (!shouldDock) {
        drawRoute(-1)
        runtime.baseLine?.setStyle({ opacity: .65 })
        markers.forEach(marker => marker.getElement()?.classList.remove('reading-pin', 'future-pin'))
        fit(false)
      }
      changingLayout = false
      // Re-evaluate after reflow; hysteresis prevents switching at the same boundary.
      queueReading()
    }
    const line = scrollRoot.getBoundingClientRect().top + Math.min(180, scrollRoot.clientHeight * .3)
    const chapters = [...journeyEl.value.querySelectorAll('[data-chapter]')]
    let index = -1
    chapters.forEach((chapter, i) => { if (chapter.getBoundingClientRect().top <= line) index = i })
    readingChapter.value = index
    updateReadingMap()
  }
  watch(page, () => { readingChapter.value = -1; lastRoute = '__reset__'; lastSegment = null; scrollRoot?.scrollTo({ top: 0 }); queueReading() })
  watch(() => props.initialPage, value => { page.value = Math.max(0, Math.min(value, props.days.length - 1)) })
  watch(() => props.active, async active => {
    const map = runtime.map
    stopMotion()
    cancelAnimationFrame(readingFrame)
    if (!active) {
      closeCard()
      docked.value = false
      setMapInteraction()
      emit('layout', false)
      return
    }
    await nextTick()
    if (disposed) return
    map?.invalidateSize({ pan: false })
    queueReading()
  })
  function mount() {
    scrollRoot = journeyEl.value.closest('.trip-dialog-body')
    scrollRoot?.addEventListener('scroll', queueReading, { passive: true })
    window.addEventListener('resize', queueReading)
    queueReading()
  }
  function jumpToChapter(index) {
    if (!scrollRoot || !Number.isInteger(index) || index < 0 || index >= day.value.journal.length) return
    const target = journeyEl.value.querySelector(`[data-chapter="${index}"]`)
    if (!target) return
    const top = scrollRoot.scrollTop + target.getBoundingClientRect().top - scrollRoot.getBoundingClientRect().top - 20
    scrollRoot.scrollTo({ top: Math.max(0, top), behavior: props.motionEnabled ? 'smooth' : 'auto' })
    target.querySelector('h4')?.focus({ preventScroll:true })
    queueReading()
  }
  function dispose() {
    disposed = true
    clearTimeout(cameraTimer)
    cancelAnimationFrame(readingFrame)
    scrollRoot?.removeEventListener('scroll', queueReading)
    window.removeEventListener('resize', queueReading)
    emit('layout', false)
  }
  return { journeyEl, mapSlot, docked, slotHeight, readingChapter, readingLabel, chapterRoutes,
    fitReadingSegment, updateReadingMap, queueReading, jumpToChapter, mount, dispose,
    get changingLayout() { return changingLayout },
    cancelCamera() { clearTimeout(cameraTimer) },
    resetRoute() { lastRoute = '__reset__' } }

}
