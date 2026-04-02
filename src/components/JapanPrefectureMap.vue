<template>
    <div class="japan-map-card">
        <div class="d-flex align-center justify-space-between mb-2">
            <span class="map-title">
                <v-icon size="small" class="mr-1">mdi-map</v-icon>
                日本都道府县足迹
            </span>
            <v-chip size="x-small" variant="tonal">已点亮 {{ visitedSet.size }}/47</v-chip>
        </div>

        <!-- 加载中 -->
        <div v-if="geoLoading" class="map-loading">
            <v-progress-circular indeterminate size="28"></v-progress-circular>
        </div>

        <!-- ECharts 容器 -->
        <div v-show="!geoLoading" ref="chartEl" class="echarts-container"></div>

        <div class="map-legend mt-2">
            <span><i class="dot active"></i> 当前筛选</span>
            <span><i class="dot visited"></i> 已去过</span>
            <span><i class="dot default"></i> 未记录</span>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { PREFECTURES } from '../constants/prefectures'
import { normalizePrefectureTag } from '../constants/prefectures'

// ── Props / Emits ────────────────────────────────────────────
const props = defineProps({
    visitedPrefectures: { type: Array, default: () => [] },
    activePrefecture: { type: String, default: '' },
})
const emit = defineEmits(['select'])

// ── 英文名 → 中文规范名映射（dataofjapan/land GeoJSON 使用英文 nam_ja 字段） ──
// GeoJSON feature 的 nam 字段是英文，nam_ja 是日文汉字
// 这里统一用 nam_ja → 中文规范名 做二次映射
const JA_TO_ZH = {
    '北海道': '北海道',
    '青森県': '青森县',
    '岩手県': '岩手县',
    '宮城県': '宫城县',
    '秋田県': '秋田县',
    '山形県': '山形县',
    '福島県': '福岛县',
    '茨城県': '茨城县',
    '栃木県': '栃木县',
    '群馬県': '群马县',
    '埼玉県': '埼玉县',
    '千葉県': '千叶县',
    '東京都': '东京都',
    '神奈川県': '神奈川县',
    '新潟県': '新潟县',
    '富山県': '富山县',
    '石川県': '石川县',
    '福井県': '福井县',
    '山梨県': '山梨县',
    '長野県': '长野县',
    '岐阜県': '岐阜县',
    '静岡県': '静冈县',
    '愛知県': '爱知县',
    '三重県': '三重县',
    '滋賀県': '滋贺县',
    '京都府': '京都府',
    '大阪府': '大阪府',
    '兵庫県': '兵库县',
    '奈良県': '奈良县',
    '和歌山県': '和歌山县',
    '鳥取県': '鸟取县',
    '島根県': '岛根县',
    '岡山県': '冈山县',
    '広島県': '广岛县',
    '山口県': '山口县',
    '徳島県': '德岛县',
    '香川県': '香川县',
    '愛媛県': '爱媛县',
    '高知県': '高知县',
    '福岡県': '福冈县',
    '佐賀県': '佐贺县',
    '長崎県': '长崎县',
    '熊本県': '熊本县',
    '大分県': '大分县',
    '宮崎県': '宫崎县',
    '鹿児島県': '鹿儿岛县',
    '沖縄県': '冲绳县',
}

// ── 状态 ────────────────────────────────────────────────────
const chartEl = ref(null)
const geoLoading = ref(true)
let chart = null
const map_zoom = ref(2) // 初始与 DEFAULT_MAP_ZOOM 保持一致

const visitedSet = computed(() => new Set(props.visitedPrefectures))

// ── 获取 GeoJSON（使用 dataofjapan/land，坐标系 WGS84，ECharts 直接支持） ──
// 备用 CDN：https://cdn.jsdelivr.net/npm/echarts/map/json/...（需要是都道府县级别）
const GEO_URL = 'https://raw.githubusercontent.com/dataofjapan/land/master/japan.geojson'

const DEFAULT_MAP_CENTER = [137.5, 37.0]
const DEFAULT_MAP_ZOOM = 2
const MIN_MAP_ZOOM = 1.2
const MAX_MAP_ZOOM = 8
const ZOOM_FACTOR = 1.2

async function loadGeoJson() {
    const res = await fetch(GEO_URL)
    const data = await res.json()

    // 把每个 feature 的 name 改写为中文规范名，方便 ECharts data 匹配
    data.features = data.features.map(f => {
        const jaName = f.properties?.nam_ja || ''
        const zhName = JA_TO_ZH[jaName] || jaName
        f.properties.name = zhName   // ECharts 用 properties.name 匹配 series.data
        return f
    })

    return data
}

// ── 构建 ECharts option ─────────────────────────────────────
function buildOption() {
    // series.data：每个都道府县赋 value，用于区分颜色
    // value: 2 = 当前激活, 1 = 已访问, 0 = 未访问
    const seriesData = PREFECTURES.map(pref => {
        const name = pref.name
        if (props.activePrefecture === name) return { 
            name, 
            value: 2,
            itemStyle: {
                shadowBlur: 20,
                shadowColor: 'rgba(255, 228, 109, 0.95)',
                borderColor: 'rgba(255, 255, 255, 1)',
                borderWidth: 2,
            }
        }
        if (visitedSet.value.has(name)) return { name, value: 1 }
        return { name, value: 0 }
    })

    return {
        tooltip: {
            trigger: 'item',
            formatter: ({ name }) => name,
            backgroundColor: 'rgba(0,0,0,0.6)',
            borderColor: 'rgba(255,255,255,0.2)',
            textStyle: { color: '#fff', fontSize: 12 },
        },
        visualMap: {
            show: false,
            min: 0,
            max: 2,
            inRange: {
                color: [
                    'rgba(255,255,255,0.13)',  // 0: 未访问
                    'rgba(75,218,190,0.7)',    // 1: 已访问
                    'rgba(255,228,109,0.95)', // 2: 当前激活
                ],
            },
        },
        series: [{
            id: 'japan-prefecture-series',
            type: 'map',
            map: 'japan-prefecture',
            roam: true,
            aspectScale: 0.9,
            center: DEFAULT_MAP_CENTER,
            zoom: DEFAULT_MAP_ZOOM,
            data: seriesData,
            nameProperty: 'name',           // 对应 GeoJSON properties.name
            itemStyle: {
                borderColor: 'rgba(255,255,255,0.35)',
                borderWidth: 0.8,
            },
            emphasis: {
                itemStyle: {
                    borderColor: 'rgba(255,255,255,1)',
                    borderWidth: 1.8,
                    areaColor: 'rgba(255,228,109,0.9)',
                    shadowBlur: 12,
                    shadowColor: 'rgba(255, 228, 109, 0.8)'
                },
                label: { show: false },
            },
            select: {
                itemStyle: { 
                    areaColor: 'rgba(255,228,109,0.95)'
                },
                label: { show: false },
            },
            label: { show: false },
        }],
    }
}

// ── 初始化 & 更新 ───────────────────────────────────────────
function getCurrentMapView() {
    const series = chart?.getOption?.()?.series?.[0]
    const zoom = Number(series?.zoom)
    const center = Array.isArray(series?.center) && series.center.length === 2
        ? series.center
        : DEFAULT_MAP_CENTER

    return {
        zoom: Number.isFinite(zoom) ? zoom : DEFAULT_MAP_ZOOM,
        center,
    }
}

function applyMapView(nextZoom, nextCenter) {
    if (!chart) return
    chart.setOption({
        series: [{
            id: 'japan-prefecture-series',
            zoom: nextZoom,
            center: nextCenter,
        }],
    })
    map_zoom.value = nextZoom
}

function zoomIn() {
    if (!chart) return
    const { zoom, center } = getCurrentMapView()
    applyMapView(Math.min(zoom * ZOOM_FACTOR, MAX_MAP_ZOOM), center)
}

function zoomOut() {
    if (!chart) return
    const { zoom, center } = getCurrentMapView()
    applyMapView(Math.max(zoom / ZOOM_FACTOR, MIN_MAP_ZOOM), center)
}

function resetView() {
    if (!chart) return
    applyMapView(DEFAULT_MAP_ZOOM, DEFAULT_MAP_CENTER)
}

defineExpose({ zoomIn, zoomOut, resetView, map_zoom })

async function initChart() {
    geoLoading.value = true
    try {
        const geoJson = await loadGeoJson()
        echarts.registerMap('japan-prefecture', geoJson)

        geoLoading.value = false
        await nextTick()

        chart = echarts.init(chartEl.value, null, { renderer: 'svg' })
        chart.setOption(buildOption())
        map_zoom.value = getCurrentMapView().zoom

        // 点击事件
        chart.on('click', ({ name }) => {
            if (!name) return
            emit('select', name)
        })

        // 漫游缩放、平移事件
        chart.on('georoam', () => {
            map_zoom.value = getCurrentMapView().zoom
        })
    } catch (e) {
        console.error('地图加载失败', e)
        geoLoading.value = false
    }
}

// 监听 props 变化，局部更新 series（不重新注册地图）
watch(
    () => [props.visitedPrefectures, props.activePrefecture],
    () => { chart?.setOption(buildOption()) },
    { deep: true }
)

// 窗口 resize
function onResize() { chart?.resize() }

onMounted(async () => {
    await initChart()
    window.addEventListener('resize', onResize)
})

onUnmounted(() => {
    window.removeEventListener('resize', onResize)
    chart?.dispose()
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

.echarts-container {
    width: 100%;
    height: clamp(400px, 62vh, 520px);
}

.map-loading {
    height: clamp(400px, 62vh, 520px);
    display: flex;
    align-items: center;
    justify-content: center;
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
