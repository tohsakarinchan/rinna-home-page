<template>
  <div class="space-page"><div class="form-selector" role="group" aria-label="艾蕾四种形态"><button v-for="form in ereshForms" :key="form.id" type="button" :aria-pressed="ereshForm === form.id" :style="{ '--form-accent': form.accent }" @click="ereshForm = form.id"><span aria-hidden="true">✧</span> {{ form.label }}</button></div><SceneStage :scene="activeForm"><span class="scene-eyebrow">00 / 艾蕾空间</span><h1>{{ activeForm.title }}</h1><p>同一个房间，四种相遇。</p><small>当前为构图与配色占位，正式造型后续制作。</small><div class="scene-links"><RouterLink to="/">回到远坂家 →</RouterLink></div></SceneStage><section class="space-note"><h2>留给喜欢的事物</h2><p>这里的内容还在整理，收藏室将随之后续逐页完善。</p></section></div>
</template>
<script setup>
import { computed } from 'vue'
import SceneStage from '../components/SceneStage.vue'
import { ereshForms } from '../domain/scenes.js'
import { useExperience } from '../composables/useExperience.js'
const { ereshForm } = useExperience()
const activeForm = computed(() => ereshForms.find(form => form.id === ereshForm.value) || ereshForms[0])
</script>
