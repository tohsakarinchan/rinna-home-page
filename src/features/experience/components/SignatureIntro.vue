<template>
  <Teleport to="body">
    <section ref="overlay" class="signature-intro" role="dialog" aria-modal="true" aria-label="Rinna 签名开场" @keydown.esc.prevent="emit('skip')">
      <svg class="signature-intro-canvas" :viewBox="`0 0 ${size.width} ${size.height}`" aria-hidden="true">
        <defs>
          <mask :id="`${id}-page`" maskUnits="userSpaceOnUse" :x="0" :y="0" :width="size.width" :height="size.height" style="mask-type:luminance">
            <rect width="100%" height="100%" fill="white" />
            <circle :cx="frame.cx" :cy="frame.cy" :r="frame.hole" fill="black" />
          </mask>
          <mask v-for="(stroke, index) in strokes" :id="`${id}-stroke-${index}`" :key="index" maskUnits="userSpaceOnUse" x="0" y="0" width="560" height="240" style="mask-type:luminance">
            <path :d="stroke.d" fill="none" stroke="white" stroke-width="18" stroke-linecap="round" pathLength="1" stroke-dasharray="1 1" :stroke-dashoffset="1 - strokeProgress(stroke)" :opacity="strokeProgress(stroke) > 0 ? 1 : 0" />
          </mask>
        </defs>
        <g :mask="`url(#${id}-page)`">
          <rect width="100%" height="100%" fill="#faf8f3" />
          <g :transform="`translate(${frame.x} ${frame.y}) scale(${frame.scale})`" class="signature-ink">
            <g v-for="(stroke, index) in strokes" :key="index" :mask="`url(#${id}-stroke-${index})`">
              <path :d="stroke.d" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round" />
              <path v-if="stroke.pressure" :d="stroke.pressure" fill="currentColor" />
            </g>
          </g>
        </g>
        <circle class="signature-ring" :cx="frame.cx" :cy="frame.cy" :r="frame.radius" fill="none" :stroke-width="frame.ringWidth" pathLength="1" stroke-dasharray="1 1" :stroke-dashoffset="1 - frame.dot" :opacity="frame.dot > 0 ? 1 : 0" :transform="`rotate(-100 ${frame.cx} ${frame.cy})`" />
      </svg>
      <button ref="skip" type="button" class="signature-skip" @click="emit('skip')">跳过开场 <span aria-hidden="true">↗</span></button>
    </section>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, useId } from 'vue'
import { signatureFrame, signatureTiming } from '../domain/signature-intro.js'

const emit = defineEmits(['skip'])
const id = `signature-${useId().replace(/[^a-zA-Z0-9-]/g, '')}`
const overlay = ref(null), skip = ref(null)
const size = ref({ width: 1, height: 1 }), elapsed = ref(0)
const frame = computed(() => signatureFrame(elapsed.value, size.value.width, size.value.height))
// Original single-line lettering, with tapered downstrokes revealed by the same pen path.
const strokes = [
  { start: 130, duration: 470, d: 'M72 164 C96 147 128 103 150 64 C160 46 168 43 164 59 C157 88 126 155 109 186', pressure: 'M160 69 C150 103 126 158 109 186 C116 158 145 95 160 69Z' },
  { start: 590, duration: 520, d: 'M119 100 C151 66 201 61 207 83 C214 109 166 133 133 130 C159 126 173 175 198 178 C212 182 226 169 239 151', pressure: 'M142 132 C158 131 175 172 198 178 C176 182 158 143 142 132Z' },
  { start: 1100, duration: 190, d: 'M239 147 C233 159 221 178 228 181 C238 187 258 165 269 147', pressure: 'M239 147 C236 161 226 175 228 181 C219 181 228 160 239 147Z' },
  { start: 1280, duration: 210, d: 'M269 147 L254 181 C265 163 286 139 296 145 C304 151 278 179 286 182 C298 187 318 162 330 147', pressure: 'M269 147 L258 179 L254 181 C257 167 264 152 269 147Z M296 145 C305 150 284 175 286 182 C276 179 295 154 296 145Z' },
  { start: 1480, duration: 210, d: 'M330 147 L315 181 C326 163 347 139 357 145 C365 151 339 179 347 182 C359 187 379 162 391 147', pressure: 'M330 147 L319 179 L315 181 C318 167 325 152 330 147Z M357 145 C366 150 345 175 347 182 C337 179 356 154 357 145Z' },
  { start: 1680, duration: 230, d: 'M419 149 C409 135 390 145 381 161 C367 186 382 192 399 174 C408 164 416 148 419 143 C411 159 401 177 409 181 C425 187 454 154 488 151', pressure: 'M392 146 C380 163 376 179 381 183 C370 182 377 157 392 146Z M419 143 C417 157 406 175 409 181 C399 181 409 156 419 143Z' },
]
const strokeProgress = stroke => Math.max(0, Math.min(1, (elapsed.value - stroke.start) / stroke.duration))
let raf, observer, previousFocus, previousOverflow, previousRootOverflow, blocked = []
onMounted(() => {
  previousFocus = document.activeElement
  previousOverflow = document.body.style.overflow
  previousRootOverflow = document.documentElement.style.overflow
  document.body.style.overflow = 'hidden'
  document.documentElement.style.overflow = 'hidden'
  // Keep the visible page mounted behind the reveal while making only Skip interactive.
  blocked = [...document.body.children].filter(element => element !== overlay.value && !element.inert)
  blocked.forEach(element => { element.inert = true })
  skip.value?.focus({ preventScroll: true })
  const measure = () => {
    const box = overlay.value.getBoundingClientRect()
    size.value = { width: box.width, height: box.height }
  }
  measure()
  observer = new ResizeObserver(measure)
  observer.observe(overlay.value)
  const started = performance.now()
  const tick = now => {
    elapsed.value = Math.min(now - started, signatureTiming.duration)
    if (elapsed.value < signatureTiming.duration) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
})
onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  observer?.disconnect()
  blocked.forEach(element => { element.inert = false })
  document.body.style.overflow = previousOverflow
  document.documentElement.style.overflow = previousRootOverflow
  const target = previousFocus?.isConnected && previousFocus !== document.body ? previousFocus : document.getElementById('experience-main')
  target?.focus({ preventScroll: true })
})
</script>

<style scoped>
.signature-intro { position:fixed; inset:0; z-index:3000; isolation:isolate; overflow:hidden; }
.signature-intro-canvas { display:block; width:100%; height:100%; }
.signature-ink { color:#423b38; }
.signature-ring { stroke:#423b38; stroke-linecap:round; }
.signature-skip { position:absolute; right:max(28px,env(safe-area-inset-right)); bottom:max(26px,env(safe-area-inset-bottom)); display:flex; align-items:center; gap:18px; min-height:44px; padding:8px 4px; color:#6e655d; font-family:inherit; font-size:12px; line-height:1.4; letter-spacing:.12em; background:transparent; border:0; cursor:pointer; }
.signature-skip span { font-size:18px; }
.signature-skip:focus-visible { outline:2px solid #a6384c; outline-offset:5px; }
@media(max-width:600px) { .signature-skip { right:max(22px,env(safe-area-inset-right)); bottom:max(22px,env(safe-area-inset-bottom)); } }
</style>
