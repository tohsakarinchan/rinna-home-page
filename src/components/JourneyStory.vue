<template>
<div ref="root">
<JourneyFlight v-if="flight" :flight="flight" :motion="motionEnabled && !reduced" @done="finish"/>
<DailyJourney v-if="visitedDays" v-show="daysVisible" :active="daysVisible" :days="days" :initial-page="entryPage" :map-host="mapHost" :motion-enabled="motionEnabled" @layout="$emit('layout', $event)" @boundary="boundary"/>
<section v-if="!flight && chapter !== 'days'" class="bookend">
<nav><button :disabled="chapter === 'prologue'" @click="back">← 最后一天</button><span>{{ chapter === 'prologue' ? 'PROLOGUE / 序言' : 'EPILOGUE / 总结' }}</span><button :disabled="chapter === 'epilogue'" @click="depart">第一天 →</button></nav>
<p class="kicker">{{ chapter === 'prologue' ? 'BEFORE THE JOURNEY' : 'AFTER THE JOURNEY' }}</p>
<h2>{{ bookend.title }}</h2>
<p class="body">{{ bookend.text || (chapter === 'prologue' ? '出发前的碎碎念与准备，留在这里慢慢补齐。' : '旅途结束后的回望，留在这里慢慢整理。') }}</p>
<p v-if="!bookend.text">文字待补</p>
<button class="primary" @click="chapter === 'prologue' ? depart() : back()">{{ chapter === 'prologue' ? '带着期待，出发 →' : '← 重访最后一天' }}</button>
</section>
</div>
</template>
<script setup>
import { computed, ref, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import DailyJourney from './DailyJourney.vue'
import JourneyFlight from './JourneyFlight.vue'
import { journeyStories, cityStops } from '../constants/journey-stories'
import { createJourneyWarmup } from '../utils/journey-warmup'
const props = defineProps({ tripId: String, story: Object, days: { type: Array, required: true }, mapHost: { default: null }, motionEnabled: { type: Boolean, default: true } })
const emit = defineEmits(['layout'])
const config = computed(() => props.story || journeyStories[props.tripId] || {})
const chapter = ref('prologue'), entryPage = ref(0), flight = ref(null), reduced = ref(false), root = ref(null)
const daysVisible = computed(() => chapter.value === 'days' && !flight.value)
const visitedDays = ref(false)
watch(daysVisible, visible => { if (visible) visitedDays.value = true }, { immediate: true })
const warmup = createJourneyWarmup()
const firstDay = computed(() => [...props.days].sort((a, b) => a.date.localeCompare(b.date))[0])
let savedScroll = 0
const bookend = computed(() => config.value[chapter.value] || { title: chapter.value === 'prologue' ? '出发之前' : '旅程之后' })
let destination = 'days', query, chapterAnimation
watch([chapter, flight], async () => {
  chapterAnimation?.cancel()
  await nextTick()
  if (flight.value || !props.motionEnabled || reduced.value) return
  chapterAnimation = root.value?.animate([{opacity:.35,transform:'translateY(10px)'},{opacity:1,transform:'translateY(0)'}],{duration:260,easing:'ease-out'})
})
async function reset() { emit('layout', false); await nextTick(); root.value?.closest('.trip-dialog-body')?.scrollTo({ top: 0 }) }
function travel(route, target) { destination = target; flight.value = route || null; chapter.value = target; reset() }
function depart() { warmup.photos(firstDay.value && { ...firstDay.value, stops: cityStops(firstDay.value.stops) }); entryPage.value = 0; travel(config.value.outbound, 'days') }
function finish() { flight.value = null; chapter.value = destination; reset() }
async function back() { entryPage.value = props.days.length - 1; chapter.value = 'days'; await nextTick(); root.value?.closest('.trip-dialog-body')?.scrollTo({ top: savedScroll }) }
function boundary(direction) { savedScroll = root.value?.closest('.trip-dialog-body')?.scrollTop || 0; if (direction < 0) { chapter.value = 'prologue'; reset() } else travel(config.value.inbound, 'epilogue') }
function preference() { reduced.value = query.matches }
onMounted(() => { warmup.connect(firstDay.value && { ...firstDay.value, stops: cityStops(firstDay.value.stops) }); query = matchMedia('(prefers-reduced-motion: reduce)'); preference(); query.addEventListener('change', preference) })
onBeforeUnmount(() => { warmup.dispose(); chapterAnimation?.cancel(); query?.removeEventListener('change', preference); emit('layout', false) })
</script>
<style scoped>
.bookend{color:#304b48;background:#f4f1e7;border-radius:18px;overflow:hidden;min-height:520px;padding:24px}.bookend nav{display:flex;justify-content:space-between;align-items:center;gap:12px;border-bottom:1px solid #ced6ca;padding-bottom:17px;font-size:10px;letter-spacing:.13em}.bookend button{color:inherit;cursor:pointer}.bookend button:disabled{opacity:.25;cursor:default}.kicker{font-size:11px;letter-spacing:.2em;margin:30px 0 8px}.bookend h2{font:500 30px Georgia,'Songti SC',serif}.body{white-space:pre-wrap;font-size:15px;line-height:2.2;max-width:650px;margin:24px 0;color:#52665b}.primary{border:1px solid #a8b7ac;border-radius:30px;padding:14px 24px;margin-top:28px;background:transparent}
@media(max-width:600px){.bookend nav{font-size:10px}.bookend{padding:16px 12px}.bookend h2{font-size:26px}}
</style>


