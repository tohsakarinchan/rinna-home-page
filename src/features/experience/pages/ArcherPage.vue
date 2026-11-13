<template>
  <div class="space-page"><SceneStage :scene="scenes.archer"><template #foreground><span class="palm-earth" aria-hidden="true">◎</span></template><span class="scene-eyebrow">02 / 弓凛的旅行邀请</span><h1>下一次，<br>去哪里看看？</h1><p>从掌心的地球，走进那些留下回忆的地方。</p><div class="scene-links"><button type="button" @click="travelCue('earth', '/travel')">让地球靠近 →</button><RouterLink to="/travel">直接打开地球</RouterLink></div></SceneStage></div>
</template>
<script setup>
import SceneStage from '../components/SceneStage.vue'
import { scenes } from '../domain/scenes.js'
import { useExperience } from '../composables/useExperience.js'
const { travelCue } = useExperience()
</script>
