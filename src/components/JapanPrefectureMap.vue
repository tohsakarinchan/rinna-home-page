<template>
    <div class="japan-map-card">
        <div class="d-flex align-center justify-space-between mb-2">
            <span class="map-title">
                <v-icon size="small" class="mr-1">mdi-map</v-icon>
                日本都道府县足迹
            </span>
            <v-chip size="x-small" variant="tonal">已点亮 {{ visitedSet.size }}/47</v-chip>
        </div>

        <svg viewBox="0 0 260 450" class="japan-map-svg" role="img" aria-label="日本都道府县交互地图">
            <g v-for="pref in PREFECTURES" :key="pref.name" class="pref-group" @click="emit('select', pref.name)">
                <rect :x="pref.x" :y="pref.y" rx="5" ry="5" width="34" height="18"
                    :class="rectClass(pref.name)"></rect>
                <text :x="pref.x + 17" :y="pref.y + 12" text-anchor="middle" class="pref-label">
                    {{ pref.short }}
                </text>
                <title>{{ pref.name }}</title>
            </g>
        </svg>

        <div class="map-legend mt-2">
            <span><i class="dot active"></i> 当前筛选</span>
            <span><i class="dot visited"></i> 已去过</span>
            <span><i class="dot default"></i> 未记录</span>
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

.pref-label {
    font-size: 5.6px;
    dominant-baseline: middle;
    fill: rgba(0, 0, 0, 0.72);
    pointer-events: none;
    user-select: none;
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
</style>
