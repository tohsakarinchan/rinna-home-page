<template>
  <svg viewBox="0 0 240 160" aria-hidden="true">
    <ellipse cx="120" cy="139" rx="108" ry="16" fill="#719b98" opacity=".22"/>
    <path d="M15 133L120 102 225 133 120 157Z" fill="#c2d0bb"/>
    <path d="M15 133v8l105 19v-9Z" fill="#8da795"/><path d="M120 151l105-18v8l-105 19Z" fill="#698d85"/><path d="M35 132l86-23 82 24-83 17Z" fill="none" stroke="#e3e4cf"/><g stroke="#ebe9d9" stroke-width="3" opacity=".8"><path d="M55 122l100 23M78 116l100 23"/></g>
    <g fill="#90a6a4" stroke="#dde3d5" stroke-width=".7"><path v-for="(x,i) in [35,55,165,186]" :key="x" :d="`M${x} 127v-${26+i*6}l15-6v${32+i*6}Z`"/><path v-for="y in [104,111,118]" :key="y" :d="`M37 ${y}h10m10 0h10m100 0h10m11 0h10`" stroke="#d8e2d8"/></g><g v-if="model === 'tokyo'" stroke="#ac624c" stroke-width="5" fill="none"><path d="M122 21L90 132M122 21l32 111M103 91h36M98 111h46M111 61h23"/><path d="M122 7v25"/><path d="M106 80l31 29m-35-11 34-26m-41 48 42-30M111 63l22 17m-26-5 24-17" stroke-width="1.4"/><path d="M107 65h29M99 96h45" stroke="#f4e7d7" stroke-width="4"/><path d="M115 46h15" stroke-width="7"/></g>
    <g v-else-if="model === 'osaka'"><path d="M70 129V91h100v38" fill="#ece5ce"/><path d="M62 91l58-23 58 23ZM76 69l44-21 44 21ZM92 48l28-19 28 19Z" fill="#48776b"/><path d="M88 72v15h64V72M103 50v13h34V50" fill="#f5eedb"/></g>
    <g v-else fill="#77969b" stroke="#e5e7d9" stroke-width="2"><path d="M54 128V65l22-10v73M92 136V38l27-16v114M136 135V70l24-12v77M175 132V86l17-8v54"/><path d="M92 38l27 98M119 22L92 136" fill="none"/></g>
    <g v-if="model === 'osaka'" stroke="#bca77b" fill="#324f47"><path d="M88 101h10v9H88Zm18 0h10v9h-10Zm18 0h10v9h-10Zm18 0h10v9h-10Z"/><path d="M119 117h10v14h-10Z"/><path d="M72 91h96M87 69h66M101 48h38" stroke="#d3b77a" stroke-width="2"/></g><g v-if="model === 'hongkong'" stroke="#bed0cd" stroke-width="1"><path v-for="y in [80,88,96,104,112,120]" :key="y" :d="`M57 ${y}h16m66 0h18m21 0h11`"/><path d="M100 33v96m8-101v101M69 58v69M150 65v68"/><path d="M25 142q25-7 52 2m71 5 50-10" stroke="#f1f0dc" stroke-width="2"/></g><g fill="#547e68"><circle cx="43" cy="119" r="12"/><circle cx="197" cy="121" r="10"/></g>
  </svg>
</template>
<script setup>
defineProps({ model: { type: String, default: 'city' } })
</script>

