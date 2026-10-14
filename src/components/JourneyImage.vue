<template>
<div ref="host" class="journey-image" :aria-busy="state === 'loading'">
  <a v-if="state === 'loaded'" :href="src" target="_blank" rel="noopener noreferrer" :aria-label="'查看大图：' + alt"><img :src="src" :alt="alt" decoding="async"/></a>
  <template v-else>
    <img v-if="started" :key="attempt" :src="src" :alt="alt" decoding="async" class="pending-image" @load="loaded" @error="failed"/>
    <div class="image-status" role="status"><span aria-hidden="true">▧</span><p>{{ state === 'error' ? '照片暂未加载成功' : state === 'slow' ? '网络较慢，照片仍在加载' : started ? '正在载入照片…' : '照片将在阅读到这里时加载' }}</p><button v-if="state === 'error' || state === 'slow'" @click="retry">重新加载照片</button><small v-if="state === 'error'">文字仍可继续阅读</small></div>
  </template>
</div>
</template>
<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue'
const props = defineProps({ src: {type:String,required:true}, alt: String })
const emit = defineEmits(['load'])
const host = ref(null), state = ref('idle'), started = ref(false), attempt = ref(0)
let observer, timer, retryTimer, retries = 0
function clear() { clearTimeout(timer); clearTimeout(retryTimer) }
function begin() { if (started.value) return; started.value = true; state.value = 'loading'; timer = setTimeout(() => {state.value = 'slow'}, 15000) }
function loaded(event) { clear(); state.value = 'loaded'; emit('load', event) }
function failed() { clear(); state.value = 'error'; if (retries < 2 && navigator.onLine && host.value?.getBoundingClientRect().top < innerHeight + 400) retryTimer = setTimeout(() => { retries++; retry() }, 1500 * (retries + 1)) }
function retry() { clear(); attempt.value++; started.value = true; state.value = 'loading'; timer = setTimeout(() => { state.value = 'slow' },15000) }
function online() { if (started.value && ['error','slow'].includes(state.value)) retry() }
watch(() => props.src, () => { clear(); retries=0; attempt.value++; if(started.value) retry() })
onMounted(() => { observer = new IntersectionObserver(entries => { if(entries.some(e=>e.isIntersecting)){ begin(); observer.disconnect() } }, {rootMargin:'350px'}); observer.observe(host.value); window.addEventListener('online', online) })
onBeforeUnmount(() => {clear(); observer?.disconnect(); window.removeEventListener('online',online)})
</script>
<style scoped>
.journey-image{position:relative;width:100%;aspect-ratio:4/3;background:#e8e6dc;border-radius:10px;overflow:hidden}
.journey-image a{display:block;width:100%;height:100%}.journey-image img{display:block;width:100%;height:100%;object-fit:contain}.pending-image{position:absolute;opacity:0}
.image-status{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;color:#52665b;text-align:center;font-size:13px}.image-status>span{font-size:30px;opacity:.5}.image-status p{margin:0}.image-status small{opacity:.7}
button{color:inherit;border:1px solid #345a4744;border-radius:24px;min-height:44px;padding:8px 18px;background:#f4f1e7;cursor:pointer}
button:focus-visible,a:focus-visible{outline:2px solid #34594f;outline-offset:-3px}
</style>
