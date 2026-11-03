<template>
  <v-app class="vapp-fullscreen-background" style="overflow: hidden" :class="{ 'radius-before': !xs }" :style="frameStyle">
    <slot :frame-style="frameStyle" :xs="xs" :sm="sm" />
  </v-app>
</template>
<script setup>
import { computed } from 'vue'
import { useDisplay } from 'vuetify'
const { xs, sm } = useDisplay()
const frameStyle = computed(() => xs.value
  ? { height: '100%', width: '100%', top: '0', left: '0' }
  : sm.value
    ? { height: '98%', width: '98%', top: '1%', left: '1%' }
    : { height: '96.6%', width: '99%', top: '1.7%', left: '0.5%' })
</script>
<style scoped>
@import '../styles/legacy/app.less';
@import '../styles/legacy/mobile.less';
</style>
