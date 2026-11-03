<template>
  <section class="passport-section" aria-label="旅行护照">
    <header class="passport-toolbar">
      <div><span class="eyebrow">A PERSONAL COLLECTION</span><h2>把旅途，留在这一页。</h2></div>
      <div class="passport-actions"><button v-if="latest" class="latest-trip" @click="openTrip(latest)">最近旅程 · {{ latest.month }} ↗</button><button class="motion-toggle" type="button" :aria-pressed="effects" :disabled="reducedMotion" @click="toggleMotion">{{ reducedMotion ? '已跟随系统减少动态' : effects ? '动态效果：开' : '动态效果：关' }}</button></div>
    </header>
    <p v-if="passportLoading" class="passport-status" role="status">正在翻开旅行护照…</p>
    <p v-else-if="passportError" class="passport-status" role="alert">旅行护照暂时无法加载。<button @click="loadPassport">重新加载</button></p>
    <p v-else-if="!trips.length" class="passport-status">旅行记忆正在整理中。</p>
    <div v-else class="passport-layout">
      <div class="passport-book" :class="{ 'effects-on': effects }">
        <div class="book-heading"><span>RINNA / TRAVEL PASSPORT</span><span>日本 · 私人旅行收藏</span></div>
        <div class="passport-intro"><span class="passport-emblem">✳</span><div><h3>旅の記録</h3><p>{{ trips.length }} 次出发，{{ trips.length }} 枚回忆。点一张贴纸，重访那段旅程。</p></div></div>
        <div id="passport-current-spread" class="passport-stage" :class="`turn-${turnDirection}`" @keydown="handlePageKey"
          @pointerdown="startSwipe" @pointermove="moveSwipe" @pointerup="endSwipe" @pointercancel="cancelSwipe" @click.capture="guardSwipeClick">
        <Transition :name="effects ? 'page-turn' : ''" :css="effects" @before-leave="retireSpread" @after-enter="turning = false" @enter-cancelled="turning = false">
        <div :key="spreadIndex" class="passport-spread">
          <section v-for="(page, side) in currentSpread" :key="side" class="passport-page" :aria-label="`护照第 ${spreadIndex * 2 + side + 1} 页`">
          <div class="page-number">JAPAN · 旅の記録 <span>{{ String(spreadIndex * 2 + side + 1).padStart(2, '0') }}</span></div>
          <div class="sticker-grid">
          <button v-for="({ trip, number }) in page" :key="trip.id" class="trip-sticker" type="button" :style="{ '--ink': trip.color }"
            :class="`effect-${trip.effect}`" :aria-label="`${trip.month} ${trip.places}，展开旅行`" aria-haspopup="dialog" @click="openTrip(trip)">
            <span class="sticker-head"><span>旅 JOURNEY RECORD</span><span>No. {{ String(number).padStart(2, '0') }}</span></span>
            <span class="sticker-body"><span class="sticker-text"><span class="trip-date">{{ trip.month }}</span><strong>{{ trip.title }}</strong><span class="trip-subtitle">{{ trip.subtitle }}</span></span>
              <span class="travel-stamp" aria-hidden="true"><span>JAPAN</span><v-icon :icon="trip.icon" size="32"/><span>{{ trip.stamp }}</span></span></span>
            <span class="trip-places">{{ trip.places }}</span>
            <span class="sticker-foot"><span>MEMORIES, NOT MILES.</span><span>打开回忆 ↗</span></span>
            <span class="sticker-effect" aria-hidden="true"><i v-for="n in 5" :key="n" :style="{ '--n': n }">{{ trip.effect === 'snow' ? '❄' : trip.effect === 'petals' ? '✿' : trip.effect === 'lights' ? '✧' : '〜' }}</i></span>
          </button>
          <div v-if="page.length < 2" class="next-memory" :class="{ 'empty-page': !page.length }"><v-icon icon="mdi-airplane-takeoff" size="28"/><span>下一枚印记，留给下一次出发。</span><small>TO BE CONTINUED</small></div>
          </div>
          </section>
        </div>
        </Transition>
        </div>
        <nav v-if="spreads.length > 1" class="book-pagination" tabindex="-1" aria-label="护照翻页" @keydown="handlePageKey">
          <button type="button" aria-controls="passport-current-spread" :disabled="spreadIndex === 0 || turning" @click="turnPage(-1)"><span aria-hidden="true">←</span> 上一页</button>
          <span class="pagination-position" role="status" aria-live="polite" aria-atomic="true">{{ String(spreadIndex + 1).padStart(2, '0') }} / {{ String(spreads.length).padStart(2, '0') }}<small>第 {{ spreadIndex * 2 + 1 }} — {{ spreadIndex * 2 + 2 }} 页</small></span>
          <button type="button" aria-controls="passport-current-spread" :disabled="spreadIndex >= spreads.length - 1 || turning" @click="turnPage(1)">下一页 <span aria-hidden="true">→</span></button>
        </nav>
        <p v-if="spreads.length > 1" class="swipe-hint">左右滑动，翻阅旅程</p>
        <footer class="book-footer"><span>纪念贴纸 · 非官方出入境凭证</span><span>01 — {{ String(trips.length).padStart(2, '0') }}</span></footer>
      </div>
      <aside class="passport-aside">
        <button class="footprint-preview" type="button" aria-label="打开全部日本足迹" aria-haspopup="dialog" @click="openTrip(null)">
          <span class="footprint-eyebrow">THE PLACES WE KEEP</span><span class="footprint-heading">日本足迹 <v-icon size="20">mdi-arrow-top-right</v-icon></span>
          <span class="footprint-map" aria-hidden="true"><JapanPrefectureMap compact :visited-prefectures="allPrefectures"/></span>
          <span class="footprint-caption">{{ allPrefectures.length }} / 47 个都道府县</span><span class="footprint-link">展开全部旅行印记</span>
        </button>
        <div class="passport-note"><span class="eyebrow">ABOUT THIS EDITION</span><p>先收藏到过的地方，<br>再慢慢补上沿途的故事。</p><small>目前按已确认月份展示；详细日期与旅行路线待补充。贴纸名称与印章为纪念设计。</small></div>
        <details v-if="showStandaloneJournal" class="journal-links"><summary>文字游记</summary><p v-if="articlesError">暂时无法加载 <button @click="loadArticles">重试</button></p><p v-else-if="articlesLoading">正在加载…</p><template v-else><router-link v-for="post in articles" :key="post.id" :to="`/blog/${post.slug}`">{{ post.title }} ↗</router-link><p v-if="!articles.length">故事正在整理中。</p></template></details>
      </aside>
    </div>
    <v-dialog v-model="dialog" :max-width="selectedDays.length ? (journeySplit ? 1320 : 920) : 760" aria-label="旅行记忆">
      <v-card class="passport-dialog" :class="{ 'journey-split': journeySplit }">
        <header class="trip-dialog-header"><div><span class="eyebrow">{{ selected ? `JOURNEY / ${selected.month}` : 'ALL JOURNEYS / JAPAN' }}</span><h2>{{ selected?.title || '我的日本足迹' }}</h2></div><v-btn icon="mdi-close" aria-label="关闭旅行" variant="text" @click="dialog = false"/></header>
        <div class="trip-dialog-body">
          <p v-if="detailLoading" class="passport-status" role="status">正在展开旅行…</p>
          <p v-else-if="detailError" class="passport-status" role="alert">旅行暂时无法加载。<button @click="openTrip(selected)">重试</button></p>
          <DailyJourney v-else-if="dialog && selectedDays.length && !showOverview" :key="selected.id" :days="selectedDays" :trip-id="selected.id" :story="selected.story" :map-host="journeyMapHost" :motion-enabled="effects" @layout="journeySplit = $event" />
          <TripOverview v-else-if="dialog && selected" :trip="selected" @begin="beginStory"/>
          <template v-else>
          <div v-if="selected" class="arrival-memory" :class="{ 'animate-stamp': effects }" :style="{ '--ink': selected.color }"><v-icon :icon="selected.icon" size="30"/><span>{{ selected.stamp }}</span><strong>{{ selected.month }}</strong></div>
          <p class="trip-location-text">{{ selected?.places || '收藏旅行中到访过的地方。' }}</p>
          <JapanPrefectureMap v-if="dialog" ref="tripMap" :visited-prefectures="selected?.prefectures || allPrefectures" :active-prefecture="activePlace" @select="name => activePlace = activePlace === name ? '' : name"/>
          <div class="place-chips"><button v-for="place in selected?.prefectures || allPrefectures" :key="place" :aria-pressed="activePlace === place" @click="activePlace = activePlace === place ? '' : place">{{ place }}</button></div>
          <p class="route-note">仅展示到访地区，不代表先后顺序或实际路线。详细日期待补充。</p>
          </template>
        </div>
        <aside ref="journeyMapHost" v-show="journeySplit" class="journey-map-host" aria-label="随游记展开的足迹" />
        <footer v-if="!selected" class="trip-dialog-footer"><span>{{ activePlace || '点击地区查看名称' }}</span><div><v-btn icon="mdi-minus" size="small" variant="text" aria-label="缩小地图" @click="tripMap?.zoomOut()"/><v-btn size="small" variant="text" @click="tripMap?.resetView()">重置</v-btn><v-btn icon="mdi-plus" size="small" variant="text" aria-label="放大地图" @click="tripMap?.zoomIn()"/></div></footer>
      </v-card>
    </v-dialog>
  </section>
</template>

<script setup>
import { ref, onMounted, computed, defineAsyncComponent, nextTick, watch, onBeforeUnmount } from 'vue'
import JapanPrefectureMap from './JapanPrefectureMap.vue'
const TripOverview = defineAsyncComponent(() => import('./TripOverview.vue'))
import { fetchPostPage, fetchJson } from '../utils/api'
import { useMotionPreferences } from '../utils/motion-preferences.js'
import { passportSpreads, latestTrip } from '../utils/passport-layout.js'
const DailyJourney = defineAsyncComponent(() => import('./JourneyStory.vue'))

// Temporarily disabled; retain articles, routes and rendering for future use.
const showStandaloneJournal = false
const { motionEnabled: effects, reducedMotion, toggleMotion } = useMotionPreferences()
const emit = defineEmits(['dialog-change'])
const dialog = ref(false)
watch(dialog, value => emit('dialog-change', value))
const showOverview = ref(true)
const journeySplit = ref(false)
const journeyMapHost = ref(null)
const selected = ref(null)
const detailLoading = ref(false), detailError = ref(false)
let detailController
const details = new Map()
watch(dialog, value => { if (!value) detailController?.abort() })
onBeforeUnmount(() => { detailController?.abort(); emit('dialog-change', false) })
const trips = ref([])
const spreads = computed(() => passportSpreads(trips.value))
const spreadIndex = ref(0)
const currentSpread = computed(() => spreads.value[spreadIndex.value] || [[], []])
const turnDirection = ref('forward')
const turning = ref(false)
function turnPage(step) {
  const target = spreadIndex.value + step
  if (turning.value || target < 0 || target >= spreads.value.length) return
  turnDirection.value = step > 0 ? 'forward' : 'backward'
  turning.value = effects.value
  spreadIndex.value = target
}
let swipe = null
let suppressSwipeClick = false
function startSwipe(event) {
  suppressSwipeClick = false
  if (turning.value || spreads.value.length < 2 || event.pointerType === 'mouse' || !event.isPrimary) return
  swipe = { id: event.pointerId, x: event.clientX, y: event.clientY }
}
function moveSwipe(event) {
  if (!swipe || swipe.id !== event.pointerId) return
  const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y
  if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { cancelSwipe(); return }
  if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.4) {
    suppressSwipeClick = true
    event.currentTarget.setPointerCapture?.(event.pointerId)
  }
}
function endSwipe(event) {
  if (!swipe || swipe.id !== event.pointerId) return
  const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y
  swipe = null
  const threshold = Math.min(80, Math.max(40, event.currentTarget.clientWidth * .12))
  if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.4) {
    suppressSwipeClick = true
    turnPage(dx < 0 ? 1 : -1)
  }
}
function cancelSwipe() { swipe = null }
function guardSwipeClick(event) {
  if (!suppressSwipeClick) return
  event.preventDefault()
  event.stopPropagation()
  suppressSwipeClick = false
}
function retireSpread(element) {
  // Outgoing stickers remain visible during the turn but must not receive input.
  element.inert = true
  element.setAttribute('aria-hidden', 'true')
}
function handlePageKey(event) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
  event.preventDefault()
  // Keep keyboard focus outside the spread that is about to be removed.
  if (!turning.value && ((event.key === 'ArrowLeft' && spreadIndex.value > 0) || (event.key === 'ArrowRight' && spreadIndex.value < spreads.value.length - 1))) {
    event.currentTarget.closest('.passport-book')?.querySelector('.book-pagination')?.focus()
  }
  turnPage(event.key === 'ArrowLeft' ? -1 : 1)
}
watch(() => spreads.value.length, count => { spreadIndex.value = Math.min(spreadIndex.value, Math.max(0, count - 1)) })
watch(effects, enabled => { if (!enabled) turning.value = false })
const latest = computed(() => latestTrip(trips.value))
const passportLoading = ref(true)
const passportError = ref(false)
const selectedDays = computed(() => selected.value?.days || [])
const activePlace = ref('')
const tripMap = ref(null)
const allPrefectures = computed(() => [...new Set(trips.value.flatMap(trip => trip.prefectures))])
const articles = ref([])
const articlesLoading = ref(true)
const articlesError = ref(false)
async function openTrip(trip) {
  detailController?.abort();
  showOverview.value = true; journeySplit.value = false; selected.value = trip; activePlace.value = ''; dialog.value = true;
  detailLoading.value = false; detailError.value = false;
  if (!trip) return;
  if (details.has(trip.id)) { selected.value = details.get(trip.id); return }
  const current = detailController = new AbortController();
  detailLoading.value = true;
  try {
    const data = await fetchJson(`/api/passport?trip=${encodeURIComponent(trip.id)}`, { signal: current.signal });
    if (current.signal.aborted) return;
    const full = data.trips?.find(item => item.id === trip.id);
    if (!full) throw new Error('Missing trip');
    details.set(trip.id, full); selected.value = full;
  } catch { if (!current.signal.aborted) detailError.value = true }
  finally { if (!current.signal.aborted) detailLoading.value = false }
}

async function beginStory() { showOverview.value = false; await nextTick(); document.querySelector('.trip-dialog-body')?.scrollTo({ top: 0 }) }
async function loadPassport() {
  passportLoading.value = true
  passportError.value = false
  try {
    const data = await fetchJson('/api/passport?view=summary')
    if (!Array.isArray(data.trips)) throw new Error('Invalid passport response')
    trips.value = data.trips
  } catch { passportError.value = true }
  finally { passportLoading.value = false }
}
async function loadArticles() {
  articlesLoading.value = true
  articlesError.value = false
  try {
    const result = []
    let cursor = null
    do {
      const page = await fetchPostPage(`/api/blog-list?page_size=100${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`)
      result.push(...page.posts)
      cursor = page.has_more ? page.next_cursor : null
    } while (cursor)
    articles.value = result
  } catch { articlesError.value = true }
  finally { articlesLoading.value = false }
}
onMounted(() => { if (showStandaloneJournal) loadArticles() })
onMounted(loadPassport)
</script>

<style scoped>
.passport-section { margin-top: 12px; container-type:inline-size; container-name:collection; }
.passport-status { padding:24px; border-radius:14px; background:#253b4acc; color:#fff; }
.passport-status button { margin-left:10px; text-decoration:underline; }
.passport-toolbar { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:22px; }
.eyebrow { font-size:9px; letter-spacing:.19em; opacity:.7; }
.passport-toolbar h2 { font-size:clamp(26px,3.5vw,42px); font-weight:500; margin-top:7px; letter-spacing:.02em; text-shadow:0 2px 12px #152437; }
.motion-toggle { border:1px solid #ffffff44; border-radius:24px; padding:9px 13px; background:#253b4ae8; font-size:12px; white-space:nowrap; backdrop-filter:blur(12px); }
.passport-layout { display:grid; grid-template-columns:minmax(0, 1fr) 230px; gap:24px; align-items:start; }
.passport-book { position:relative; min-width:0; color:#354b43; background:#eeeade; border:7px solid #324f4e; border-radius:10px 20px 20px 10px; padding:22px; box-shadow:0 20px 60px #061c3655,3px 4px 0 #e0d9c4,6px 7px 0 #345452; }
.passport-actions { display:flex; flex-wrap:wrap; justify-content:flex-end; gap:10px; }
.latest-trip { background:#f0e8d2; color:#294b43; border-radius:24px; padding:11px 16px; font-size:14px; font-weight:600; }
.motion-toggle:disabled { opacity:.75; cursor:default; }
.passport-stage { display:grid; perspective:1800px; margin-top:22px; touch-action:pan-y pinch-zoom; }
.passport-spread { perspective:1400px; grid-area:1 / 1; position:relative; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); border:1px solid #b9b49f; border-radius:4px 10px 10px 4px; box-shadow:0 3px 0 #d4cdb8; }
.book-pagination { display:flex; justify-content:space-between; align-items:center; gap:12px; margin:22px 0 10px; }
.book-pagination button { min-height:44px; padding:10px 15px; border:1px solid #76877966; border-radius:3px; color:#435e53; background:#faf6e9; font-size:13px; transition:background .2s; }
.book-pagination button:hover:not(:disabled) { background:#e3e7d7; }
.book-pagination button:disabled { opacity:.38; cursor:default; }
.book-pagination button:focus-visible,.book-pagination:focus-visible { outline:2px solid #527c78; outline-offset:4px; }
.pagination-position { text-align:center; font:13px ui-monospace,monospace; letter-spacing:.12em; }
.pagination-position small { display:block; margin-top:6px; font-size:10px; letter-spacing:.02em; color:#647168; }
.page-turn-enter-active,.page-turn-leave-active { pointer-events:none; transition:opacity .6s ease; }
.page-turn-enter-active .passport-page,.page-turn-leave-active .passport-page { backface-visibility:hidden; transition:transform .6s cubic-bezier(.3,.65,.25,1),filter .6s ease; }
.page-turn-enter-active .passport-page:first-child,.page-turn-leave-active .passport-page:first-child { transform-origin:right center; }
.page-turn-enter-active .passport-page:last-child,.page-turn-leave-active .passport-page:last-child { transform-origin:left center; }
.page-turn-leave-active { z-index:2; }
.page-turn-enter-from,.page-turn-leave-to { opacity:0; }
.turn-forward .page-turn-leave-to .passport-page:last-child { transform:rotateY(-105deg); filter:brightness(.78); }
.turn-forward .page-turn-enter-from .passport-page:first-child { transform:rotateY(75deg); filter:brightness(.85); }
.turn-backward .page-turn-leave-to .passport-page:first-child { transform:rotateY(105deg); filter:brightness(.78); }
.turn-backward .page-turn-enter-from .passport-page:last-child { transform:rotateY(-75deg); filter:brightness(.85); }
.passport-spread::after { content:''; pointer-events:none; position:absolute; top:0; bottom:0; left:calc(50% - 10px); width:20px; background:linear-gradient(90deg,transparent,#554d3430 45%,#fff6da88 52%,transparent); }
.passport-page { display:flex; flex-direction:column; container-type:inline-size; container-name:passport-page; min-width:0; padding:18px 20px 24px; background:repeating-linear-gradient(35deg,#507b6808 0 1px,transparent 1px 7px),#f3eedf; }
.passport-page:first-child { border-right:1px solid #b5ac91; }
.page-number { display:flex; justify-content:space-between; gap:6px; padding-bottom:14px; font:10px ui-monospace,monospace; color:#647568; }

.book-heading,.book-footer { display:flex; justify-content:space-between; gap:10px; font-size:8px; letter-spacing:.1em; }
.book-heading { padding-bottom:14px; border-bottom:1px solid #40564b33; }
.passport-intro { display:flex; gap:14px; align-items:center; margin:20px 0 28px; }
.passport-emblem { font-size:38px; color:#6e8270; }
.passport-intro h3 { font-family:Georgia,'Songti SC',serif; font-size:26px; letter-spacing:.15em; font-weight:400; }
.passport-intro p { font-size:14px; margin-top:7px; color:#647168; line-height:1.7; }
.sticker-grid { flex:1; display:grid; grid-template-rows:repeat(2,minmax(210px,1fr)); grid-template-columns:minmax(0,1fr); gap:24px; }
.trip-sticker { position:relative; isolation:isolate; text-align:left; display:block; width:100%; min-width:0; aspect-ratio:auto; padding:14px; overflow-wrap:anywhere; border:1px solid color-mix(in srgb,var(--ink) 40%,transparent); border-radius:3px; background:repeating-linear-gradient(120deg,#64817b08 0 1px,transparent 1px 4px),#faf6e9; color:var(--ink); box-shadow:1px 4px 8px #4c412b20; transform:rotate(-.6deg); transition:transform .25s,box-shadow .25s; }
.trip-sticker:nth-child(even) { transform:rotate(.6deg); }
.trip-sticker:hover,.trip-sticker:focus-visible { transform:translateY(-5px) rotate(0); box-shadow:0 10px 18px #4c412b30; z-index:2; }
.trip-sticker:focus-visible,.motion-toggle:focus-visible,.place-chips button:focus-visible { outline:3px solid #59a7b3; outline-offset:4px; }
.sticker-head,.sticker-foot { display:flex; justify-content:space-between; gap:6px; font:8px ui-monospace,monospace; letter-spacing:.025em; }
.sticker-head { border-bottom:1px solid currentColor; padding-bottom:8px; }
.sticker-body { display:flex; align-items:center; justify-content:space-between; gap:6px; padding:13px 0; }
.sticker-text { display:flex; flex-direction:column; min-width:0; }
.trip-date { font:20px Georgia,serif; letter-spacing:.03em; }
.sticker-text strong { font-size:17px; font-weight:550; margin-top:7px; }
.trip-subtitle { font-size:12px; line-height:1.5; letter-spacing:.03em; margin-top:6px; }
.travel-stamp { flex-shrink:0; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:3px; width:75px; height:75px; border:3px double currentColor; border-radius:50%; transform:rotate(-15deg); opacity:.8; font:7px ui-monospace,monospace; }
.travel-stamp span:last-child { font-size:6px; }
.trip-places { display:block; min-height:35px; font-size:13px; line-height:1.8; }
.sticker-foot { padding-top:9px; border-top:1px dashed currentColor; font-size:10px; }
.next-memory { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:13px; text-align:center; border:1px dashed #6c7c6c66; color:#7c8777; border-radius:4px; padding:22px; font-size:11px; }
.next-memory.empty-page { grid-row:span 2; }
.swipe-hint { display:none; text-align:center; font-size:11px; color:#647168; margin-top:12px; }
@media(pointer:coarse) { .swipe-hint { display:block; } }
.next-memory small { font-size:8px; letter-spacing:.14em; }
.book-footer { border-top:1px solid #40564b33; margin-top:28px; padding-top:12px; }
.sticker-effect { position:absolute; inset:0; overflow:hidden; pointer-events:none; opacity:0; }
.sticker-effect i { position:absolute; left:calc(var(--n) * 17%); top:20%; font-size:20px; font-style:normal; }
.effects-on .trip-sticker:is(:hover,:focus-visible) .sticker-effect { opacity:1; }
.effects-on .trip-sticker:is(:hover,:focus-visible) .sticker-effect i { animation:float-memory 1.6s ease-out both; animation-delay:calc(var(--n) * .07s); }
.effect-steam .sticker-effect i,.effect-cloud .sticker-effect i { font-size:35px; filter:blur(2px); }
@keyframes float-memory { from { opacity:0; transform:translateY(45px) rotate(-15deg); } 30% { opacity:.65; } to { opacity:0; transform:translateY(-30px) rotate(25deg); } }
.passport-aside { display:grid; gap:22px; }
.passport-note { padding:22px; background:#283a43; color:#f3f0e4; border:1px solid #ffffff24; border-radius:18px; }
.passport-note p { font-size:17px; line-height:1.9; margin:12px 0; }
.passport-note small { display:block; font-size:13px; line-height:1.9; opacity:.9; }
.journal-links { background:#1e334877; backdrop-filter:blur(16px); padding:16px; border:1px solid #fff3; border-radius:18px; font-size:12px; }
.journal-links summary { cursor:pointer; }
.journal-links a { display:block; color:inherit; margin-top:14px; line-height:1.8; }
.journal-links p { margin-top:10px; }
.passport-dialog { display:flex; flex-direction:column; max-height:calc(100dvh - 48px); background:#253740 !important; color:#f4f3ea !important; border:1px solid #fff4; border-radius:26px !important; backdrop-filter:none; }
.trip-dialog-header,.trip-dialog-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:18px 24px; flex-shrink:0; }
.trip-dialog-header h2 { font-size:23px; font-weight:500; margin-top:5px; }
.trip-dialog-body { min-height:0; overflow-anchor:none; overflow-y:auto; padding:0 24px 16px; }
.journey-split .trip-dialog-body { margin-right:41%; }
.journey-map-host { position:absolute; right:24px; top:104px; bottom:24px; width:calc(41% - 24px); color:#304b48; background:#f4f1e7; border-radius:18px; padding:16px; overflow:hidden; }
.arrival-memory { display:flex; align-items:center; justify-content:center; gap:14px; background:#eeeade; color:var(--ink); border:4px double var(--ink); padding:15px; margin:10px 0 20px; font:13px Georgia,serif; }
.animate-stamp { animation:stamp-arrival .4s ease-out; }
@keyframes stamp-arrival { from { opacity:0; transform:scale(1.12) rotate(-4deg); } to { opacity:1; transform:scale(1) rotate(0); } }
.trip-location-text { font-size:13px; line-height:1.8; }
.place-chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }
.place-chips button { border:1px solid #ffffff44; padding:7px 11px; border-radius:18px; font-size:12px; }
.place-chips button[aria-pressed=true] { background:#eee3ad; color:#27353f; }
.route-note { font-size:11px; opacity:.7; line-height:1.8; margin-top:14px; }
.trip-dialog-footer { border-top:1px solid #fff2; padding:10px 20px; font-size:12px; }
@container collection (max-width:1050px) { .passport-layout { grid-template-columns:minmax(0,1fr); } .passport-aside { grid-template-columns:repeat(2,minmax(0,1fr)); align-items:start; } }
@container passport-page (max-width:230px) {
  .trip-sticker { aspect-ratio:1; padding:10px; transform:none; }
  .sticker-body { display:grid; grid-template-columns:1fr; padding:9px 0; }
  .sticker-text strong { font-size:15px; line-height:1.5; }
  .trip-date { font-size:22px; }
  .travel-stamp { width:44px; height:44px; border-width:2px; margin:5px 0 0 auto; }
  .travel-stamp :deep(.v-icon) { font-size:22px !important; }
  .travel-stamp span { display:none; }
  .trip-subtitle { font-size:11px; }
  .sticker-head { font-size:8px; flex-wrap:wrap; }
  .sticker-foot { font-size:12px; }
  .sticker-foot > span:first-child { display:none; }
  .trip-places { font-size:12px; min-height:0; }
  .next-memory { padding:12px 6px; font-size:12px; }
  .next-memory small { display:none; }
}
@media(max-width:600px) {
  .passport-toolbar { align-items:flex-start; flex-direction:column; }
  .passport-actions { justify-content:flex-start; }
  .passport-book { padding:12px 4px; border-width:4px; }
  .book-heading,.book-footer { font-size:9px; padding-left:8px; padding-right:8px; }
  .passport-intro { padding:0 8px; gap:8px; }
  .passport-intro p { font-size:13px; }
  .passport-page { padding:10px 8px 16px; }
  .page-number { font-size:8px; }
  .passport-spread::after { left:calc(50% - 5px); width:10px; }
  .passport-aside { grid-template-columns:minmax(0,1fr); }
  .trip-dialog-body { padding:0 14px 14px; }
  .trip-dialog-header { padding:16px; }
}
@media(prefers-reduced-motion:reduce) { *,*::before,*::after { animation:none !important; transition:none !important; } .sticker-effect { display:none; } }
</style>

