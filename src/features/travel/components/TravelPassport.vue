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
    <TripDialog v-model="dialog" :selected="selected" :detail-loading="detailLoading" :detail-error="detailError" :effects="effects" :all-prefectures="allPrefectures" @retry="openTrip(selected)" />
  </section>
</template>

<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import JapanPrefectureMap from '../../../shared/components/geography/JapanPrefectureMap.vue'
import TripDialog from './TripDialog.vue'
import { useJournalLinks } from '../../blog/composables/useJournalLinks.js'
import { usePassportData } from '../composables/usePassportData.js'
import { usePassportNavigation } from '../composables/usePassportNavigation.js'
import { useMotionPreferences } from '../../../shared/composables/useMotionPreferences.js'
import { passportSpreads, latestTrip } from '../domain/passport-layout.js'

// Temporarily disabled; retain articles, routes and rendering for future use.
const showStandaloneJournal = false
const { motionEnabled: effects, reducedMotion, toggleMotion } = useMotionPreferences()
const emit = defineEmits(['dialog-change'])
const dialog = ref(false)
watch(dialog, value => emit('dialog-change', value))
const {
  trips, selected, detailLoading, detailError, passportLoading, passportError,
  loadPassport, selectTrip, cancelDetail,
} = usePassportData()
watch(dialog, value => { if (!value) cancelDetail() })
onBeforeUnmount(() => emit('dialog-change', false))
const spreads = computed(() => passportSpreads(trips.value))
const {
  spreadIndex, currentSpread, turnDirection, turning, turnPage,
  startSwipe, moveSwipe, endSwipe, cancelSwipe, guardSwipeClick, retireSpread, handlePageKey,
} = usePassportNavigation(spreads, effects)
const latest = computed(() => latestTrip(trips.value))
const allPrefectures = computed(() => [...new Set(trips.value.flatMap(trip => trip.prefectures))])
const { articles, articlesLoading, articlesError, loadArticles } = useJournalLinks()
function openTrip(trip) {
  dialog.value = true
  return selectTrip(trip)
}

onMounted(() => { if (showStandaloneJournal) loadArticles() })
onMounted(loadPassport)
</script>

<style scoped src="../styles/passport.css"></style>
