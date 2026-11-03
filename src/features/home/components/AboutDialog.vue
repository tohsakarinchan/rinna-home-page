<template>
<v-dialog v-model="open" width="700">
      <v-card class="ma-3 pa-2" hover variant="tonal" rounded="lg"
        style="text-align: center;backdrop-filter: blur(10px);">
        <template v-slot:title>
          <span class="leleo-card-title">关于</span>
        </template>
        <div style="display: flex;flex-direction: column;align-items: center;">
          <v-card class="ma-3 pa-2" hover variant="tonal" max-width="400" rounded="lg" style="text-align: center;">
            <template v-slot:subtitle>
              <span class="leleo-card-subtitle">本页基于以下技术及服务搭建</span>
            </template>
            <div>
              <v-tooltip v-for="item in stackicons" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn icon v-bind="props" :color=item.color rounded="lg" class="ma-1 stack-btn" size="35">
                    <v-icon size="25" color="white">{{ item.icon }}</v-icon>
                  </v-btn>
                </template>
                <span>{{ item.tip }}</span>
              </v-tooltip>
              <!-- 自定义 -->
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" rounded="lg" class="ma-1 stack-btn" size="35">
                    <v-avatar image="/img/stackicon/vite.svg" rounded="0" size="23"></v-avatar>
                  </v-btn>
                </template>
                <span>vite</span>
              </v-tooltip>
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" rounded="lg" class="ma-1 stack-btn" size="35" color="#254B7C">
                    <span style="font-size: 8px;font-weight: bolder;">{less}</span>
                  </v-btn>
                </template>
                <span>less</span>
              </v-tooltip>
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" rounded="lg" class="ma-1 stack-btn" size="35">
                    <v-avatar image="/img/stackicon/mdi.svg" rounded="0" size="35"></v-avatar>
                  </v-btn>
                </template>
                <span>mdi</span>
              </v-tooltip>
              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" rounded="lg" class="ma-1 stack-btn" size="35">
                    <v-avatar image="/img/stackicon/chartjs.png" rounded="0" size="23"></v-avatar>
                  </v-btn>
                </template>
                <span>chartjs</span>
              </v-tooltip>

              <v-tooltip location="top">
                <template v-slot:activator="{ props }">
                  <v-btn v-bind="props" rounded="lg" class="ma-1 stack-btn" size="35" color="#070707">
                    <v-avatar image="/img/stackicon/uiverse.png" rounded="0" size="23"></v-avatar>
                  </v-btn>
                </template>
                <span>uiverse</span>
              </v-tooltip>
            </div>
          </v-card>

          <p class="ma-6">
            <span v-for="item in configdata.statement">
              {{ item }}<br>
            </span>
          </p>
        </div>
      </v-card>
    </v-dialog>
</template>
<script setup>
import configdata from '../../../shared/config/site.js'
const open = defineModel({ type: Boolean, default: false })
const stackicons = [
  { icon: 'mdi-vuejs', color: 'green', tip: 'vue' },
  { icon: 'mdi-language-javascript', color: '#CAD300', tip: 'javascript' },
  { icon: 'mdi-language-css3', color: 'blue', tip: 'css' },
  { icon: 'mdi-language-html5', color: 'red', tip: 'html' },
  { icon: '$vuetify', color: '#1697F6', tip: 'vuetify' },
]
</script>
<style scoped>
@import '../../../styles/legacy/app.less';
@import '../../../styles/legacy/mobile.less';
</style>
