<template>
<v-dialog v-model="open" :max-width="selectedDays.length ? (journeySplit ? 1320 : 920) : 760" :scrim="'#243e35'" :opacity=".24" :class="{ 'journey-reader-overlay': Boolean(selected) }" aria-label="旅行记忆">
      <v-card class="passport-dialog memory-glass" :class="{ 'journey-split': journeySplit, 'footprint-glass': isFootprint, 'journey-reader': Boolean(selected) }">
        <header class="trip-dialog-header"><div><span class="eyebrow">{{ selected ? `JOURNEY / ${selected.month}` : `ALL JOURNEYS / ${country.label}` }}</span><h2>{{ selected?.title || `我的${country.name}足迹` }}</h2></div><v-btn icon="mdi-close" aria-label="关闭旅行" variant="text" @click="open = false"/></header>
        <div ref="body" class="trip-dialog-body">
          <p v-if="detailLoading" class="passport-status" role="status">正在展开旅行…</p>
          <p v-else-if="detailError" class="passport-status" role="alert">旅行暂时无法加载。<button @click="$emit('retry')">重试</button></p>
          <JourneyStory v-else-if="open && selectedDays.length && !showOverview" :key="selected.id" :days="selectedDays" :trip-id="selected.id" :story="selected.story" :map-host="journeyMapHost" :motion-enabled="effects" @layout="journeySplit = $event" />
          <TripOverview v-else-if="open && selected" :trip="selected" :map-enabled="country.map === 'japan'" @begin="beginStory"/>
          <template v-else>
          <div v-if="selected" class="arrival-memory" :class="{ 'animate-stamp': effects }" :style="{ '--ink': selected.color }"><v-icon :icon="selected.icon" size="30"/><span>{{ selected.stamp }}</span><strong>{{ selected.month }}</strong></div>
          <p class="trip-location-text">{{ selected?.places || '收藏旅行中到访过的地方。' }}</p>
          <JapanPrefectureMap v-if="open && country.map === 'japan'" ref="tripMap" :palette="isFootprint ? 'paper' : 'dark'" :visited-prefectures="selected?.prefectures || allPrefectures" :active-prefecture="activePlace" @select="name => activePlace = activePlace === name ? '' : name"/>
          <div class="place-chips"><button v-for="place in selected?.prefectures || allPrefectures" :key="place" :aria-pressed="activePlace === place" @click="activePlace = activePlace === place ? '' : place">{{ place }}</button></div>
          <p class="route-note">仅展示到访地区，不代表先后顺序或实际路线。详细日期待补充。</p>
          </template>
        </div>
        <aside ref="journeyMapHost" v-show="journeySplit" class="journey-map-host" aria-label="随游记展开的足迹" />
        <footer v-if="!selected && country.map === 'japan'" class="trip-dialog-footer"><span>{{ activePlace || '点击地区查看名称' }}</span><div><v-btn icon="mdi-minus" size="small" variant="text" aria-label="缩小地图" @click="tripMap?.zoomOut()"/><v-btn size="small" variant="text" @click="tripMap?.resetView()">重置</v-btn><v-btn icon="mdi-plus" size="small" variant="text" aria-label="放大地图" @click="tripMap?.zoomIn()"/></div></footer>
      </v-card>
    </v-dialog>
</template>
<script setup>
import { ref, computed, watch, nextTick, defineAsyncComponent } from 'vue'
import JapanPrefectureMap from '../../../shared/components/geography/JapanPrefectureMap.vue'
const TripOverview = defineAsyncComponent(() => import('./TripOverview.vue'))
const JourneyStory = defineAsyncComponent(() => import('./JourneyStory.vue'))
const props = defineProps({ selected: Object, detailLoading: Boolean, detailError: Boolean, effects: Boolean, allPrefectures: Array, country: { type: Object, default: () => ({ id: 'jp', name: '日本', label: 'JAPAN', map: 'japan' }) } })
const open = defineModel({ type: Boolean, default: false })
const isFootprint = computed(() => !props.selected && props.country.map === 'japan')
defineEmits(['retry'])
const selectedDays = computed(() => props.selected?.days || [])
const showOverview = ref(true), journeySplit = ref(false), activePlace = ref('')
const journeyMapHost = ref(null), tripMap = ref(null), body = ref(null)
watch([open, () => props.selected?.id], () => {
  showOverview.value = true
  journeySplit.value = false
  activePlace.value = ''
})
async function beginStory() {
  showOverview.value = false
  await nextTick()
  body.value?.scrollTo({ top: 0 })
}
</script>
<style scoped src="../styles/trip-dialog.css"></style>
