<template>
<v-dialog v-model="open" :max-width="xs ? '95vw' : 680" :scrim-opacity="0.45">
            <template v-slot:default>
                <transition name="map-dialog-pop" appear>
                    <v-card v-if="open" class="map-dialog-card" rounded="xl">
                        <div class="map-dialog-header">
                            <div class="map-dialog-title">
                                <v-icon size="16" class="mr-1" style="opacity:0.7">mdi-map</v-icon>
                                <span>地图筛选</span>
                                <transition name="fade-hint">
                                    <v-chip v-if="activeTagNormalized" size="x-small" class="ml-2"
                                        color="var(--leleo-vcard-color)" variant="tonal">
                                        {{ activeTagNormalized }}
                                    </v-chip>
                                </transition>
                            </div>
                            <div class="d-flex align-center gap-1">
                                <v-btn v-if="activeTagNormalized" size="x-small" variant="text" @click="$emit('select', '')">
                                    <v-icon size="14" class="mr-1">mdi-close-circle</v-icon>
                                    清除
                                </v-btn>
                                <v-btn icon size="28" variant="text" aria-label="关闭地图" @click="open = false">
                                    <v-icon size="16">mdi-close</v-icon>
                                </v-btn>
                            </div>
                        </div>

                        <transition name="select-flash">
                            <div v-if="selectFeedback" class="select-feedback-overlay">
                                <div class="select-feedback-inner">
                                    <v-icon size="32" color="var(--leleo-vcard-color)">mdi-check-circle</v-icon>
                                    <span class="select-feedback-text">{{ selectFeedback }}</span>
                                </div>
                            </div>
                        </transition>

                        <div class="map-dialog-body">
                            <div v-if="mapSyncError" role="alert" class="data-notice">
                                足迹文章未能完整加载。
                                <v-btn size="small" variant="text" :loading="mapSyncLoading" @click="$emit('retry-map')">重试</v-btn>
                            </div>
                            <JapanPrefectureMap ref="prefectureMapRef" :visited-prefectures="visitedPrefectures"
                                :active-prefecture="activeTagNormalized" :visit-records="visitRecords"
                                @select="onSelectPrefectureFromMap" />
                            <div class="travel-list-panel">
                                <div class="travel-list-head">
                                    <span>去过</span>
                                    <span>首次到访</span>
                                </div>
                                <div v-if="visitLoading" class="data-notice" role="status">正在加载到访记录…</div>
                                <div v-else-if="visitError" class="data-notice" role="alert">
                                    {{ visitError }}
                                    <v-btn size="small" variant="text" @click="$emit('retry-visits')">重试</v-btn>
                                </div>
                                <div v-else-if="visitWarning" class="data-notice" role="status">{{ visitWarning }}</div>
                                <div v-if="visitRecords.length" class="travel-list-body">
                                    <div v-for="item in visitRecords" :key="item.name" class="travel-list-row">
                                        <span class="travel-place">{{ item.name }}</span>
                                        <span class="travel-date">{{ item.firstVisitLabel }}</span>
                                    </div>
                                </div>
                                <div v-else-if="!visitLoading && !visitError" class="travel-list-empty">暂无记录</div>
                            </div>
                        </div>

                        <div class="map-dialog-footer">
                            <span style="font-size:0.7rem;opacity:0.5;">点击都道府县进行筛选，再次点击取消</span>
                        <div class="map-zoom-control">
                            <div class="map-zoom-bar">
                                <v-btn icon size="32" variant="text" aria-label="缩小地图" @click="zoomOutMap">
                                    <v-icon size="16">mdi-minus</v-icon>
                                </v-btn>
                                <v-btn variant="text" size="small" class="px-2" style="min-width:0;"
                                    @click="resetMapView">
                                    {{ prefectureMapRef?.map_zoom ? (Math.round(prefectureMapRef.map_zoom * 10) /
                                        10).toFixed(1) + 'x' : '比例' }}
                                </v-btn>
                                <v-btn icon size="32" variant="text" aria-label="放大地图" @click="zoomInMap">
                                    <v-icon size="16">mdi-plus</v-icon>
                                </v-btn>
                            </div>
                        </div>
                        </div>
                    </v-card>
                </transition>
            </template>
        </v-dialog>
</template>
<script setup>
import { ref, onScopeDispose } from 'vue'
import { useDisplay } from 'vuetify'
import JapanPrefectureMap from '../../../shared/components/geography/JapanPrefectureMap.vue'
const props = defineProps({ activeTagNormalized: String, visitedPrefectures: Array, visitRecords: Array,
  mapSyncError: Boolean, mapSyncLoading: Boolean, visitLoading: Boolean, visitError: String, visitWarning: String })
const open = defineModel({ type: Boolean, default: false })
const emit = defineEmits(['select', 'retry-map', 'retry-visits'])
const { xs } = useDisplay()
const prefectureMapRef = ref(null), selectFeedback = ref('')
let feedbackTimer
function zoomInMap() { prefectureMapRef.value?.zoomIn?.() }
function zoomOutMap() { prefectureMapRef.value?.zoomOut?.() }
function resetMapView() { prefectureMapRef.value?.resetView?.() }
function onSelectPrefectureFromMap(prefecture) {
  const next = props.activeTagNormalized === prefecture ? '' : prefecture
  emit('select', next)
  selectFeedback.value = next || '已清除筛选'
  clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => { selectFeedback.value = ''; open.value = false }, 850)
}
onScopeDispose(() => clearTimeout(feedbackTimer))
</script>
<style scoped src="../styles/footprint-dialog.css"></style>
