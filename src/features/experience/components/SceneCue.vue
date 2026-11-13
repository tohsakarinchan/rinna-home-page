<template>
  <SignatureIntro v-if="cue?.kind === 'intro'" @skip="emit('skip')" />
  <v-dialog v-else :model-value="!!cue" persistent max-width="780" aria-label="场景过场" @keydown.esc="emit('skip')">
    <section v-if="cue" class="scene-cue" :class="`cue-${cue.kind}`">
      <template v-if="cue.kind === 'earth'"><span class="cue-earth" aria-hidden="true">◎</span><h2>世界，慢慢靠近。</h2><p>穿过云层，去看看留下的足迹。</p></template>
      <template v-else><div class="ride-landmarks" aria-hidden="true">{{ cue.country?.landmarks?.join('　 ·　 ') || '沿途风景' }}</div><div class="ride-bike" aria-hidden="true">♧ ─ ◉</div><h2>下一站，{{ cue.country?.name }}</h2><p>骑凛与小摩托 · 演出占位</p></template>
      <div class="cue-actions"><button type="button" autofocus @click="emit('skip')">跳过{{ cue.kind === 'intro' ? '开场' : '过场' }} →</button><button v-if="cue.kind !== 'intro'" type="button" @click="emit('cancel')">取消前往</button></div>
    </section>
  </v-dialog>
</template>
<script setup>
import SignatureIntro from './SignatureIntro.vue'
defineProps({ cue: Object })
const emit = defineEmits(['skip', 'cancel'])
</script>
