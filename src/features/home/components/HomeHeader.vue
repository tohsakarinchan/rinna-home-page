<template>
<v-col cols="12" md="4" lg="3" class="leleo-left" align="center">
          <v-avatar class="leleo-left-avatar" size="44"><v-img alt="Rinna 的头像" :src="configdata.avatar" /></v-avatar>
          <span class="identity-name">RINNA <small>旅途与日常的私人收藏</small></span>
          <time class="quiet-clock">{{ formattedDate }} <span>{{ formattedTime }}</span></time>
          <div class="home-tools">
            <v-btn variant="text" icon="mdi-cog-outline" aria-label="外观设置" @click="$emit('settings')" />
            <v-btn variant="text" icon="mdi-information-outline" aria-label="关于本站" @click="$emit('about')" />
          </div>
        </v-col>
</template>
<script setup>
import configdata from '../../../shared/config/site.js'
defineProps({ formattedDate: String, formattedTime: String })
defineEmits(['settings', 'about'])
</script>
<style scoped>
@import '../../../styles/legacy/app.less';
@import '../../../styles/legacy/mobile.less';
</style>
