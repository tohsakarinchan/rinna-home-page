<template>
  <svg viewBox="0 0 240 160" aria-hidden="true">
    <ellipse cx="120" cy="139" rx="108" ry="16" fill="#719b98" opacity=".22"/>
    <path d="M15 133L120 102 225 133 120 157Z" fill="#c2d0bb"/>
    <path d="M15 133v8l105 19v-9Z" fill="#8da795"/>
    <g v-if="model === 'tokyo'" stroke="#ac624c" stroke-width="5" fill="none"><path d="M122 21L90 132M122 21l32 111M103 91h36M98 111h46M111 61h23"/><path d="M122 7v25"/></g>
    <g v-else-if="model === 'osaka'"><path d="M70 129V91h100v38" fill="#ece5ce"/><path d="M62 91l58-23 58 23ZM76 69l44-21 44 21ZM92 48l28-19 28 19Z" fill="#48776b"/><path d="M88 72v15h64V72M103 50v13h34V50" fill="#f5eedb"/></g>
    <g v-else fill="#77969b" stroke="#e5e7d9" stroke-width="2"><path d="M54 128V65l22-10v73M92 136V38l27-16v114M136 135V70l24-12v77M175 132V86l17-8v54"/><path d="M92 38l27 98M119 22L92 136" fill="none"/></g>
    <g fill="#547e68"><circle cx="43" cy="119" r="12"/><circle cx="197" cy="121" r="10"/></g>
  </svg>
</template>
<script setup>
defineProps({ model: { type: String, default: 'city' } })
</script>
