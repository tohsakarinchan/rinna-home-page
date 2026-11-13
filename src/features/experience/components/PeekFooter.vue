<template>
  <footer class="peek-footer" :class="{ 'peek-open': open }"><button type="button" class="peek-handle" :aria-expanded="open" aria-controls="peek-content" @click="open = !open"><span class="peek-head" aria-hidden="true"><i>⌁</i><b>· ·</b></span>{{ open ? '安和昴探头了 · 收起 ↓' : '桌沿下，好像有人… ↑' }}</button><div v-if="open" id="peek-content" class="peek-content"><p>今天也辛苦了。</p><small>安和昴 · 探头动作待绘制</small><p>Rinna 的个人空间 · 旅行与日常收藏</p><RouterLink to="/">回到主页</RouterLink></div></footer>
</template>
<script setup>
import { ref } from 'vue'
const open = ref(false)
</script>
