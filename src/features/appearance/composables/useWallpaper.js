import { ref, onMounted, onScopeDispose, watch } from 'vue'
import config from '../../../shared/config/site.js'
import { getCookie } from '../../../shared/lib/cookies.js'
import { appearanceProperties, wallpaperSelection, applyAppearance } from '../domain/preferences.js'

export function useWallpaper(props, player) {
  const source = ref('')
  function syncVideo() {
    const video = player.value
    if (!video || !source.value) return
    if (document.hidden || !props.motionEnabled || props.paused) video.pause()
    else video.play().catch(() => {})
  }
  function selectWallpaper() {
    const wallpaper = wallpaperSelection(config, getCookie('leleodatabackground'), props.mobile)
    source.value = wallpaper.type === 'pic' ? '' : wallpaper.datainfo.url
    applyAppearance({ '--leleo-background-image-url': wallpaper.type === 'pic' ? `url('${wallpaper.datainfo.url}')` : 'none' })
  }
  watch(() => props.mobile, selectWallpaper)
  watch([source, () => props.motionEnabled, () => props.paused], syncVideo, { flush: 'post' })
  onMounted(() => {
    applyAppearance(appearanceProperties(config, getCookie('leleodata')))
    selectWallpaper()
    document.addEventListener('visibilitychange', syncVideo)
    syncVideo()
  })
  onScopeDispose(() => {
    document.removeEventListener('visibilitychange', syncVideo)
    player.value?.pause()
  })
  return { source, syncVideo }
}
