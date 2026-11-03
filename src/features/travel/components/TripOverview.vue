<template>
  <section class="trip-overview" aria-label="旅行概览">
    <div class="overview-stamp" :style="{ color: trip.color }"><v-icon :icon="trip.icon" size="28"/><span>{{ trip.stamp }}</span><strong>{{ trip.month }}</strong></div>
    <p class="destinations">{{ trip.places }}</p>
    <JapanPrefectureMap overview :visited-prefectures="trip.prefectures" :landmarks="landmarks"/>
    <dl class="trip-details">
      <div><dt>游玩日期</dt><dd>{{ dateLabel }}<small v-if="dates.length">按已整理的每日记录显示</small></dd></div>
      <div><dt>到访地区</dt><dd>{{ trip.prefectures.join(' · ') }}</dd></div>
    </dl>
    <button v-if="trip.days?.length" class="begin-story" @click="$emit('begin')">翻开序言 →</button>
  </section>
</template>
<script setup>
import { computed } from 'vue'
import JapanPrefectureMap from '../../../shared/components/geography/JapanPrefectureMap.vue'
import { tripLandmarks } from '../data/trip-landmarks.js'
const props = defineProps({ trip: { type: Object, required: true } })
defineEmits(['begin'])
const landmarks = computed(() => tripLandmarks(props.trip))
const dates = computed(() => [...new Set((props.trip.days || []).map(day => day.date).filter(Boolean))].sort())
const dateLabel = computed(() => dates.value.length
  ? (dates.value[0] === dates.value.at(-1) ? dates.value[0] : `${dates.value[0]} — ${dates.value.at(-1)}`).replaceAll('-', '.')
  : `${props.trip.month} · 具体日期待补`)
</script>
<style scoped>
.overview-stamp{display:flex;align-items:center;justify-content:center;gap:16px;padding:20px;background:#f0eddf;border:3px double currentColor;font:14px Georgia,serif}.overview-stamp strong{font-size:12px}.destinations{font-size:13px;line-height:1.8;margin:20px 0 12px}.trip-details{margin:18px 0 8px}.trip-details>div{display:grid;grid-template-columns:80px 1fr;gap:16px;padding:15px 0;border-bottom:1px solid #ffffff20;font-size:13px;line-height:1.8}.trip-details dt{opacity:.65}.trip-details dd{margin:0}.trip-details small{display:block;opacity:.6;font-size:11px}.begin-story{display:block;margin:24px 0 8px auto;padding:12px 22px;border:1px solid #ffffff50;border-radius:24px;color:inherit}.begin-story:focus-visible{outline:2px solid #59a7b3;outline-offset:3px}
</style>
