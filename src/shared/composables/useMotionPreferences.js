import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
const requested = ref(true), reduced = ref(false)
const motionEnabled = computed(() => requested.value && !reduced.value)
let users = 0, query, sync, stop
export function useMotionPreferences() {
  onMounted(() => {
    if (users++ > 0) return
    try { requested.value = localStorage.getItem('rinna-motion-enabled') !== 'false' } catch {}
    query = window.matchMedia('(prefers-reduced-motion: reduce)')
    sync = () => { reduced.value = query.matches }
    sync(); query.addEventListener('change', sync)
    stop = watch(motionEnabled, enabled => { document.documentElement.dataset.motion = enabled ? 'on' : 'off' }, { immediate: true, flush: 'sync' })
  })
  onBeforeUnmount(() => {
    if (--users > 0) return
    query?.removeEventListener('change', sync); stop?.()
  })
  function toggleMotion() {
    requested.value = !requested.value
    try { localStorage.setItem('rinna-motion-enabled', String(requested.value)) } catch {}
  }
  return { motionEnabled, reducedMotion: reduced, toggleMotion }
}
