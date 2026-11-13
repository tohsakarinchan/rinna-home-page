import { ref, watch, onMounted, onScopeDispose, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMotionPreferences } from '../../../shared/composables/useMotionPreferences.js'
import { createCueController } from '../domain/cue-controller.js'
import { readingLocation } from '../domain/reading-location.js'
import { signatureTiming } from '../domain/signature-intro.js'

export const experienceKey = Symbol('experience')
export const useExperience = () => inject(experienceKey)
export function createExperience({ route = useRoute(), router = useRouter() } = {}) {
  const { motionEnabled, reducedMotion, toggleMotion } = useMotionPreferences()
  const cue = ref(null), lastReading = ref(''), ereshForm = ref('original')
  const controller = createCueController({ change: value => { cue.value = value } })
  function travelCue(kind, destination, country) {
    if (document.hidden) { router.push(destination); return }
    controller.start({ kind, country, duration: 2000 }, () => router.push(destination), motionEnabled.value)
  }
  function replayIntro() {
    controller.start({ kind: 'intro', duration: signatureTiming.duration }, undefined, motionEnabled.value)
  }
  function remember(path) {
    if (!readingLocation(path)) return
    // Closing the reader must not replace its bookmark with the collection address.
    if (lastReading.value.startsWith(`${path}/trips/`)) return
    lastReading.value = path
    try { sessionStorage.setItem('rinna-last-reading', path) } catch {}
  }
  watch(() => route.fullPath, path => { controller.cancel(); remember(path) })
  watch(motionEnabled, value => { if (!value) controller.finish() })
  const hide = () => { if (document.hidden) controller.cancel() }
  onMounted(() => {
    document.addEventListener('visibilitychange', hide)
    try {
      lastReading.value = readingLocation(sessionStorage.getItem('rinna-last-reading'))
      const seen = sessionStorage.getItem('rinna-intro-seen')
      sessionStorage.setItem('rinna-intro-seen', 'true')
      if (!seen && route.path === '/' && !document.hidden) replayIntro()
    } catch { if (route.path === '/' && !document.hidden) replayIntro() }
    remember(route.path)
  })
  onScopeDispose(() => { controller.dispose(); document.removeEventListener('visibilitychange', hide) })
  return { motionEnabled, reducedMotion, toggleMotion, cue, lastReading, ereshForm,
    replayIntro, travelCue, skipCue: controller.finish, cancelCue: controller.cancel }
}
