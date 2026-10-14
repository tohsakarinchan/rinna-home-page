<template>
  <section class="flight" :class="[flight.time || 'day', { still: !motion }]" aria-label="航班过场">
    <div class="sun" aria-hidden="true"></div>
    <p class="eyebrow">BETWEEN TWO CHAPTERS · {{ flight.time === 'night' ? '夜间航班' : flight.time === 'dusk' ? '黄昏航班' : '日间航班' }}</p>
    <h2>{{ flight.airline }} · {{ flight.time === 'afternoon' ? '午后出发' : '启程' }}</h2>
    <div class="cities">
      <div><JourneyCity :model="flight.from.model"/><h3>{{ flight.from.city }}</h3><strong>{{ flight.from.code }}</strong></div>
      <span class="direction" aria-hidden="true">→</span>
      <div><JourneyCity :model="flight.to.model"/><h3>{{ flight.to.city }}</h3><strong>{{ flight.to.code }}</strong></div>
    </div>
    <div class="airway" aria-hidden="true"><svg class="route" viewBox="0 0 1000 180" preserveAspectRatio="none"><path d="M0 160 C220 160 180 25 420 25 S780 160 1000 160" fill="none" stroke="currentColor" stroke-dasharray="4 9"/></svg>
      <div class="plane" :style="{ '--paint': flight.livery?.primary || '#667b89', '--accent': flight.livery?.accent || '#a0bec8' }">
        <JourneyAircraft :livery="flight.livery" /></div>
    </div>
    <p class="caption">{{ flight.from.code }} — {{ flight.to.code }} · {{ flight.aircraft || 'AIRBUS A321neo' }}</p>
    <button ref="continueButton" @click="$emit('done')">{{ motion ? '跳过动画，继续阅读 →' : '继续阅读 →' }}</button>
  </section>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import JourneyCity from './JourneyCity.vue'
import JourneyAircraft from './JourneyAircraft.vue'
const props = defineProps({ flight: { type: Object, required: true }, motion: Boolean })
const emit = defineEmits(['done'])
const continueButton = ref(null)
let timer
onMounted(() => { continueButton.value?.focus({ preventScroll: true }); if (props.motion) timer = setTimeout(() => emit('done'), 6500) })
onBeforeUnmount(() => clearTimeout(timer))
</script>
<style scoped>
.flight{position:relative;overflow:hidden;isolation:isolate;border-radius:22px;padding:42px 28px;text-align:center;color:#365b60;background:linear-gradient(#d9eced,#f8edd8);min-height:520px}
.flight.afternoon{background:linear-gradient(155deg,#cde7e8,#faf0d9 70%,#f2d0a1)}
.flight.dusk{background:linear-gradient(#8c81a3,#edb7a5,#f6d7a7)}.flight.night{background:linear-gradient(#172939,#36566e);color:#f6efdc}
.sun{position:absolute;z-index:-1;right:15%;top:66px;width:70px;height:70px;border-radius:50%;background:#fff4cb;box-shadow:0 0 70px #ffecb3}
.night .sun{background:#fff7db;box-shadow:12px -8px 0 0 #21384b inset}
.eyebrow{font-size:10px;letter-spacing:.2em}h2{font:24px Georgia,serif;margin:20px}h3{font-size:20px;font-weight:400;margin:4px}strong{font:30px Georgia,serif;letter-spacing:.16em}
.cities{display:grid;grid-template-columns:1fr 50px 1fr;align-items:center;gap:5%;max-width:700px;margin:auto}.cities svg{width:100%;max-width:220px}.direction{opacity:.4;font-size:24px}
.airway{position:relative;margin:0 auto 20px;width:72%;height:150px;color:#83999b}.route{position:absolute;inset:0;width:100%;height:100%;opacity:.45}.plane{position:absolute;width:clamp(130px,24vw,270px);left:0;top:0;offset-path:shape(from 0% 89%,curve to 42% 14% with 22% 89% / 18% 14%,curve to 100% 89% with 66% 14% / 78% 89%);offset-rotate:auto;offset-anchor:50% 58%;filter:drop-shadow(0 14px 7px #365b6025);animation:flight-path 6.5s cubic-bezier(.42,0,.25,1) both}.plane svg{width:100%}
@keyframes fly{0%{left:0;transform:translateX(-45%) translateY(12px) rotate(-6deg);opacity:0}15%{opacity:1}50%{transform:translateX(-50%) translateY(-25px) rotate(-2deg)}100%{left:100%;transform:translateX(-55%) translateY(10px) rotate(4deg)}}
.still .plane{animation:none;offset-distance:50%;left:0;transform:none}.caption{font-size:12px;opacity:.7}button{border:1px solid #819b97;border-radius:30px;padding:12px 20px;margin-top:20px;color:inherit;background:transparent;cursor:pointer}button:focus-visible{outline:3px solid #557f86}
@media(max-width:600px){.flight{padding:30px 15px;min-height:460px}.cities{gap:0;grid-template-columns:1fr 24px 1fr}h3{font-size:17px}.plane{width:140px}.airway{height:110px}}
@media(prefers-reduced-motion:reduce){.plane{animation:none;offset-distance:50%}}
@keyframes flight-path{from{offset-distance:0%}to{offset-distance:100%}}
@supports not (offset-path:shape(from 0% 0%,line to 100% 100%)){.plane{animation:fly 6.5s ease-in-out both;top:70px}.still .plane{animation:none;left:50%;transform:translateX(-50%)}}
</style>


