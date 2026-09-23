<template>
  <section class="passport-section" aria-label="旅行护照">
    <header class="passport-toolbar">
      <div><span class="eyebrow">A PERSONAL COLLECTION</span><h2>把旅途，留在这一页。</h2></div>
      <button class="motion-toggle" type="button" :aria-pressed="effects" @click="effects = !effects">{{ effects ? '✧ 彩蛋已开启' : '彩蛋已关闭' }}</button>
    </header>
    <p v-if="passportLoading" class="passport-status" role="status">正在翻开旅行护照…</p>
    <p v-else-if="passportError" class="passport-status" role="alert">旅行护照暂时无法加载。<button @click="loadPassport">重新加载</button></p>
    <p v-else-if="!trips.length" class="passport-status">旅行记忆正在整理中。</p>
    <div v-else class="passport-layout">
      <div class="passport-book" :class="{ 'effects-on': effects }">
        <div class="book-heading"><span>RINNA / TRAVEL PASSPORT</span><span>日本 · 私人旅行收藏</span></div>
        <div class="passport-intro"><span class="passport-emblem">✳</span><div><h3>旅の記録</h3><p>{{ trips.length }} 次出发，{{ trips.length }} 枚回忆。点一张贴纸，重访那段旅程。</p></div></div>
        <div class="sticker-grid">
          <button v-for="(trip, index) in trips" :key="trip.id" class="trip-sticker" type="button" :style="{ '--ink': trip.color }"
            :class="`effect-${trip.effect}`" :aria-label="`${trip.month} ${trip.places}，展开旅行`" aria-haspopup="dialog" @click="openTrip(trip)">
            <span class="sticker-head"><span>旅 JOURNEY RECORD</span><span>No. {{ String(index + 1).padStart(2, '0') }}</span></span>
            <span class="sticker-body"><span class="sticker-text"><span class="trip-date">{{ trip.month }}</span><strong>{{ trip.title }}</strong><span class="trip-subtitle">{{ trip.subtitle }}</span></span>
              <span class="travel-stamp" aria-hidden="true"><span>JAPAN</span><v-icon :icon="trip.icon" size="32"/><span>{{ trip.stamp }}</span></span></span>
            <span class="trip-places">{{ trip.places }}</span>
            <span class="sticker-foot"><span>MEMORIES, NOT MILES.</span><span>打开回忆 ↗</span></span>
            <span class="sticker-effect" aria-hidden="true"><i v-for="n in 5" :key="n" :style="{ '--n': n }">{{ trip.effect === 'snow' ? '❄' : trip.effect === 'petals' ? '✿' : trip.effect === 'lights' ? '✧' : '〜' }}</i></span>
          </button>
          <div class="next-memory"><v-icon icon="mdi-airplane-takeoff" size="28"/><span>下一枚印记，留给下一次出发。</span><small>TO BE CONTINUED</small></div>
        </div>
        <footer class="book-footer"><span>纪念贴纸 · 非官方出入境凭证</span><span>01 — {{ String(trips.length).padStart(2, '0') }}</span></footer>
      </div>
      <aside class="passport-aside">
        <button class="footprint-preview" type="button" aria-label="打开全部日本足迹" aria-haspopup="dialog" @click="openTrip(null)">
          <span class="footprint-eyebrow">THE PLACES WE KEEP</span><span class="footprint-heading">日本足迹 <v-icon size="20">mdi-arrow-top-right</v-icon></span>
          <span class="footprint-map" aria-hidden="true"><JapanPrefectureMap compact :visited-prefectures="allPrefectures"/></span>
          <span class="footprint-caption">{{ allPrefectures.length }} / 47 个都道府县</span><span class="footprint-link">展开全部旅行印记</span>
        </button>
        <div class="passport-note"><span class="eyebrow">ABOUT THIS EDITION</span><p>先收藏到过的地方，<br>再慢慢补上沿途的故事。</p><small>目前按已确认月份展示；详细日期与旅行路线待补充。贴纸名称与印章为纪念设计。</small></div>
        <details class="journal-links"><summary>文字游记</summary><p v-if="articlesError">暂时无法加载 <button @click="loadArticles">重试</button></p><p v-else-if="articlesLoading">正在加载…</p><template v-else><router-link v-for="post in articles" :key="post.id" :to="`/blog/${post.slug}`">{{ post.title }} ↗</router-link><p v-if="!articles.length">故事正在整理中。</p></template></details>
      </aside>
    </div>
    <v-dialog v-model="dialog" :max-width="selectedDays.length ? 920 : 760" aria-label="旅行记忆">
      <v-card class="passport-dialog">
        <header class="trip-dialog-header"><div><span class="eyebrow">{{ selected ? `JOURNEY / ${selected.month}` : 'ALL JOURNEYS / JAPAN' }}</span><h2>{{ selected?.title || '我的日本足迹' }}</h2></div><v-btn icon="mdi-close" aria-label="关闭旅行" variant="text" @click="dialog = false"/></header>
        <div class="trip-dialog-body">
          <DailyJourney v-if="dialog && selectedDays.length" :key="selected.id" :days="selectedDays" />
          <template v-else>
          <div v-if="selected" class="arrival-memory" :class="{ 'animate-stamp': effects }" :style="{ '--ink': selected.color }"><v-icon :icon="selected.icon" size="30"/><span>{{ selected.stamp }}</span><strong>{{ selected.month }}</strong></div>
          <p class="trip-location-text">{{ selected?.places || '收藏旅行中到访过的地方。' }}</p>
          <JapanPrefectureMap v-if="dialog" ref="tripMap" :visited-prefectures="selected?.prefectures || allPrefectures" :active-prefecture="activePlace" @select="name => activePlace = activePlace === name ? '' : name"/>
          <div class="place-chips"><button v-for="place in selected?.prefectures || allPrefectures" :key="place" :aria-pressed="activePlace === place" @click="activePlace = activePlace === place ? '' : place">{{ place }}</button></div>
          <p class="route-note">仅展示到访地区，不代表先后顺序或实际路线。详细日期待补充。</p>
          </template>
        </div>
        <footer v-if="!selectedDays.length" class="trip-dialog-footer"><span>{{ activePlace || '点击地区查看名称' }}</span><div><v-btn icon="mdi-minus" size="small" variant="text" aria-label="缩小地图" @click="tripMap?.zoomOut()"/><v-btn size="small" variant="text" @click="tripMap?.resetView()">重置</v-btn><v-btn icon="mdi-plus" size="small" variant="text" aria-label="放大地图" @click="tripMap?.zoomIn()"/></div></footer>
      </v-card>
    </v-dialog>
  </section>
</template>

<script setup>
import { ref, onMounted, computed, defineAsyncComponent } from 'vue'
import JapanPrefectureMap from './JapanPrefectureMap.vue'
import { fetchPostPage, fetchJson } from '../utils/api'
const DailyJourney = defineAsyncComponent(() => import('./DailyJourney.vue'))

const effects = ref(true)
const dialog = ref(false)
const selected = ref(null)
const trips = ref([])
const passportLoading = ref(true)
const passportError = ref(false)
const selectedDays = computed(() => selected.value?.days || [])
const activePlace = ref('')
const tripMap = ref(null)
const allPrefectures = computed(() => [...new Set(trips.value.flatMap(trip => trip.prefectures))])
const articles = ref([])
const articlesLoading = ref(true)
const articlesError = ref(false)
function openTrip(trip) { selected.value = trip; activePlace.value = ''; dialog.value = true }
async function loadPassport() {
  passportLoading.value = true
  passportError.value = false
  try {
    const data = await fetchJson('/api/passport')
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
onMounted(loadArticles)
onMounted(loadPassport)
</script>

<style scoped>
.passport-section { margin-top: 32px; }
.passport-status { padding:24px; border-radius:14px; background:#253b4acc; color:#fff; }
.passport-status button { margin-left:10px; text-decoration:underline; }
.passport-toolbar { display:flex; align-items:center; justify-content:space-between; gap:16px; margin-bottom:22px; }
.eyebrow { font-size:9px; letter-spacing:.19em; opacity:.7; }
.passport-toolbar h2 { font-size:23px; font-weight:500; margin-top:7px; letter-spacing:.02em; text-shadow:0 2px 12px #152437; }
.motion-toggle { border:1px solid #ffffff44; border-radius:24px; padding:9px 13px; background:#253b4a88; font-size:11px; white-space:nowrap; backdrop-filter:blur(12px); }
.passport-layout { display:grid; grid-template-columns:minmax(0, 1fr) 250px; gap:24px; align-items:start; }
.passport-book { position:relative; color:#394c4b; background:linear-gradient(90deg,#b7ac9422,transparent 4%,transparent 49%,#54482c16 50%,transparent 51%),repeating-linear-gradient(35deg,#507b6810 0 1px,transparent 1px 7px),#eeeade; border:7px solid #324f4e; border-left:12px solid #263e3d; border-radius:8px 22px 22px 8px; padding:24px; box-shadow:inset 3px 0 10px #162f3922,0 20px 60px #061c3655,3px 4px 0 #e0d9c4,6px 7px 0 #345452; }
.book-heading,.book-footer { display:flex; justify-content:space-between; gap:10px; font-size:8px; letter-spacing:.1em; }
.book-heading { padding-bottom:14px; border-bottom:1px solid #40564b33; }
.passport-intro { display:flex; gap:14px; align-items:center; margin:20px 0 28px; }
.passport-emblem { font-size:38px; color:#6e8270; }
.passport-intro h3 { font-family:Georgia,'Songti SC',serif; font-size:26px; letter-spacing:.15em; font-weight:400; }
.passport-intro p { font-size:11px; margin-top:7px; color:#647168; line-height:1.7; }
.sticker-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:20px 16px; }
.trip-sticker { position:relative; isolation:isolate; text-align:left; display:block; width:100%; padding:13px; border:1px solid color-mix(in srgb,var(--ink) 40%,transparent); border-radius:3px; background:repeating-linear-gradient(120deg,#64817b08 0 1px,transparent 1px 4px),#faf6e9; color:var(--ink); box-shadow:1px 4px 8px #4c412b20; transform:rotate(-1.5deg); transition:transform .25s,box-shadow .25s; }
.trip-sticker:nth-child(even) { transform:rotate(1.7deg); }
.trip-sticker:hover,.trip-sticker:focus-visible { transform:translateY(-5px) rotate(0); box-shadow:0 10px 18px #4c412b30; z-index:2; }
.trip-sticker:focus-visible,.motion-toggle:focus-visible,.place-chips button:focus-visible { outline:3px solid #59a7b3; outline-offset:4px; }
.sticker-head,.sticker-foot { display:flex; justify-content:space-between; gap:6px; font:8px ui-monospace,monospace; letter-spacing:.025em; }
.sticker-head { border-bottom:1px solid currentColor; padding-bottom:8px; }
.sticker-body { display:flex; align-items:center; justify-content:space-between; gap:6px; padding:13px 0; }
.sticker-text { display:flex; flex-direction:column; min-width:0; }
.trip-date { font:20px Georgia,serif; letter-spacing:.03em; }
.sticker-text strong { font-size:17px; font-weight:550; margin-top:7px; }
.trip-subtitle { font-size:7px; letter-spacing:.08em; margin-top:6px; }
.travel-stamp { flex-shrink:0; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:3px; width:75px; height:75px; border:3px double currentColor; border-radius:50%; transform:rotate(-15deg); opacity:.8; font:7px ui-monospace,monospace; }
.travel-stamp span:last-child { font-size:6px; }
.trip-places { display:block; min-height:35px; font-size:10px; line-height:1.8; }
.sticker-foot { padding-top:9px; border-top:1px dashed currentColor; font-size:7px; }
.next-memory { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:13px; text-align:center; border:1px dashed #6c7c6c66; color:#7c8777; border-radius:4px; padding:22px; font-size:11px; }
.next-memory small { font-size:8px; letter-spacing:.14em; }
.book-footer { border-top:1px solid #40564b33; margin-top:28px; padding-top:12px; }
.sticker-effect { position:absolute; inset:0; overflow:hidden; pointer-events:none; opacity:0; }
.sticker-effect i { position:absolute; left:calc(var(--n) * 17%); top:20%; font-size:20px; font-style:normal; }
.effects-on .trip-sticker:is(:hover,:focus-visible) .sticker-effect { opacity:1; }
.effects-on .trip-sticker:is(:hover,:focus-visible) .sticker-effect i { animation:float-memory 1.6s ease-out both; animation-delay:calc(var(--n) * .07s); }
.effect-steam .sticker-effect i,.effect-cloud .sticker-effect i { font-size:35px; filter:blur(2px); }
@keyframes float-memory { from { opacity:0; transform:translateY(45px) rotate(-15deg); } 30% { opacity:.65; } to { opacity:0; transform:translateY(-30px) rotate(25deg); } }
.passport-aside { display:grid; gap:22px; }
.passport-note { padding:18px 6px; text-shadow:0 2px 10px #102030; }
.passport-note p { font-size:17px; line-height:1.9; margin:12px 0; }
.passport-note small { display:block; font-size:11px; line-height:1.9; opacity:.8; }
.journal-links { background:#1e334877; backdrop-filter:blur(16px); padding:16px; border:1px solid #fff3; border-radius:18px; font-size:12px; }
.journal-links summary { cursor:pointer; }
.journal-links a { display:block; color:inherit; margin-top:14px; line-height:1.8; }
.journal-links p { margin-top:10px; }
.passport-dialog { display:flex; flex-direction:column; max-height:calc(100dvh - 48px); background:#253340eF !important; color:#f4f3ea !important; border:1px solid #fff4; border-radius:26px !important; backdrop-filter:blur(24px); }
.trip-dialog-header,.trip-dialog-footer { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:18px 24px; flex-shrink:0; }
.trip-dialog-header h2 { font-size:23px; font-weight:500; margin-top:5px; }
.trip-dialog-body { overflow-y:auto; padding:0 24px 16px; }
.arrival-memory { display:flex; align-items:center; justify-content:center; gap:14px; background:#eeeade; color:var(--ink); border:4px double var(--ink); padding:15px; margin:10px 0 20px; font:13px Georgia,serif; }
.animate-stamp { animation:stamp-arrival .4s ease-out; }
@keyframes stamp-arrival { from { opacity:0; transform:scale(1.12) rotate(-4deg); } to { opacity:1; transform:scale(1) rotate(0); } }
.trip-location-text { font-size:13px; line-height:1.8; }
.place-chips { display:flex; flex-wrap:wrap; gap:8px; margin-top:16px; }
.place-chips button { border:1px solid #ffffff44; padding:7px 11px; border-radius:18px; font-size:12px; }
.place-chips button[aria-pressed=true] { background:#eee3ad; color:#27353f; }
.route-note { font-size:11px; opacity:.7; line-height:1.8; margin-top:14px; }
.trip-dialog-footer { border-top:1px solid #fff2; padding:10px 20px; font-size:12px; }
@media(max-width:1200px) { .passport-layout { grid-template-columns:minmax(0,1fr) 220px; gap:18px; } .sticker-grid { grid-template-columns:1fr; } }
@media(max-width:959px) { .passport-layout { grid-template-columns:1fr; } .sticker-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:600px) { .passport-toolbar { align-items:flex-start; } .passport-toolbar h2 { font-size:19px; } .motion-toggle { padding:8px; font-size:10px; } .passport-book { padding:20px 16px; border-width:5px; border-left-width:8px; } .sticker-grid { grid-template-columns:1fr; gap:20px; } .travel-stamp { width:88px; height:88px; } .trip-date { font-size:25px; } .trip-places { min-height:25px; } .book-heading { font-size:7px; } .trip-dialog-body { padding:0 14px 14px; } .trip-dialog-header { padding:16px; } .arrival-memory { gap:9px; font-size:10px; } }
@media(prefers-reduced-motion:reduce) { *,*::before,*::after { animation:none !important; transition:none !important; } .sticker-effect { display:none; } }
</style>
