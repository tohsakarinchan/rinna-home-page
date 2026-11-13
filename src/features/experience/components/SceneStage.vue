<template>
  <section class="scene-stage" :class="`scene-${scene.id}`" :style="{ '--scene-accent': scene.accent }" :aria-label="scene.title">
    <div class="scene-layer scene-distance" aria-hidden="true"><slot name="background"><img v-if="usable('background')" :src="scene.background" alt="" @error="fail('background')" /><div v-else class="scene-architecture"><i/><i/><i/><i/><i/></div></slot></div>
    <div class="scene-layer scene-character" aria-hidden="true"><slot name="character"><img v-if="usable('portrait')" :src="scene.portrait" alt="" @error="fail('portrait')" /><div v-else class="scene-placeholder"><span>✧</span><small>{{ scene.character || scene.label }}<br>人物与场景待绘制</small></div></slot></div>
    <div class="scene-layer scene-near" aria-hidden="true"><slot name="foreground"><img v-if="usable('foreground')" :src="scene.foreground" alt="" @error="fail('foreground')" /><span v-else class="scene-gem">◇</span></slot></div>
    <div class="scene-copy"><slot /></div>
  </section>
</template>
<script setup>
import { reactive, watch } from 'vue'
const props = defineProps({ scene: { type: Object, required: true } })
const failed = reactive({})
const usable = key => props.scene[key] && !failed[key]
const fail = key => { failed[key] = true }
watch(() => props.scene, () => { for (const key of Object.keys(failed)) delete failed[key] })
</script>
