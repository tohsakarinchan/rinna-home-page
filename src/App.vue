<template>
  <v-app class="vapp-fullscreen-background" style="overflow: hidden;" :class="{ 'radius-before': !xs }"
    :style="xs ? { height: '100%', width: '100%', top: '0', left: '0' } : (sm ? { height: '98%', width: '98%', top: '1%', left: ' 1%' } : { height: '96.6%', width: '99%', top: '1.7%', left: ' 0.5%' })">
    <transition name="fade">
      <div class="loading" v-show="isloading">
        <loader></loader>
      </div>
    </transition>

    <video loop muted playsinline preload="metadata" :src="videosrc" @loadeddata="_syncVideo?.()" class="video-bg" id="bg-video" ref="VdPlayer"
      :style="xs ? { height: '100%', width: '100%', top: '0', left: '0' } : (sm ? { height: '98%', width: '98%', top: '1%', left: ' 1%', 'border-radius': '16px' } : { height: '96.6%', width: '99%', top: '1.7%', left: ' 0.5%', 'border-radius': '16px', })">
    </video>

    <button class="wallpaper-toggle" type="button" :aria-pressed="isClearScreen" @click="isClearScreen = !isClearScreen">{{ isClearScreen ? '返回旅行收藏' : '欣赏壁纸' }}</button>

    <div class="home-shell" v-show="!isloading && !isClearScreen"
      :style="xs || sm ? { 'overflow-y': 'auto', 'overflow-x': 'hidden' } : {}">
      <v-row>
        <v-col cols="12" md="4" lg="3" class="leleo-left" align="center">
          <v-avatar class="leleo-left-avatar" size="44"><v-img alt="Rinna 的头像" :src="configdata.avatar" /></v-avatar>
          <span class="identity-name">RINNA <small>旅途与日常的私人收藏</small></span>
          <time class="quiet-clock">{{ formattedDate }} <span>{{ formattedTime }}</span></time>
          <div class="home-tools">
            <v-btn variant="text" icon="mdi-cog-outline" aria-label="外观设置" @click="dialog1 = true" />
            <v-btn variant="text" icon="mdi-information-outline" aria-label="关于本站" @click="dialog2 = true" />
          </div>
        </v-col>

        <v-col cols="12" md="8" lg="9" class="home-main">
          <homeright :configdata=configdata :formattedTime=formattedTime :formattedDate=formattedDate
            :projectcards=projectcards @travel-open="travelOpen = $event"></homeright>
        </v-col>
      </v-row>
    </div>

    <v-dialog v-model="dialog1" width="1000" heihght="700">
      <v-card elevation="3" style="backdrop-filter: blur(10px);">
        <v-tabs v-model="tab" :items="tabs" align-tabs="center" height="60" slider-color=var(--leleo-vcard-color)>
          <template v-slot:tab="{ item }">
            <v-tab :prepend-icon="item.icon" :text="item.text" :value="item.value" class="text-none"></v-tab>
          </template>

          <template v-slot:item="{ item }">
            <v-tabs-window-item :value="item.value" class="pa-4">
              <component :is="item.component" @cancel="handleCancel" />
            </v-tabs-window-item>
          </template>
        </v-tabs>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialog2" width="700" heihght="500">
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
              <v-tooltip v-for="item in stackicons" v-model="item.model" location="top">
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
  </v-app>
</template>

<script src="./app.js"></script>
<style scoped>
@import url(/css/app.less);
@import url(/css/mobile.less);

.blog-entry-btn {
  backdrop-filter: blur(var(--leleo-blur));
  letter-spacing: 0.05em;
  transition: transform 0.2s, opacity 0.2s;
}

.blog-entry-btn:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}
</style>

<style>
@import './styles/liquid-glass.css';
</style>
