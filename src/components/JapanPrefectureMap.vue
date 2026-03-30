<template>
    <div class="japan-map-card">
        <div class="d-flex align-center justify-space-between mb-2">
            <span class="map-title">
                <v-icon size="small" class="mr-1">mdi-map</v-icon>
                日本都道府县足迹
            </span>
            <v-chip size="x-small" variant="tonal">达成 {{ visitedSet.size }}/47</v-chip>
        </div>

        <svg viewBox="0 0 260 450" class="japan-map-svg" role="img" aria-label="日本都道府县交互地图">
            <g v-for="pref in PREFECTURES" :key="pref.name" class="pref-group" @click="emit('select', pref.name)">
                <rect :x="pref.x" :y="pref.y" rx="5" ry="5" width="34" height="18"
                    :class="rectClass(pref.name)"></rect>
                <title>{{ pref.name }}</title>
            </g>
        </svg>

        <div class="map-legend mt-2">
            <span><i class="dot active"></i> 当前筛选</span>
            <span><i class="dot visited"></i> 已去过</span>
            <span><i class="dot default"></i> 未记录</span>
        </div>

        <div class="visit-list mt-3">
            <button v-for="item in visitRecords" :key="item.name" type="button" class="visit-row"
                :class="{ 'visit-row-active': item.name === activePrefecture }" @click="emit('select', item.name)">
                <span class="visit-name">{{ item.name }}</span>
                <span class="visit-date">{{ item.firstVisitLabel }}</span>
            </button>
            <p v-if="!visitRecords.length" class="visit-empty">还没有识别到都道府县标签</p>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { PREFECTURES } from '../constants/prefectures'

const props = defineProps({
    visitedPrefectures: {
        type: Array,
        default: () => [],
    },
    activePrefecture: {
        type: String,
        default: '',
    },
    visitRecords: {
        type: Array,
        default: () => [],
    }
})

const emit = defineEmits(['select'])

const visitedSet = computed(() => new Set(props.visitedPrefectures))

function rectClass(prefectureName) {
    if (props.activePrefecture === prefectureName) return 'pref-rect pref-active'
    if (visitedSet.value.has(prefectureName)) return 'pref-rect pref-visited'
    return 'pref-rect pref-default'
}
</script>

<style scoped>
.japan-map-card {
    margin-top: 12px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(var(--v-theme-surface), 0.1);
    backdrop-filter: blur(var(--leleo-blur, 10px));
}

.map-title {
    font-size: 0.8rem;
    opacity: 0.8;
}

.japan-map-svg {
    width: 100%;
    max-width: 100%;
    display: block;
}

.pref-group {
    cursor: pointer;
}

.pref-rect {
    transition: all 0.18s ease;
    stroke-width: 1.1;
}

.pref-default {
    fill: rgba(255, 255, 255, 0.13);
    stroke: rgba(255, 255, 255, 0.3);
}

.pref-visited {
    fill: rgba(75, 218, 190, 0.68);
    stroke: rgba(75, 218, 190, 0.95);
}

.pref-active {
    fill: rgba(255, 228, 109, 0.9);
    stroke: rgba(255, 228, 109, 1);
}

.pref-group:hover .pref-rect {
    filter: brightness(1.12);
}

.map-legend {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    font-size: 0.7rem;
    opacity: 0.75;
}

.dot {
    display: inline-block;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    margin-right: 4px;
    vertical-align: middle;
}

.dot.default {
    background: rgba(255, 255, 255, 0.24);
}

.dot.visited {
    background: rgba(75, 218, 190, 0.85);
}

.dot.active {
    background: rgba(255, 228, 109, 0.9);
}

.visit-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.visit-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.06);
    color: inherit;
    border-radius: 8px;
    padding: 7px 10px;
    font-size: 0.76rem;
    cursor: pointer;
    transition: all .2s ease;
}

.visit-row:hover {
    border-color: rgba(255, 255, 255, 0.35);
    background: rgba(255, 255, 255, 0.1);
}

.visit-row-active {
    border-color: rgba(255, 228, 109, 0.9);
    background: rgba(255, 228, 109, 0.2);
}

.visit-name {
    font-weight: 600;
}

.visit-date {
    opacity: 0.8;
}

.visit-empty {
    opacity: 0.6;
    font-size: 0.74rem;
    margin: 0;
    text-align: center;
    padding: 8px 0;
}
</style>
