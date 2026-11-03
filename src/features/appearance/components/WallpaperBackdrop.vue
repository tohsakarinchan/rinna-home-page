<template>
  <video loop muted playsinline preload="metadata" :src="source" @loadeddata="syncVideo" class="video-bg" id="bg-video" ref="player"
    :controls="clearScreen" :style="{ ...frameStyle, borderRadius: mobile ? undefined : '16px', zIndex: clearScreen ? 0 : -100 }" />
</template>
<script setup>
import { ref } from 'vue'
import { useWallpaper } from '../composables/useWallpaper.js'
const props = defineProps({ frameStyle: Object, mobile: Boolean, clearScreen: Boolean, paused: Boolean, motionEnabled: Boolean })
const player = ref(null)
const { source, syncVideo } = useWallpaper(props, player)
</script>
<style scoped>
@import '../../../styles/legacy/app.less';
</style>
