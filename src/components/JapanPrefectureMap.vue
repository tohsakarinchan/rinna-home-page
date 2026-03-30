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
            <rect x="6" y="8" width="248" height="434" rx="12" class="map-board" />

            <g v-if="geoPrefectures.length">
                <g v-for="pref in geoPrefectures" :key="pref.name" class="pref-group" @click="emit('select', pref.name)">
                    <path :d="pref.d" :class="tileClass(pref.name)"></path>
                    <title>{{ pref.name }}</title>
                </g>
            </g>

            <text v-else x="130" y="228" text-anchor="middle" class="map-loading-text">
                {{ geoLoading ? '地图边界加载中…' : '地图数据加载失败，已回退内置数据' }}
            </text>
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
import { computed, onMounted, ref } from 'vue'
import { PREFECTURE_SVG_PATHS } from '../constants/prefectureMapSvgData'
import { normalizePrefectureTag } from '../constants/prefectures'

const PUBLIC_GEOJSON_URL = 'https://cdn.jsdelivr.net/npm/open-data-jp-prefectures-geojson@1.1.0/output/prefectures.geojson'

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
const geoPrefectures = ref([])
const geoLoading = ref(true)

function tileClass(prefectureName) {
    if (props.activePrefecture === prefectureName) return 'pref-tile pref-active'
    if (visitedSet.value.has(prefectureName)) return 'pref-tile pref-visited'
    return 'pref-tile pref-default'
}

function flattenCoords(geometry) {
    if (!geometry) return []
    if (geometry.type === 'Polygon') return geometry.coordinates
    if (geometry.type === 'MultiPolygon') return geometry.coordinates.flat()
    return []
}

function pathFromRings(rings, projector) {
    return rings
        .map((ring) => {
            const points = ring.map(([lng, lat]) => projector(lng, lat))
            if (!points.length) return ''
            const [first, ...rest] = points
            return `M ${first[0].toFixed(2)} ${first[1].toFixed(2)} ${rest.map((p) => `L ${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join(' ')} Z`
        })
        .join(' ')
}

function getFeatureName(feature) {
    const props = feature?.properties || {}
    const candidates = [props.name, props.NAME_1, props.N03_004, props.prefecture]
    for (const value of candidates) {
        const normalized = normalizePrefectureTag(value || '')
        if (normalized) return normalized
    }
    return ''
}

function buildProjectedPaths(features) {
    const allPoints = []
    features.forEach((feature) => {
        flattenCoords(feature.geometry).forEach((ring) => {
            ring.forEach(([lng, lat]) => allPoints.push([lng, lat]))
        })
    })

    const lngValues = allPoints.map((p) => p[0])
    const latValues = allPoints.map((p) => p[1])
    const minLng = Math.min(...lngValues)
    const maxLng = Math.max(...lngValues)
    const minLat = Math.min(...latValues)
    const maxLat = Math.max(...latValues)

    const paddingX = 12
    const paddingY = 16
    const drawW = 260 - paddingX * 2
    const drawH = 450 - paddingY * 2
    const scaleX = drawW / (maxLng - minLng)
    const scaleY = drawH / (maxLat - minLat)
    const scale = Math.min(scaleX, scaleY)
    const offsetX = (260 - (maxLng - minLng) * scale) / 2
    const offsetY = (450 - (maxLat - minLat) * scale) / 2

    const projector = (lng, lat) => {
        const x = (lng - minLng) * scale + offsetX
        const y = (maxLat - lat) * scale + offsetY
        return [x, y]
    }

    return features
        .map((feature) => {
            const name = getFeatureName(feature)
            if (!name) return null
            const rings = flattenCoords(feature.geometry)
            const d = pathFromRings(rings, projector)
            if (!d) return null
            return { name, d }
        })
        .filter(Boolean)
}

onMounted(async () => {
    try {
        const response = await fetch(PUBLIC_GEOJSON_URL)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const geojson = await response.json()
        const features = Array.isArray(geojson?.features) ? geojson.features : []
        const projectedPaths = buildProjectedPaths(features)
        geoPrefectures.value = projectedPaths.length ? projectedPaths : PREFECTURE_SVG_PATHS
    } catch (error) {
        console.warn('Failed to load public GeoJSON, fallback to embedded svg paths.', error)
        geoPrefectures.value = PREFECTURE_SVG_PATHS
    } finally {
        geoLoading.value = false
    }
})
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

.map-board {
    fill: rgba(248, 250, 252, 0.9);
    stroke: rgba(30, 41, 59, 0.35);
    stroke-width: 1;
}

.map-loading-text {
    font-size: 10px;
    fill: rgba(71, 85, 105, 0.8);
}

.pref-group {
    cursor: pointer;
}

.pref-tile {
    transition: all 0.18s ease;
    stroke-width: 0.8;
}

.pref-default {
    fill: rgba(209, 213, 219, 0.92);
    stroke: rgba(100, 116, 139, 0.9);
}

.pref-visited {
    fill: rgba(250, 204, 21, 0.96);
    stroke: rgba(161, 98, 7, 0.9);
}

.pref-active {
    fill: rgba(14, 165, 233, 0.95);
    stroke: rgba(2, 132, 199, 0.95);
}

.pref-group:hover .pref-tile {
    filter: brightness(1.06);
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
    background: rgba(107, 114, 128, 0.85);
}

.dot.visited {
    background: rgba(250, 204, 21, 0.95);
}

.dot.active {
    background: rgba(56, 189, 248, 0.95);
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
    border-color: rgba(56, 189, 248, 0.9);
    background: rgba(56, 189, 248, 0.2);
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
