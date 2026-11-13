<template>
  <div class="globe-panel">
    <!-- A future 3D renderer receives the same countries, rotation and selection contract.
         Throwing or calling fail() unmounts it and restores the accessible projection. -->
    <div v-if="$slots.renderer && !rendererFailed" class="globe-media">
      <slot name="renderer" :countries="visited" :rotation="rotation" :distant="distant" :select="select" :fail="fail" />
    </div>
    <div v-else class="globe-projection" role="group" aria-label="可旋转地球的二维投影" :style="{ '--rotation': `${rotation}deg` }">
      <div class="globe-grid" />
      <button v-for="point in visiblePoints" :key="point.id" type="button" class="globe-marker"
        :aria-label="`前往${point.name}旅行收藏`" :style="{ left: `${point.x}%`, top: `${point.y}%` }" @click="select(point)">
        <img v-if="point.nunu.image && !failedImages[point.id]" :src="point.nunu.image" alt="" @error="failedImages[point.id] = true" />
        <span v-else aria-hidden="true">♧</span><small>{{ point.name }}</small>
      </button>
      <span class="globe-label">EARTH / {{ Math.round(rotation) }}°</span>
    </div>
    <p v-if="rendererFailed" class="globe-hint" role="status">地球媒体暂时无法显示，仍可转动投影或从列表选择国家。</p>
    <label class="globe-rotation">转动地球 <input v-model.number="rotation" type="range" min="-180" max="180" step="1" /></label>
    <div class="globe-buttons">
      <button type="button" @click="rotate(-30)">向西转</button>
      <button type="button" @click="rotate(30)">向东转</button>
      <button type="button" :aria-pressed="distant" @click="distant = !distant">{{ distant ? '展开国家标记' : '远景聚合' }}</button>
    </div>
    <p class="globe-hint">{{ distant ? `${visited.length} 个国家有收藏 · 近看可见努努标记` : '♧ 到访标记 · 努努服装待制作' }}</p>
  </div>
</template>
<script setup>
import { ref, computed, reactive, onErrorCaptured } from 'vue'
import { projectCountry } from '../domain/countries.js'
const props = defineProps({ visited: { type: Array, default: () => [] } })
const emit = defineEmits(['select'])
const rotation = ref(90), distant = ref(false), rendererFailed = ref(false), failedImages = reactive({})
const visiblePoints = computed(() => distant.value ? [] : props.visited
  .map(country => ({ ...country, ...projectCountry(country.center, rotation.value) }))
  .filter(point => point.visible))
const select = country => emit('select', country)
const fail = () => { rendererFailed.value = true }
onErrorCaptured(() => { fail(); return false })
function rotate(delta) { rotation.value = ((rotation.value + delta + 540) % 360) - 180 }
</script>
