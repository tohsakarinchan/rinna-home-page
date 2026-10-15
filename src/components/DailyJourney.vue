<template>
  <section ref="journeyEl" class="daily-journey" :class="{ 'motion-off': !motionAllowed }" aria-label="每日旅行页">
    <nav class="day-pager" aria-label="按日期翻页">
      <button aria-label="上一章" @click="turn(-1)">←</button>
      <div aria-live="polite"><span>DAY {{ String(day.day).padStart(2, '0') }} · {{ weekday }}</span><strong>{{ day.date.replaceAll('-', '.') }}</strong></div>
      <button aria-label="下一章" @click="turn(1)">→</button>
    </nav>
    <header class="day-title"><span>A DAY IN THE STORY</span><h2>{{ day.title }}</h2><p>{{ day.subtitle }}</p></header>
    <div class="map-toolbar"><div><button :aria-pressed="!active" @click="fit(false)">当日活动范围</button></div><span aria-live="polite">{{ selectedStop ? `正在查看：${selectedStop.name}` : '点击站点，放大到街区' }}</span></div>
    <p class="map-help">Ctrl + 滚轮缩放 · 点击地图后按 + / − 缩放、方向键移动 · 手机可双指缩放</p>
    <div ref="mapSlot" class="map-slot" :style="docked ? { height: slotHeight + 'px' } : {}">
      <Teleport :to="mapHost || 'body'" :disabled="!docked || !mapHost">
        <div ref="readingMapEl" class="reading-map" :class="{ docked, 'motion-off': !motionAllowed }">
          <div v-if="docked" class="reading-map-heading"><span>沿着文字，重访这一天</span><Transition name="reading-label" mode="out-in"><strong :key="readingLabel">{{ readingLabel }}</strong></Transition><button v-if="!following" @click="resumeFollowing">继续跟随游记 ↗</button><small v-else>地图随正文推进 · 可拖动自由查看</small></div>
    <div ref="mapEl" class="street-map" role="region" tabindex="0" aria-label="当日街道地图，可用加减键缩放和方向键移动" @keydown.esc.stop="closeCard"/>
          <p v-if="docked" class="reading-map-caption">虚线为站点连接示意，非实际交通路线。金色地点待确认。</p>
        </div>
      </Teleport>
    </div>
    <Teleport v-if="popupHost && previewStop" :to="popupHost">
      <article class="place-card" :aria-label="`${previewStop.name}站点卡片`" @pointerenter="cancelClose" @pointerleave="scheduleClose" @focusin="cancelClose" @focusout="scheduleClose" @keydown.esc.stop="closeCard">
        <div class="place-photo">
          <img v-if="previewStop.photo?.url && !photoFailed" :src="previewStop.photo.url" :alt="previewStop.photo.alt || previewStop.name" @error="photoFailed = true" @load="popup?.update()" />
          <div v-else class="photo-placeholder"><span aria-hidden="true">▧</span><strong>留一格，给这段旅途</strong><small>照片待补 · PHOTO TO COME</small></div>
          <span class="place-number">STOP {{ String(previewIndex + 1).padStart(2, '0') }}</span>
        </div>
        <div class="place-content">
          <div class="place-meta"><span>{{ previewStop.category }}</span><span v-if="previewStop.provisional" class="place-pending">待确认</span></div>
          <h3>{{ previewStop.name }}</h3><p>{{ previewStop.note }}</p>
          <div class="place-sources"><span>行程：本人提供 · 坐标非 GPS 轨迹</span><template v-if="previewStop.source"><a :href="previewStop.source" target="_blank" rel="noopener noreferrer">地标参考 ↗</a><span v-if="previewStop.contributor">贡献者：{{ previewStop.contributor }}</span><a v-if="previewStop.originalSource" :href="previewStop.originalSource" target="_blank" rel="noopener noreferrer">地标原始来源 ↗</a><a v-if="previewStop.license" :href="previewStop.license" target="_blank" rel="noopener noreferrer">衍生地标 · 授权说明 ↗</a></template><a v-if="previewStop.photo?.source && !photoFailed" :href="previewStop.photo.source" target="_blank" rel="noopener noreferrer">{{ previewStop.photo.credit || '照片来源' }} ↗</a><span v-else-if="previewStop.photo?.credit && !photoFailed">{{ previewStop.photo.credit }}</span></div>
          <footer><span>{{ active ? '已固定 · 点击地图空白处收起' : '悬停预览' }}</span><button v-if="!active" @click="focusStop(previewStop)">固定卡片 ↗</button></footer>
        </div>
      </article>
    </Teleport>
    <p v-if="tileError" class="map-error" role="status">地图底图暂时无法加载；站点与游记仍可阅读。<button @click="retryTiles">重新加载底图</button></p>
    <p class="map-caption">编号按你提供的顺序排列。虚线仅连接站点，不代表实际道路或乘车路线；金色标记为待确认地点。</p>
    <div class="day-stops" aria-label="当日停靠点"><button v-for="(stop, index) in day.stops" :key="stop.id" :class="{ chosen: active === stop.id, provisional: stop.provisional }" :aria-pressed="active === stop.id" @click="focusStop(stop)"><b>{{ String(index + 1).padStart(2, '0') }}</b><span>{{ stop.name }}<small>{{ stop.category }}{{ stop.provisional ? ' · 待确认' : '' }}</small></span></button></div>
    <div v-if="selectedStop" class="stop-note" aria-live="polite"><strong>{{ selectedStop.name }}</strong><p>{{ selectedStop.note }}</p><a v-if="selectedStop.source" :href="selectedStop.source" target="_blank" rel="noopener noreferrer">查看 Anitabi 参考 ↗</a></div>
    <article class="day-journal"><header><span>FIELD NOTES / {{ String(day.day).padStart(2, '0') }}</span><h3>{{ day.journalTitle }}</h3><p>{{ day.journalNotice }}</p></header><section v-for="(chapter, index) in day.journal" :key="chapter.heading" :data-chapter="index" :class="{ 'reading-chapter': docked && readingChapter === index }"><h4>{{ chapter.heading }}</h4><p>{{ chapter.text }}</p><div v-if="photosForChapter(index).length" class="chapter-photos"><figure v-for="photo in photosForChapter(index)" :key="photo.url"><a :href="photo.url" target="_blank" rel="noopener noreferrer" :aria-label="'查看大图：' + photo.alt"><img :src="photo.url" :alt="photo.alt" loading="lazy" decoding="async" @error="failedPhotos.add(photo.url)" @load="revealPhoto" /></a><figcaption>{{ photo.alt }}<span v-if="photo.credit"> · {{ photo.credit }}</span><a v-if="photo.source" :href="photo.source" target="_blank" rel="noopener noreferrer">原相册 ↗</a></figcaption></figure></div></section><p v-if="!day.journal.length">这一天的游记正在整理中。</p></article>
    <details class="day-references"><summary>地点校对与资料来源</summary><p>{{ day.locationNotice }}</p><p><template v-for="(reference, index) in day.references" :key="index"><a v-if="reference.url" :href="reference.url" target="_blank" rel="noopener noreferrer">{{ reference.text }}</a><span v-else>{{ reference.text }}</span></template></p></details>
    <footer class="day-end"><span>{{ page + 1 }} / {{ days.length }} 页已整理</span></footer>
    <nav class="bottom-pager" aria-label="正文底部翻页">
      <button @click="turn(-1)"><span aria-hidden="true">←</span> {{ page === 0 ? '序言' : '上一天' }}</button>
      <span>{{ day.date.replaceAll('-', '.') }}</span>
      <button @click="turn(1)">{{ page === days.length - 1 ? '归程与总结' : '下一天' }} <span aria-hidden="true">→</span></button>
    </nav>
  </section>
</template>

<script setup>
import { computed, ref, reactive, shallowRef, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import L from 'leaflet'
import { cityStops } from '../constants/journey-stories'
import { chapterStops, routePrefix } from '../utils/journey-progress'
import 'leaflet/dist/leaflet.css'
const props = defineProps({ days: { type: Array, required: true }, initialPage: { type: Number, default: 0 }, mapHost: { default: null }, motionEnabled: { type: Boolean, default: true } })
const emit = defineEmits(['layout', 'boundary'])
const days = computed(() => props.days.map(d => ({ ...d, stops: cityStops(d.stops) })).sort((a, b) => a.date.localeCompare(b.date)))
const page = ref(Math.max(0, Math.min(props.initialPage, days.value.length - 1)))
const day = computed(() => days.value[page.value])
const weekday = computed(() => new Intl.DateTimeFormat('zh-CN', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${day.value.date}T12:00:00Z`)))
const mapEl = ref(null)

const active = ref('')
const selectedStop = computed(() => day.value.stops.find(s => s.id === active.value))
const tileError = ref(false)
const previewStop = ref(null)
const previewIndex = computed(() => day.value.stops.findIndex(s => s.id === previewStop.value?.id))
const popupHost = shallowRef(null)
const photoFailed = ref(false)
let map, tiles, layers, observer, popup, closeTimer, progressLine, baseLine
let cardRevision = 0
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
  popup.options.autoPan = pinned
  popup.options.offset = L.point(0, -12)
  popup.setLatLng(stop.geo).setContent(popupHost.value).openOn(map)
  await nextTick()
  if (revision !== cardRevision || previewStop.value?.id !== stop.id) return
  popup.update()
  const element = popup.getElement()
  element?.classList.remove('preview-shifted')
  // Keep hover previews inside the map without panning the marker away from the pointer.
  if (!pinned && element) {
    const bounds = mapEl.value.getBoundingClientRect()
    const card = element.getBoundingClientRect()
    let dx = Math.max(bounds.left + 10 - card.left, Math.min(0, bounds.right - 10 - card.right))
    const dy = Math.max(bounds.top + 10 - card.top, Math.min(0, bounds.bottom - 10 - card.bottom))
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
  map.closePopup()
  const stops = day.value.stops.filter(s => Array.isArray(s.geo))
  if (stops.length) map.fitBounds(L.latLngBounds(stops.map(s => s.geo)), { padding: [35, 35], maxZoom: 14, animate: false })
  else map.setView([36.2, 138.2], 5, { animate: false })
}
function focusStop(stop) {
  if (docked.value) following.value = false
  cancelClose()
  active.value = stop.id
  map?.setView(stop.geo, stop.zoom || 16, { animate: false })
  showCard(stop, true)
  mapEl.value?.scrollIntoView({ behavior: 'instant', block: 'nearest' })
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
function turn(delta) {
  const next = page.value + delta
  if (next < 0 || next >= days.value.length) { emit('boundary', delta); return }
  page.value = next
}
function retryTiles() { tileError.value = false; tiles?.redraw() }
function gateMapWheel(event) {
  // Capture before Leaflet's wheel listener: ordinary scrolling stays with the page.
  // Let popup content scroll normally and leave browser zoom shortcuts outside the map alone.
  if (!event.ctrlKey || event.target.closest('.leaflet-popup, .leaflet-control')) {
    event.stopImmediatePropagation()
    return
  }
  pauseFollowing()
  event.preventDefault()
}
watch(page, async (current, previous) => {
  await nextTick()
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
  L.control.zoom({ zoomInTitle: '放大地图（+）', zoomOutTitle: '缩小地图（−）' }).addTo(map)
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
    mapEl.value.style.setProperty('--place-card-width', `${Math.max(160, mapEl.value.clientWidth - 28)}px`)
    map.invalidateSize()
    if (firstResize) { fit(false); firstResize = false }
    else if (previewStop.value) showCard(previewStop.value, !!active.value)
  })
  observer.observe(mapEl.value)
  motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  updateMotionPreference()
  motionQuery.addEventListener('change', updateMotionPreference)
  scrollRoot = journeyEl.value.closest('.trip-dialog-body')
  scrollRoot?.addEventListener('scroll', queueReading, { passive: true })
  window.addEventListener('resize', queueReading)
  mapEl.value.addEventListener('pointerdown', pauseFollowing)
  mapEl.value.addEventListener('keydown', pauseFollowing)
  queueReading()
})
onBeforeUnmount(() => {
  cancelClose()
  stopMotion()
  motionQuery?.removeEventListener('change', updateMotionPreference)
  cancelAnimationFrame(readingFrame)
  scrollRoot?.removeEventListener('scroll', queueReading)
  window.removeEventListener('resize', queueReading)
  mapEl.value?.removeEventListener('pointerdown', pauseFollowing)
  mapEl.value?.removeEventListener('keydown', pauseFollowing)
  emit('layout', false)
  mapEl.value?.removeEventListener('wheel', gateMapWheel, true)
  observer?.disconnect()
  map?.remove()
})
const failedPhotos = reactive(new Set())
function photosForChapter(index) {
  const chapter = day.value.journal[index]
  const candidates = chapter.photos?.length ? chapter.photos : (chapterRoutes.value[index] || []).flatMap(i => {
    const stop = day.value.stops[i]
    return stop.photo?.url ? [{ ...stop.photo, alt: stop.photo.alt || stop.name }] : []
  })
  return candidates.filter((photo, i) => !failedPhotos.has(photo.url) && candidates.findIndex(p => p.url === photo.url) === i)
}
const readingMapEl = ref(null)
const reducedMotion = ref(false)
const motionAllowed = computed(() => props.motionEnabled && !reducedMotion.value)
let motionQuery, routeFrame, cameraTimer, routePosition = -1
const animations = new Set()
function updateMotionPreference() { reducedMotion.value = motionQuery.matches }
function stopMotion() {
  cancelAnimationFrame(routeFrame)
  clearTimeout(cameraTimer)
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
  lastRoute = '__reset__'
  updateReadingMap()
})
const journeyEl = ref(null)
const mapSlot = ref(null)
const docked = ref(false)
const slotHeight = ref(0)
const following = ref(true)
const readingChapter = ref(-1)
const chapterRoutes = computed(() => chapterStops(day.value))
const readingLabel = computed(() => {
  const indices = chapterRoutes.value[readingChapter.value] || []
  return indices.length ? indices.map(i => day.value.stops[i].name).join(' → ') : '这一日的足迹'
})
let scrollRoot, readingFrame, changingLayout = false, lastRoute = '__reset__'
function pauseFollowing() { if (docked.value) { following.value = false; stopMotion() } }
function resumeFollowing() { following.value = true; lastRoute = '__reset__'; updateReadingMap() }
function updateReadingMap() {
  if (!map || !docked.value || !following.value) return
  const indices = chapterRoutes.value[readingChapter.value] || []
  const atEnd = readingChapter.value >= 0 && scrollRoot.scrollHeight - scrollRoot.scrollTop - scrollRoot.clientHeight < 28
  const key = atEnd ? '__end__' : indices.join(',')
  if (lastRoute === key) return
  lastRoute = key
  closeCard()
  const end = atEnd ? day.value.stops.length - 1 : indices.length ? Math.max(...indices) : -1
  drawRoute(end)
  baseLine?.setStyle({ opacity: end >= 0 ? .22 : .65 })
  day.value.stops.forEach((stop, i) => {
    const element = markers.get(stop.id)?.getElement()
    element?.classList.toggle('reading-pin', indices.includes(i))
    element?.classList.toggle('future-pin', end >= 0 && i > end)
  })
  const points = atEnd ? day.value.stops.map(s => s.geo) : indices.map(i => day.value.stops[i].geo)
  clearTimeout(cameraTimer)
  map.stop()
  const moveCamera = () => {
    if (!docked.value || !following.value) return
    if (points.length) {
      const bounds = L.latLngBounds(points)
      if (motionAllowed.value) map.flyToBounds(bounds, { padding: [42, 42], maxZoom: 14, duration: .65 })
      else map.fitBounds(bounds, { padding: [42, 42], maxZoom: 14, animate: false })
    } else fit(false)
  }
  if (motionAllowed.value) cameraTimer = setTimeout(moveCamera, 110)
  else moveCamera()
}
function queueReading() {
  cancelAnimationFrame(readingFrame)
  readingFrame = requestAnimationFrame(syncReading)
}
async function syncReading() {
  if (!scrollRoot || changingLayout || !mapSlot.value) return
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
    emit('layout', shouldDock)
    await nextTick()
    scrollRoot.scrollTop += anchor.getBoundingClientRect().top - before
    map.invalidateSize({ pan: false })
    const shift = oldLeft - journeyEl.value.getBoundingClientRect().left
    animateElement(journeyEl.value, [{ transform: `translateX(${shift}px)`, opacity: .85 }, { transform: 'translateX(0)', opacity: 1 }])
    animateElement(readingMapEl.value, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], 380)
    lastRoute = '__reset__'
    following.value = true
    if (!shouldDock) {
      drawRoute(-1)
      baseLine?.setStyle({ opacity: .65 })
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
watch(page, () => { readingChapter.value = -1; lastRoute = '__reset__'; following.value = true; scrollRoot?.scrollTo({ top: 0 }); queueReading() })
</script>

<style scoped>
.bottom-pager{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:22px;padding-top:22px;border-top:1px solid #3a66522a}
.bottom-pager button{display:flex;align-items:center;gap:12px;min-height:44px;padding:10px 18px;border:1px solid #345a4744;border-radius:28px;color:#304b48;background:transparent;font:inherit;font-size:13px;cursor:pointer;transition:background 160ms ease}
.bottom-pager button:hover{background:#345a4710}.bottom-pager button:focus-visible{outline:2px solid #34594f;outline-offset:3px}.bottom-pager>span{font:12px Georgia,serif;color:#6d7b6d}
@media(max-width:600px){.bottom-pager{gap:8px}.bottom-pager button{padding:10px 12px;font-size:12px}.bottom-pager>span{display:none}}
.reading-label-enter-active,.reading-label-leave-active { transition:opacity 140ms ease,transform 180ms ease; }
.reading-label-enter-from { opacity:0; transform:translateY(5px); }
.reading-label-leave-to { opacity:0; transform:translateY(-3px); }
.motion-off :deep(.day-pin),.motion-off .day-journal section,.motion-off .reading-label-enter-active,.motion-off .reading-label-leave-active { transition:none; }
:deep(.day-pin) { transition:opacity 280ms ease,box-shadow 350ms ease,background-color 250ms ease; }
.day-journal section { transition:box-shadow 300ms ease; }
.chapter-photos a:focus-visible { outline:2px solid #34594f; outline-offset:4px; }
@media(prefers-reduced-motion:reduce) { *,*::before,*::after { transition:none !important; animation:none !important; } }
.chapter-photos { display:grid; gap:20px; margin:24px 0 36px; }
.chapter-photos figure { margin:0; }
.chapter-photos img { display:block; width:100%; aspect-ratio:4/3; object-fit:contain; background:#e8e6dc; border-radius:10px; }
.chapter-photos figcaption { font-size:11px; line-height:1.8; color:#637466; margin-top:8px; }
.chapter-photos figcaption a { margin-left:8px; color:inherit; }
.reading-map.docked { height:100%; display:flex; flex-direction:column; }
.reading-map-heading { display:grid; gap:10px; padding:4px 0 16px; }
.reading-map-heading > span { font-size:11px; letter-spacing:.12em; color:#6d7b6d; }
.reading-map-heading strong { min-height:3.4em; font:19px/1.7 Georgia,'Songti SC',serif; }
.reading-map-heading small,.reading-map-heading button { font-size:11px; text-align:left; }
.reading-map-heading button { color:#34594f; text-decoration:underline; }
.docked .street-map { flex:1; min-height:160px; height:auto; }
.reading-map-caption { font-size:10px; line-height:1.8; margin:10px 0 0; }
.day-journal section.reading-chapter { box-shadow:-12px 0 0 -10px #799884; }
:deep(.day-pin.reading-pin) { box-shadow:0 0 0 5px #c9d9bd,0 2px 9px #1235; }
:deep(.day-pin.future-pin) { opacity:.4; }
.daily-journey { color:#304b48; background:#f4f1e7; border-radius:18px; overflow:hidden; padding:24px; }
.day-pager { display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #3a66522a; padding-bottom:17px; }
.day-pager div { display:grid; text-align:center; gap:3px; }
.day-pager span { font-size:10px; letter-spacing:.13em; }
.day-pager strong { font:23px Georgia,serif; letter-spacing:.08em; }
.day-pager button { border:1px solid #345a4744; width:38px; height:38px; border-radius:50%; }
.day-pager button:disabled { opacity:.28; cursor:not-allowed; }
.day-title { padding:30px 0 23px; }
.day-title > span,.day-journal header > span { font-size:9px; letter-spacing:.19em; }
.day-title h2 { font-family:Georgia,'Songti SC',serif; font-size:30px; margin:8px 0; font-weight:500; }
.day-title p { font-size:13px; color:#6d7b6d; }
.map-toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:10px; font-size:10px; }
.map-toolbar div { display:flex; gap:6px; }
.map-toolbar button { border:1px solid #3b665244; padding:8px 10px; border-radius:20px; }
.map-toolbar button[aria-pressed=true] { background:#34594f; color:#fff; }
.street-map { height:clamp(300px,48dvh,460px); width:100%; border-radius:12px; z-index:0; background:#dae2d5; }
.street-map:focus-visible { outline:3px solid #58a7af; outline-offset:3px; }
.map-help { font-size:11px; line-height:1.7; color:#637466; margin:0 0 9px; }
:deep(.leaflet-control-zoom) { border:1px solid #34594f44; border-radius:10px; overflow:hidden; box-shadow:0 3px 12px #1b3e4526; }
:deep(.leaflet-control-zoom a) { width:44px; height:44px; line-height:44px; background:#fffdf5; color:#34594f; font-size:25px; }
:deep(.leaflet-control-zoom a:hover) { background:#e7ede2; }
:deep(.leaflet-control-zoom a:focus-visible) { outline:3px solid #58a7af; outline-offset:-3px; }
.map-caption,.map-error { font-size:11px; line-height:1.8; margin:9px 0 18px; }
.map-error { color:#914927; }
.day-stops { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
.day-stops button { display:flex; text-align:left; align-items:center; gap:10px; padding:11px; border:1px solid #31534225; background:#fffc; border-radius:9px; font-size:12px; }
.day-stops b { color:#779887; font:19px Georgia,serif; }
.day-stops small { display:block; font-size:9px; margin-top:4px; color:#637466; }
.day-stops button.chosen { border-color:#2e6e60; background:#e2ece4; }
.day-stops button.provisional { border-style:dashed; }
.stop-note { padding:14px; margin-top:12px; background:#e3e7dc; border-radius:10px; font-size:12px; line-height:1.8; }
.stop-note a,.day-references a { color:#2d6d67; text-decoration:underline; }
.day-journal { max-width:620px; margin:38px auto 20px; }
.day-journal header { padding-bottom:24px; border-bottom:1px solid #3a66522a; }
.day-journal h3 { font-size:25px; font-family:Georgia,'Songti SC',serif; font-weight:500; margin:8px 0 12px; }
.day-journal header p { font-size:11px; line-height:1.8; color:#69796b; }
.day-journal section { margin:28px 0; }
.day-journal h4 { font-size:16px; font-weight:550; margin-bottom:12px; }
.day-journal section p { font-size:14px; line-height:2.15; text-align:justify; }
.day-references { font-size:11px; line-height:1.9; border-top:1px solid #3a66522a; padding-top:15px; }
.day-references summary { cursor:pointer; }
.day-references p { margin-top:10px; }
.day-end { display:flex; justify-content:space-between; gap:12px; font-size:10px; margin-top:20px; color:#6d7b6d; }
button:focus-visible { outline:3px solid #58a7af; outline-offset:3px; }
:deep(.day-pin) { background:#315f54; border:2px solid white; color:#fff; border-radius:50%; box-shadow:0 2px 6px #1235; text-align:center; font:bold 13px/26px sans-serif; }
:deep(.day-pin.pending) { background:#a87639; }
:deep(.journey-popup .leaflet-popup-content-wrapper) { border-radius:14px; padding:0; background:#fffdf5; color:#304b48; box-shadow:0 8px 32px #1b3e4538; overflow:hidden; }
:deep(.journey-popup .leaflet-popup-content) { margin:0; width:min(280px,var(--place-card-width,280px)) !important; }
:deep(.journey-popup .leaflet-popup-tip) { background:#fffdf5; }
:deep(.journey-popup.preview-shifted .leaflet-popup-tip-container) { display:none; }
:deep(.journey-popup a.leaflet-popup-close-button) { top:6px; right:6px; width:28px; height:28px; border-radius:50%; background:#fffdf5; color:#304b48; font:22px/28px sans-serif; z-index:2; }
.place-card { max-height:min(340px,calc(48dvh - 56px)); overflow:auto; overscroll-behavior:contain; font-family:inherit; border-radius:14px; }
.place-photo { height:94px; position:relative; background:#e6e8dd; }
.place-photo img { width:100%; height:100%; object-fit:cover; display:block; }
.photo-placeholder { height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:3px; background:repeating-linear-gradient(135deg,transparent 0 9px,#68877609 9px 10px),radial-gradient(ellipse at top right,#e1d5b5,transparent 75%); color:#6b7e6e; }
.photo-placeholder > span { font-size:24px; line-height:1; }
.photo-placeholder strong { font-size:11px; font-weight:500; letter-spacing:.12em; }
.photo-placeholder small { font-size:8px; letter-spacing:.1em; }
.place-number { position:absolute; top:9px; left:10px; font:8px ui-monospace,monospace; letter-spacing:.12em; color:#536f61; }
.place-content { padding:12px 14px; }
.place-meta { display:flex; align-items:center; justify-content:space-between; gap:6px; font-size:10px; color:#55766b; }
.place-pending { color:#936b31; border:1px dashed #b49b6c; border-radius:4px; padding:1px 5px; }
.place-content h3 { font-size:18px; font-weight:550; margin:5px 0 7px; }
.place-content p { font-size:11px; line-height:1.75; margin:0 0 10px; }
.place-sources { display:grid; gap:4px; font-size:9px; line-height:1.5; color:#758073; }
.place-sources a { color:#366e67; text-decoration:underline; text-underline-offset:2px; }
.place-content footer { display:flex; align-items:center; justify-content:space-between; gap:8px; border-top:1px solid #436c5122; margin-top:10px; padding-top:8px; font-size:9px; color:#758073; }
.place-content footer button { color:#2b6559; padding:4px 6px; border-radius:5px; background:#e7ede2; }
.place-card a:focus-visible { outline:2px solid #58a7af; outline-offset:2px; }
@media(max-width:600px) { .daily-journey { padding:16px 12px; } .day-stops { grid-template-columns:repeat(2,minmax(0,1fr)); } .day-title h2 { font-size:26px; } .day-end { flex-direction:column; } }
</style>


