<template>
<v-dialog v-model="open" width="1000">
      <v-card elevation="3" style="backdrop-filter: blur(10px);">
        <v-tabs v-model="tab" :items="tabs" align-tabs="center" height="60" slider-color=var(--leleo-vcard-color)>
          <template v-slot:tab="{ item }">
            <v-tab :prepend-icon="item.icon" :text="item.text" :value="item.value" class="text-none"></v-tab>
          </template>

          <template v-slot:item="{ item }">
            <v-tabs-window-item :value="item.value" class="pa-4">
              <component :is="panels[item.component]" @cancel="open = false" />
            </v-tabs-window-item>
          </template>
        </v-tabs>
      </v-card>
    </v-dialog>
</template>
<script setup>
import { ref, defineAsyncComponent } from 'vue'
const open = defineModel({ type: Boolean, default: false })
const tab = ref(null)
const panels = {
  theme: defineAsyncComponent(() => import('./ThemeSettings.vue')),
  wallpaper: defineAsyncComponent(() => import('./WallpaperSettings.vue')),
}
const tabs = [
  { icon: 'mdi-pencil-plus', text: '样式预览', value: 'tab-1', component: 'theme' },
  { icon: 'mdi-wallpaper', text: '背景预览', value: 'tab-2', component: 'wallpaper' },
]
</script>
<style scoped>
@import '../../../styles/legacy/app.less';
@import '../../../styles/legacy/mobile.less';
</style>
