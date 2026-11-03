<template>
  <HomeLayout v-slot="{ frameStyle, xs, sm }">
    <WallpaperBackdrop :frame-style="frameStyle" :mobile="xs" :clear-screen="clearScreen" :paused="appearanceOpen || aboutOpen || travelOpen" :motion-enabled="motionEnabled" />
    <button class="wallpaper-toggle" type="button" :aria-pressed="clearScreen" @click="clearScreen = !clearScreen">{{ clearScreen ? '返回旅行收藏' : '欣赏壁纸' }}</button>
    <div class="home-shell" v-show="!clearScreen" :style="xs || sm ? { 'overflow-y': 'auto', 'overflow-x': 'hidden' } : {}">
      <v-row>
        <HomeHeader :formatted-date="formattedDate" :formatted-time="formattedTime" @settings="appearanceOpen = true" @about="aboutOpen = true" />
        <v-col cols="12" md="8" lg="9" class="home-main">
          <HomeContent @travel-open="travelOpen = $event" />
        </v-col>
      </v-row>
    </div>
    <AppearanceDialog v-model="appearanceOpen" />
    <AboutDialog v-model="aboutOpen" />
  </HomeLayout>
</template>
<script setup>
import { ref, defineAsyncComponent, onMounted } from 'vue'
import HomeLayout from '../../../layouts/HomeLayout.vue'
import HomeContent from '../components/HomeContent.vue'
import HomeHeader from '../components/HomeHeader.vue'
import WallpaperBackdrop from '../../appearance/components/WallpaperBackdrop.vue'
import { useMotionPreferences } from '../../../shared/composables/useMotionPreferences.js'
import { useClock } from '../composables/useClock.js'
import config from '../../../shared/config/site.js'
import { setMeta, dataConsole } from '../../../shared/lib/page.js'
const AppearanceDialog = defineAsyncComponent(() => import('../../appearance/components/AppearanceDialog.vue'))
const AboutDialog = defineAsyncComponent(() => import('../components/AboutDialog.vue'))
const appearanceOpen = ref(false), aboutOpen = ref(false), travelOpen = ref(false), clearScreen = ref(false)
const { motionEnabled } = useMotionPreferences()
const { formattedDate, formattedTime } = useClock()
onMounted(() => {
  dataConsole()
  const meta = config.metaData
  setMeta(meta.title, meta.description, meta.keywords, meta.icon)
})
</script>
