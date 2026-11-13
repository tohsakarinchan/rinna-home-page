<template>
  <v-dialog v-model="open" max-width="620" aria-label="控制中心" content-class="control-center-dialog">
    <section class="control-center"><header><h2>控制中心</h2><button type="button" @click="open = false">收起 ↑</button></header><p class="control-clock">{{ formattedTime }} <small>{{ formattedDate }}</small></p>
      <nav aria-label="应用导航"><RouterLink to="/eresh" @click="open = false">艾蕾空间</RouterLink><RouterLink to="/" @click="open = false">远坂凛主页</RouterLink><RouterLink to="/archer" @click="open = false">弓凛旅行入口</RouterLink><RouterLink to="/travel" @click="open = false">旅行地球</RouterLink></nav>
      <div class="control-actions"><button type="button" :aria-pressed="motionEnabled" :disabled="reducedMotion" @click="toggleMotion">{{ reducedMotion ? '跟随系统减少动态' : `动态效果：${motionEnabled ? '开' : '关'}` }}</button><button type="button" @click="open = false; replayIntro()">重播开场</button><RouterLink v-if="lastReading" :to="lastReading" @click="open = false">继续阅读 →</RouterLink><button type="button" @click="open = false; emit('appearance')">外观设置</button><button type="button" @click="open = false; emit('about')">关于本站</button></div>
      <small>小组件的位置，留给以后的日常。</small>
    </section>
  </v-dialog>
</template>
<script setup>
import { useExperience } from '../composables/useExperience.js'
import { useClock } from '../../home/composables/useClock.js'
const open = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['appearance', 'about'])
const { motionEnabled, reducedMotion, toggleMotion, replayIntro, lastReading } = useExperience()
const { formattedTime, formattedDate } = useClock()
</script>
