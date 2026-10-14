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
    <div class="airway" aria-hidden="true">
      <div class="plane" :style="{ '--paint': flight.livery?.primary || '#667b89', '--accent': flight.livery?.accent || '#a0bec8' }">
        <svg viewBox="0 0 260 100">
          <path d="M104 49L74 7h24l63 43" fill="#cdd7d6"/>
          <path d="M29 50L12 12h25l36 41" fill="var(--paint)"/>
          <path d="M19 48Q142 36 218 47Q245 51 251 61Q237 74 201 73L36 68 9 60Z" fill="#fffaf0"/>
          <path d="M25 62L222 64 204 73 36 68Z" fill="var(--paint)"/>
          <path d="M110 58L78 94h30l64-35" fill="#b4c6ca"/>
          <path d="M32 49L19 20h10l30 30" fill="var(--accent)"/>
          <path d="M212 49l15 4 7 6h-23Z" fill="#3c5b68"/>
          <text x="78" y="56" fill="var(--paint)" font-size="14" font-family="sans-serif">{{ flight.livery?.label || flight.airline }}</text>
        </svg>
      </div>
    </div>
    <p class="caption">{{ flight.from.code }} — {{ flight.to.code }} · 简化涂装客机</p>
    <button ref="continueButton" @click="$emit('done')">{{ motion ? '跳过动画，继续阅读 →' : '继续阅读 →' }}</button>
  </section>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import JourneyCity from './JourneyCity.vue'
const props = defineProps({ flight: { type: Object, required: true }, motion: Boolean })
const emit = defineEmits(['done'])
const continueButton = ref(null)
let timer
onMounted(() => { continueButton.value?.focus({ preventScroll: true }); if (props.motion) timer = setTimeout(() => emit('done'), 4000) })
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
.airway{position:relative;margin:22px auto 45px;width:76%;height:2px;border-bottom:1px dashed #83999b}.plane{position:absolute;width:150px;top:-56px;left:0;filter:drop-shadow(0 16px 6px #365b6025);animation:fly 4s ease-in-out both}.plane svg{width:100%}
@keyframes fly{0%{left:0;transform:translateX(-45%) translateY(12px) rotate(-6deg);opacity:0}15%{opacity:1}50%{transform:translateX(-50%) translateY(-25px) rotate(-2deg)}100%{left:100%;transform:translateX(-55%) translateY(10px) rotate(4deg)}}
.still .plane{animation:none;left:50%;transform:translateX(-50%)}.caption{font-size:12px;opacity:.7}button{border:1px solid #819b97;border-radius:30px;padding:12px 20px;margin-top:20px;color:inherit;background:transparent;cursor:pointer}button:focus-visible{outline:3px solid #557f86}
@media(max-width:600px){.flight{padding:30px 15px;min-height:460px}.cities{gap:0;grid-template-columns:1fr 24px 1fr}h3{font-size:17px}.plane{width:110px;top:-42px}}
@media(prefers-reduced-motion:reduce){.plane{animation:none;left:50%;transform:translateX(-50%)}}
</style>
