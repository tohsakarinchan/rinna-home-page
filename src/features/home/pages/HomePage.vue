<template>
  <div class="space-page"><SceneStage :scene="scenes.rin"><span class="scene-eyebrow">01 / 远坂家的午后</span><h1>欢迎回来，<br>这里是 Rinna。</h1><p>把喜欢的日常和走过的风景，<br>慢慢收藏起来。</p><div class="scene-links"><RouterLink to="/eresh">← 去艾蕾的房间</RouterLink><RouterLink to="/archer">和弓凛一起出发 →</RouterLink></div></SceneStage><section class="space-note"><span>近况</span><p>新的房间正在布置，旅行收藏已经可以翻阅。</p><RouterLink to="/travel">打开旅行地球 ↗</RouterLink></section></div>
</template>
<script setup>
import SceneStage from '../../experience/components/SceneStage.vue'
import { scenes } from '../../experience/domain/scenes.js'
</script>
