<template>
  <section class="daily-journey" aria-label="每日旅行页">
    <nav class="day-pager" aria-label="按日期翻页">
      <button :disabled="page === 0" aria-label="前一天" @click="turn(-1)">←</button>
      <div aria-live="polite"><span>DAY {{ String(day.day).padStart(2, '0') }} · {{ weekday }}</span><strong>{{ day.date.replaceAll('-', '.') }}</strong></div>
      <button :disabled="page === days.length - 1" aria-label="后一天" @click="turn(1)">→</button>
    </nav>
    <header class="day-title"><span>TOKYO / A DAY IN THE STORY</span><h2>{{ day.title }}</h2><p>{{ day.subtitle }}</p></header>
    <div class="map-toolbar"><div><button :aria-pressed="!active && !wholeDay" @click="fit(false)">东京活动范围</button><button :aria-pressed="!active && wholeDay" @click="fit(true)">含机场全日范围</button></div><span aria-live="polite">{{ selectedStop ? `正在查看：${selectedStop.name}` : '点击站点，放大到街区' }}</span></div>
    <p class="map-help">Ctrl + 滚轮缩放 · 点击地图后按 + / − 缩放、方向键移动 · 手机可双指缩放</p>
    <div ref="mapEl" class="street-map" role="region" tabindex="0" aria-label="当日街道地图，可用加减键缩放和方向键移动" @keydown.esc.stop="closeCard"/>
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
    <article class="day-journal"><header><span>FIELD NOTES / {{ String(day.day).padStart(2, '0') }}</span><h3>{{ day.journalTitle }}</h3><p>{{ day.journalNotice }}</p></header><section v-for="chapter in day.journal" :key="chapter.heading"><h4>{{ chapter.heading }}</h4><p>{{ chapter.text }}</p></section><p v-if="!day.journal.length">这一天的游记正在整理中。</p></article>
    <details class="day-references"><summary>地点校对与资料来源</summary><p>{{ day.locationNotice }}</p><p><template v-for="(reference, index) in day.references" :key="index"><a v-if="reference.url" :href="reference.url" target="_blank" rel="noopener noreferrer">{{ reference.text }}</a><span v-else>{{ reference.text }}</span></template></p></details>
    <footer class="day-end"><span>{{ page + 1 }} / {{ days.length }} 页已整理</span><span>{{ days.length === 1 ? '后续日期待提供，暂不生成空白旅程。' : '使用上方左右按钮按日期翻页' }}</span></footer>
  </section>
</template>

<script setup>
import { computed, ref, shallowRef, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
const props = defineProps({ days: { type: Array, required: true } })
const days = computed(() => [...props.days].sort((a, b) => a.date.localeCompare(b.date)))
const page = ref(0)
const day = computed(() => days.value[page.value])
const weekday = computed(() => new Intl.DateTimeFormat('zh-CN', { weekday: 'long', timeZone: 'UTC' }).format(new Date(`${day.value.date}T12:00:00Z`)))
const mapEl = ref(null)
const wholeDay = ref(false)
const active = ref('')
const selectedStop = computed(() => day.value.stops.find(s => s.id === active.value))
const tileError = ref(false)
const previewStop = ref(null)
const previewIndex = computed(() => day.value.stops.findIndex(s => s.id === previewStop.value?.id))
const popupHost = shallowRef(null)
const photoFailed = ref(false)
let map, tiles, layers, observer, popup, closeTimer
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
  wholeDay.value = includeArrival
  closeCard()
  if (!map) return
  map.closePopup()
  const stops = day.value.stops.filter(s => Array.isArray(s.geo) && (includeArrival || !s.outsideCity))
  if (stops.length) map.fitBounds(L.latLngBounds(stops.map(s => s.geo)), { padding: [35, 35], maxZoom: 14, animate: false })
  else map.setView([36.2, 138.2], 5, { animate: false })
}
function focusStop(stop) {
  cancelClose()
  active.value = stop.id
  map?.setView(stop.geo, stop.zoom || 16, { animate: false })
  showCard(stop, true)
  mapEl.value?.scrollIntoView({ behavior: 'instant', block: 'nearest' })
}
function renderDay() {
  closeCard()
  layers.clearLayers()
  markers.clear()
  L.polyline(day.value.stops.map(s => s.geo), { color: '#38665e', weight: 2, opacity: .65, dashArray: '5 8', interactive: false }).addTo(layers)
  day.value.stops.forEach((stop, index) => {
    const icon = L.divIcon({ className: `day-pin ${stop.provisional ? 'pending' : ''}`, html: `<span>${index + 1}</span>`, iconSize: [30, 30], iconAnchor: [15, 15] })
    const marker = L.marker(stop.geo, { icon, title: stop.name, alt: stop.name }).addTo(layers)
    marker.on('mouseover', () => {
      if (window.matchMedia('(hover: hover) and (min-width: 601px)').matches) showCard(stop)
    }).on('mouseout', scheduleClose).on('click', () => focusStop(stop))
    markers.set(stop.id, marker)
  })
  fit(false)
}
function turn(delta) {
  const next = page.value + delta
  if (next < 0 || next >= days.value.length) return
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
  event.preventDefault()
}
watch(page, async () => { await nextTick(); if (map) renderDay() })
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
})
onBeforeUnmount(() => {
  cancelClose()
  mapEl.value?.removeEventListener('wheel', gateMapWheel, true)
  observer?.disconnect()
  map?.remove()
})
</script>

<style scoped>
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
