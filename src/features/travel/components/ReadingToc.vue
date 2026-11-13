<template>
  <nav class="reading-toc" :class="{ 'motion-off': !motionEnabled }" aria-label="本日目录">
    <header><span>本日目录</span><small>{{ active < 0 ? '—' : String(active + 1).padStart(2, '0') }} <i>/</i> {{ String(chapters.length).padStart(2, '0') }}</small></header>
    <div ref="viewport" class="toc-scroll">
      <div ref="list" class="toc-list">
        <span v-if="marker" class="toc-bookmark" :style="{ height: marker.height + 'px', transform: `translateY(${marker.top}px)` }" aria-hidden="true"></span>
        <button v-for="(chapter, index) in chapters" :key="chapter.heading" type="button" :aria-current="active === index ? 'location' : undefined" @click="$emit('select', index)">
          <span class="toc-number" aria-hidden="true">{{ String(index + 1).padStart(2, '0') }}</span>
          <span class="toc-title">{{ chapter.heading.replace(/^\d+\s*\/\s*/, '') }}</span>
          <span class="toc-cursor" aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
const props = defineProps({ chapters: { type: Array, required: true }, active: { type: Number, default: 0 }, motionEnabled: { type: Boolean, default: true } })
defineEmits(['select'])
const viewport = ref(null), list = ref(null), marker = ref(null)
let observer
function syncBookmark() {
  const row = list.value?.querySelector('[aria-current="location"]')
  if (!row || !viewport.value) { marker.value = null; return }
  const top = row.offsetTop, height = row.offsetHeight
  marker.value = { top, height }
  const pane = viewport.value
  // Reveal the active chapter inside the directory without moving the article or dialog.
  if (top < pane.scrollTop) pane.scrollTo({ top, behavior: props.motionEnabled ? 'smooth' : 'auto' })
  else if (top + height > pane.scrollTop + pane.clientHeight) pane.scrollTo({ top: top + height - pane.clientHeight, behavior: props.motionEnabled ? 'smooth' : 'auto' })
}
watch(() => [props.active, props.chapters, props.motionEnabled], syncBookmark, { flush: 'post' })
onMounted(() => {
  syncBookmark()
  observer = new ResizeObserver(syncBookmark)
  observer.observe(list.value)
  observer.observe(viewport.value)
})
onBeforeUnmount(() => observer?.disconnect())
</script>

<style scoped>
.reading-toc { display:flex; flex-direction:column; flex:1; min-height:0; margin-top:10px; padding-top:10px; border-top:1px solid #294b4326; }
header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:8px; padding-inline:4px; color:#52665b; font-size:11px; letter-spacing:.12em; }
header small { font:10px ui-monospace,monospace; letter-spacing:.08em; color:#34594f; }
header i { font-style:normal; color:#8b978a; padding-inline:5px; }
.toc-scroll { min-height:0; overflow-y:auto; overscroll-behavior:contain; scrollbar-width:auto; scrollbar-color:auto; }
.toc-list { position:relative; padding:0 7px 0 0; }
.toc-bookmark { position:absolute; top:0; left:0; right:7px; border-radius:4px 10px 10px 4px; background:linear-gradient(100deg,#faf7eced,#f5f1dfb3); border:1px solid #ffffff70; box-shadow:0 2px 7px #294b4309; pointer-events:none; transition:transform 300ms cubic-bezier(.22,1,.36,1),height 220ms ease; }
.toc-bookmark::before { content:''; position:absolute; left:-1px; top:8px; bottom:8px; width:3px; border-radius:2px; background:#466c5e; }
button { position:relative; display:grid; grid-template-columns:23px minmax(0,1fr) 12px; align-items:center; gap:8px; width:100%; min-height:34px; padding:6px 10px; border:0; background:none; color:#738074; text-align:left; font-family:inherit; font-size:12px; line-height:1.7; cursor:pointer; border-radius:8px; }
.toc-number { font:10px ui-monospace,monospace; opacity:.65; }
.toc-title { font-size:12px; line-height:1.7; overflow-wrap:anywhere; }
.toc-cursor { opacity:0; font-size:12px; transition:opacity 180ms ease; }
button[aria-current] { color:#294b43; }
button[aria-current] .toc-title { font-weight:600; }
button[aria-current] .toc-number { opacity:1; }
button[aria-current] .toc-cursor { opacity:.7; }
button:hover { color:#294b43; background:#fff3; }
button:focus-visible { outline:2px solid #527c78; outline-offset:-2px; }
.toc-scroll::-webkit-scrollbar { width:5px; }
.toc-scroll::-webkit-scrollbar-button { display:none; width:0; height:0; }
.toc-scroll::-webkit-scrollbar-track { background:transparent; margin-block:8px; }
.toc-scroll::-webkit-scrollbar-thumb { background:#81958f; border-radius:5px; }
.motion-off .toc-bookmark,.motion-off .toc-cursor { transition:none; }
@media(prefers-reduced-motion:reduce) { .toc-bookmark,.toc-cursor { transition:none; } }
</style>
