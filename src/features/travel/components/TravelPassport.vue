<template>
  <section class="passport-section" aria-label="旅行护照">
    <header class="passport-toolbar">
      <span class="collection-caption">{{ country.name }} · 私人旅行收藏<span v-if="trips.length"> / {{ trips.length }} 次出发</span></span>
      <div class="passport-actions"><button v-if="latest" class="latest-trip" @click="openTrip(latest)">最近旅程 · {{ latest.month }} ↗</button><button class="motion-toggle" type="button" :aria-pressed="effects" :disabled="reducedMotion" @click="toggleMotion">{{ reducedMotion ? '已跟随系统减少动态' : effects ? '动态效果：开' : '动态效果：关' }}</button></div>
    </header>
    <p v-if="passportLoading" class="passport-status" role="status">正在翻开旅行护照…</p>
    <p v-else-if="passportError" class="passport-status" role="alert">旅行护照暂时无法加载。<button @click="loadPassport">重新加载</button></p>
    <p v-else-if="!trips.length" class="passport-status">{{ country.name }}暂无旅行记录，留给下一次出发。</p>
    <p v-if="missing" class="passport-status" role="alert">这段旅程不在当前国家的收藏里。<RouterLink :to="`/travel/${country.id}`">返回国家收藏</RouterLink></p>
    <div v-if="!passportLoading && !passportError && trips.length" class="passport-layout">
      <div class="passport-volume" :style="pageStackStyle">
      <div class="passport-book" :class="{ 'effects-on': effects, 'has-left-stack': pageStacks.leftLeaves > 0, 'has-right-stack': pageStacks.rightLeaves > 0 }">
        <div id="passport-current-spread" class="passport-stage" :class="`turn-${turnDirection}`" @keydown="handlePageKey"
          @pointerdown="startSwipe" @pointermove="moveSwipe" @pointerup="endSwipe" @pointercancel="cancelSwipe" @lostpointercapture="cancelSwipe" @click.capture="guardSwipeClick">
        <div class="passport-spread" :inert="Boolean(turnLayer) || undefined" :aria-hidden="Boolean(turnLayer) || undefined">
          <PassportPage v-for="(page, side) in displayedSpread" :key="side" :page="page" :side="side" :page-number="displayedIndex * 2 + side + 1" :country="country" :effects="effects" @open="openTrip" />
        </div>
        <template v-if="turnLayer">
          <PassportPage class="flip-stationary" :class="{ 'on-right': turnLayer.stationarySide === 1 }" :page="turnLayer.stationary" :side="turnLayer.stationarySide" :page-number="turnLayer.stationaryNumber" :country="country" decorative />
          <div class="flip-leaf" :class="{ 'is-settling': turning, 'is-returning': returning }" :style="turnStyle" aria-hidden="true" inert @animationend.self="finishTurn">
            <div class="leaf-face leaf-front" :class="turnLayer.frontSide === 0 ? 'face-left' : 'face-right'"><PassportPage :page="turnLayer.front" :side="turnLayer.frontSide" :page-number="turnLayer.frontNumber" :country="country" decorative /></div>
            <div class="leaf-face leaf-back" :class="turnLayer.backSide === 0 ? 'face-left' : 'face-right'"><PassportPage :page="turnLayer.back" :side="turnLayer.backSide" :page-number="turnLayer.backNumber" :country="country" decorative /></div>
          </div>
        </template>
        </div>
      </div>
        <nav v-if="spreads.length > 1" class="book-pagination" tabindex="-1" aria-label="护照翻页" @keydown="handlePageKey">
          <button type="button" aria-controls="passport-current-spread" :disabled="spreadIndex === 0 || turning" @click="turnPage(-1)"><span aria-hidden="true">←</span> 上一页</button>
          <span class="pagination-position" role="status" aria-live="polite" aria-atomic="true">{{ String(spreadIndex + 1).padStart(2, '0') }} / {{ String(spreads.length).padStart(2, '0') }}<small>第 {{ spreadIndex * 2 + 1 }} — {{ spreadIndex * 2 + 2 }} 页</small></span>
          <button type="button" aria-controls="passport-current-spread" :disabled="spreadIndex >= spreads.length - 1 || turning" @click="turnPage(1)">下一页 <span aria-hidden="true">→</span></button>
        </nav>
        <p v-if="spreads.length > 1" class="swipe-hint">左右滑动，翻阅旅程</p>
      </div>
      <aside class="passport-aside">
        <button v-if="country.map === 'japan'" class="footprint-preview" type="button" :aria-label="`打开全部${country.name}足迹`" aria-haspopup="dialog" @click="openTrip(null)">
          <span class="footprint-eyebrow">THE PLACES WE KEEP</span><span class="footprint-heading">{{ country.name }}足迹 <v-icon size="20">mdi-arrow-top-right</v-icon></span>
          <span class="footprint-map" aria-hidden="true"><JapanPrefectureMap compact palette="paper" :visited-prefectures="allPrefectures"/></span>
          <span class="footprint-caption">{{ allPrefectures.length }} / 47 个都道府县</span><span class="footprint-link">展开全部旅行印记</span>
        </button>
        <div class="passport-note"><span class="eyebrow">A NOTE FROM RINNA</span><span class="note-flower" aria-hidden="true">✳</span><p>先收藏到过的地方，<br>再慢慢补上沿途的故事。</p><small>目前按已确认月份展示；详细日期与旅行路线待补充。贴纸名称与印章为纪念设计。</small><span class="note-signature">Rinna</span></div>
        <details v-if="showStandaloneJournal" class="journal-links"><summary>文字游记</summary><p v-if="articlesError">暂时无法加载 <button @click="loadArticles">重试</button></p><p v-else-if="articlesLoading">正在加载…</p><template v-else><router-link v-for="post in articles" :key="post.id" :to="`/blog/${post.slug}`">{{ post.title }} ↗</router-link><p v-if="!articles.length">故事正在整理中。</p></template></details>
      </aside>
    </div>
    <TripDialog v-model="dialog" :country="country" :selected="selected" :detail-loading="detailLoading" :detail-error="detailError" :effects="effects" :all-prefectures="allPrefectures" @retry="openTrip(selected)" />
  </section>
</template>

<script setup>
import { onMounted, computed, watch, onBeforeUnmount, inject, toRef } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import JapanPrefectureMap from '../../../shared/components/geography/JapanPrefectureMap.vue'
import TripDialog from './TripDialog.vue'
import PassportPage from './PassportPage.vue'
import { useJournalLinks } from '../../blog/composables/useJournalLinks.js'
import { usePassportData } from '../composables/usePassportData.js'
import { usePassportNavigation } from '../composables/usePassportNavigation.js'
import { useMotionPreferences } from '../../../shared/composables/useMotionPreferences.js'
import { passportSpreads, latestTrip, passportPageStacks } from '../domain/passport-layout.js'
import { countryTrips, countries } from '../domain/countries.js'
import { travelDataKey } from '../composables/travel-context.js'
import { useTripRoute } from '../composables/useTripRoute.js'

const props = defineProps({ country: { type: Object, default: () => countries.find(c => c.id === 'jp') }, region: { type: String, default: '' } })

// Temporarily disabled; retain articles, routes and rendering for future use.
const showStandaloneJournal = false
const { motionEnabled: effects, reducedMotion, toggleMotion } = useMotionPreferences()
const emit = defineEmits(['dialog-change'])
const sharedData = inject(travelDataKey, null)
const {
  trips: sourceTrips, selected, detailLoading, detailError, passportLoading, passportError,
  loadPassport, selectTrip, cancelDetail,
} = sharedData || usePassportData()
const tripsInCountry = computed(() => countryTrips(sourceTrips.value, props.country.id))
const trips = computed(() => props.region ? tripsInCountry.value.filter(trip => (trip.region || trip.city || '地区待整理') === props.region) : tripsInCountry.value)
const { dialog, missing, openTrip } = useTripRoute({ route: useRoute(), router: useRouter(), country: toRef(props, 'country'), trips: tripsInCountry, loading: passportLoading, selectTrip, cancelDetail })
watch(dialog, value => emit('dialog-change', value))
watch(dialog, value => { if (!value) cancelDetail() })
onBeforeUnmount(() => emit('dialog-change', false))
const spreads = computed(() => passportSpreads(trips.value))
const {
  spreadIndex, currentSpread, turnDirection, turning, returning, dragProgress, duration, turnLayer, turnPage, finishTurn,
  startSwipe, moveSwipe, endSwipe, cancelSwipe, guardSwipeClick, handlePageKey,
} = usePassportNavigation(spreads, effects)
const displayedSpread = computed(() => turnLayer.value?.base || currentSpread.value)
const displayedIndex = computed(() => turnLayer.value?.baseIndex ?? spreadIndex.value)
const turnStyle = computed(() => {
  const sign = turnDirection.value === 'forward' ? -1 : 1
  return {
    '--drag-angle': sign * dragProgress.value * 180 + 'deg',
    '--end-angle': (returning.value ? 0 : sign * 180) + 'deg',
    '--turn-duration': duration.value + 'ms',
  }
})
const pageStacks = computed(() => passportPageStacks(spreads.value.length, spreadIndex.value))
const pageStackStyle = computed(() => {
  const stack = pageStacks.value
  return {
    '--stack-left': `${stack.leftDepth}px`, '--stack-right': `${stack.rightDepth}px`,
    '--stack-left-visible': stack.leftLeaves ? 1 : 0,
    '--stack-right-visible': stack.rightLeaves ? 1 : 0,
    '--stack-space': `${Math.min(12, Math.max(0, spreads.value.length - 1) * 1.5)}px`,
  }
})
const latest = computed(() => latestTrip(trips.value))

const allPrefectures = computed(() => [...new Set(trips.value.flatMap(trip => trip.prefectures || []))])
const { articles, articlesLoading, articlesError, loadArticles } = useJournalLinks()

onMounted(() => { if (showStandaloneJournal) loadArticles() })
onMounted(() => { if (!sharedData) loadPassport() })
</script>

<style scoped src="../styles/passport.css"></style>
