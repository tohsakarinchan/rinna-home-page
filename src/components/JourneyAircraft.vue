<template>
<svg viewBox="0 0 640 190" aria-hidden="true" :style="{ '--paint': peach ? '#cf2789' : '#684293' }">
<defs><linearGradient :id="shade" x2="0" y2="1"><stop stop-color="#ffffff"/><stop offset=".48" stop-color="#f9faf9"/><stop offset="1" stop-color="#a9b4bf"/></linearGradient></defs>
<!-- A321-family proportions: elongated fuselage, swept wing and large nacelle -->
<path d="M285 94L223 17 252 17 380 103" fill="#aebac5" stroke="#8996a4"/>
<path d="M57 99L29 14Q30 8 40 9L63 12 137 108" fill="var(--paint)"/>
<path v-if="!peach" d="M45 25l26 9 25 38-30-10Z" fill="#b1a1d3"/>
<text v-else x="38" y="40" fill="white" font-size="15" transform="rotate(22 38 40)">peach</text>
<path d="M26 104Q85 91 149 89L525 89Q556 90 576 103L610 119Q621 125 605 133Q580 142 547 141L147 141Q88 139 26 119Z" :fill="'url(#'+shade+')'" stroke="#9ba8b3" stroke-width="1.2"/>
<path v-if="peach" d="M27 105Q76 97 132 94L510 94 513 116 143 117 54 122 27 118Z" fill="var(--paint)"/>
<path v-else d="M28 104Q88 91 149 89L240 89 192 141 146 141Q80 136 27 119Z" fill="var(--paint)"/>
<path v-if="!peach" d="M137 90h36l-48 48-31-4Z" fill="#aa98cb"/>
<text :x="peach ? 258 : 250" :y="peach ? 114 : 123" :fill="peach ? '#fff' : '#684293'" :font-size="peach ? 26 : 30" font-family="Arial,sans-serif" font-weight="700">{{ peach ? 'peach' : 'HK express' }}</text>
<g fill="#293c50"><rect v-for="i in 43" :key="i" :x="151+i*8.6" y="98" width="4.6" height="5.4" rx="2"/><path d="M556 96l14 8 8 7h-15l-10-13ZM547 96h6l5 14h-10Z"/></g>
<g fill="none" stroke="#8e9aa4" stroke-width="1"><rect v-for="x in [143,270,416,536]" :key="x" :x="x" y="95" width="10" height="32" rx="3"/></g>
<path d="M295 121L238 178 273 180 399 123Z" fill="#c0cbd3" stroke="#8393a1"/>
<path d="M238 178l-7-20 6-8 11 25Z" fill="var(--paint)"/>
<path d="M344 133l-1 13h40l-4-18" fill="#9baab6"/>
<path d="M338 139Q357 133 387 140L395 154Q370 166 340 157Z" fill="var(--paint)" stroke="#8492a0"/>
<ellipse cx="389" cy="149" rx="9" ry="11" fill="#c2ccd1"/><ellipse cx="390" cy="149" rx="6" ry="8" fill="#273846"/><ellipse cx="391" cy="149" rx="2" ry="3" fill="#b3bec3"/>
<path d="M57 120L28 147l24 1 86-22" fill="#adbcc7" stroke="#8898a5"/>
<path d="M500 137h51" stroke="#a7b0b7"/><circle cx="307" cy="90" r="2" fill="#d85a50"/>
</svg>
</template>
<script setup>
import { computed, useId } from 'vue'
const props = defineProps({ livery: Object })
const peach = computed(() => props.livery?.label?.toLowerCase() === 'peach')
const shade = 'aircraft-' + useId().replace(/:/g, '')
</script>
