<template>
  <v-app class="experience-app" :class="{ 'experience-motion': motionEnabled, 'travel-palette': route.matched.some(record => record.path === '/travel') }">
    <a class="experience-skip" href="#experience-main">跳到内容</a>
    <header class="experience-header">
      <RouterLink to="/" class="experience-brand">Rinna <span>私人收藏室</span></RouterLink>
      <button type="button" class="control-handle" :aria-expanded="controlOpen" @click="controlOpen = true">控制中心 ⌄</button>
    </header>
    <nav class="space-nav" aria-label="三个主空间">
      <RouterLink to="/eresh">← 艾蕾</RouterLink>
      <RouterLink to="/" exact-active-class="space-current">远坂凛</RouterLink>
      <RouterLink to="/archer">弓凛 · 旅行 →</RouterLink>
    </nav>
    <main id="experience-main" ref="main" tabindex="-1">
      <RouterView v-slot="{ Component }">
        <Transition :name="motionEnabled ? 'space-shift' : ''" mode="out-in">
          <div :key="route.matched[1]?.path" class="experience-view"><component :is="Component" /></div>
        </Transition>
      </RouterView>
    </main>
    <PeekFooter />
    <ControlCenter v-if="controlOpen" v-model="controlOpen" @appearance="appearanceOpen = true" @about="aboutOpen = true" />
    <AppearanceDialog v-if="appearanceOpen" v-model="appearanceOpen" />
    <AboutDialog v-if="aboutOpen" v-model="aboutOpen" />
    <SceneCue :cue="cue" @skip="skipCue" @cancel="cancelCue" />
  </v-app>
</template>
<script setup>
import { ref, provide, defineAsyncComponent, watch, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { createExperience, experienceKey } from '../composables/useExperience.js'
import ControlCenter from '../components/ControlCenter.vue'
import SceneCue from '../components/SceneCue.vue'
import PeekFooter from '../components/PeekFooter.vue'
import config from '../../../shared/config/site.js'
import { setMeta } from '../../../shared/lib/page.js'
const AppearanceDialog = defineAsyncComponent(() => import('../../appearance/components/AppearanceDialog.vue'))
const AboutDialog = defineAsyncComponent(() => import('../../home/components/AboutDialog.vue'))
const experience = createExperience()
provide(experienceKey, experience)
const { motionEnabled, cue, skipCue, cancelCue } = experience
const controlOpen = ref(false), appearanceOpen = ref(false), aboutOpen = ref(false), main = ref(null)
const route = useRoute()
watch(() => route.path, async () => {
  controlOpen.value = false
  await nextTick()
  main.value?.focus({ preventScroll: true })
})
onMounted(() => {
  const m = config.metaData
  setMeta(m.title, m.description, m.keywords, m.icon)
})
</script>
<style src="../styles/experience.css"></style>
