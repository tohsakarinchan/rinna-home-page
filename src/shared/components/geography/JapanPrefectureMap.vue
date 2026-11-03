<template>
    <div class="japan-map-card" :class="{ 'compact-map': compact, 'souvenir-map': overview && landmarks.length }">
        <div v-if="overview && landmarks.length" class="souvenir-heading"><span>旅途的微缩收藏</span><small>PLACES, IN MINIATURE</small></div>
        <div v-if="!compact && !overview" class="d-flex align-center justify-space-between mb-2">
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
        <div ref="stageEl" class="map-stage" @keydown.esc="closeCard" @click.self="closeCard">
            <div v-show="!geoLoading" ref="chartEl" class="echarts-container" :style="miniatureMapStyle" :aria-label="overview ? '本次旅行到访地区地图' : undefined"></div>
            <template v-if="overview && !geoLoading && !geoError">
                <svg class="landmark-connectors" :viewBox="`0 0 ${mapSize.width} ${mapSize.height}`" aria-hidden="true">
                    <g v-for="point in positionedLandmarks" :key="point.id" :class="{ 'is-selected': activeLandmark?.id === point.id }">
                        <path :d="`M${point.anchorX},${point.anchorY} L${point.x},${point.y - 16}`"/>
                        <circle :cx="point.anchorX" :cy="point.anchorY" r="3"/>
                    </g>
                </svg>
                <button v-for="point in positionedLandmarks" :key="point.id" type="button" class="landmark-model"
                    :class="{ 'is-selected': activeLandmark?.id === point.id }"
                    :style="{ left: `${point.x}px`, top: `${point.y}px`, width: `${point.size}px`, height: `${point.size * 1.24}px` }"
                    :aria-label="`${point.region} · ${point.name}`" :aria-pressed="activeLandmark?.id === point.id"
                    @click="openCard(point.id, $event)">
                    <LandmarkScene :kind="point.kind" :active="activeLandmark?.id === point.id"/><span>{{ point.name }}</span>
                </button>
            </template>
            <Transition name="memory">
              <section v-if="activeLandmark" ref="cardEl" class="memory-card" :style="cardStyle" role="dialog" :aria-label="activeLandmark.name + ' · 旅行照片'" tabindex="-1" @keydown.esc.stop="closeCard">
                <button class="memory-close" type="button" aria-label="关闭照片" @click="closeCard">×</button>
                <div class="memory-image">
                  <img v-if="currentPhoto && !photoFailed" :key="currentPhoto.url" :src="currentPhoto.url" :alt="currentPhoto.alt || activeLandmark.name + '旅行实拍'" @error="photoFailed=true" />
                  <div v-else class="memory-empty"><span>回忆，等待显影</span><small>{{ photoFailed ? '照片暂时无法加载' : '这个地标的实拍照片待补' }}</small></div>
                </div>
                <div class="memory-body"><small>{{ activeLandmark.prefecture }} · 旅行实拍</small><h3>{{ activeLandmark.name }}</h3><p>{{ activeLandmark.caption }}</p>
                  <small v-if="currentPhoto?.credit">{{ currentPhoto.credit }}</small>
                  <div v-if="activeLandmark.photos.length > 1" class="memory-paging"><button type="button" aria-label="上一张照片" @click="photoIndex=(photoIndex-1+activeLandmark.photos.length)%activeLandmark.photos.length">←</button><span>{{ photoIndex+1 }} / {{ activeLandmark.photos.length }}</span><button type="button" aria-label="下一张照片" @click="photoIndex=(photoIndex+1)%activeLandmark.photos.length">→</button></div>
                </div>
              </section>
            </Transition>
        </div>
        <div v-if="geoError" class="map-error" role="alert">地图暂时无法加载。<button v-if="!compact" type="button" @click="initChart">重试</button></div>
        <p class="map-attribution">出典：地球地図日本（国土地理院）<template v-if="!compact"> · <a href="https://www.gsi.go.jp/kankyochiri/gm_jpn.html" target="_blank" rel="noopener noreferrer">地图来源</a></template></p>
        <div v-if="overview && landmarks.length" class="souvenir-caption">
            <span class="souvenir-kicker">MINIATURE MEMORIES / 到访纪念</span>
            <p>每个都道府县，一枚旅途纪念。轻触地标，翻看那天的实拍。</p>
            <small>点击小地标，重温到访记忆 · 连线指向地理位置，模型为示意</small>
        </div>

        <div v-if="!compact && !overview" class="map-legend mt-2">
            <span><i class="dot active"></i> 当前筛选</span>
            <span><i class="dot visited"></i> 已去过</span>
            <span><i class="dot default"></i> 未记录</span>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, defineAsyncComponent } from 'vue'
import * as echarts from 'echarts/core'
import { MapChart } from 'echarts/charts'
import { TooltipComponent, VisualMapComponent, GeoComponent } from 'echarts/components'
import { SVGRenderer } from 'echarts/renderers'
import { loadJapanGeoJson } from '../../lib/japan-geo.js'
echarts.use([MapChart, TooltipComponent, VisualMapComponent, GeoComponent, SVGRenderer])
import { PREFECTURES } from '../../domain/prefectures.js'
import { normalizePrefectureTag } from '../../domain/prefectures.js'
const LandmarkScene = defineAsyncComponent(() => import('./LandmarkScene.vue'))
import { layoutLandmarks } from '../../domain/geography/landmark-layout.js'

// ── Props / Emits ────────────────────────────────────────────
const props = defineProps({
    compact: { type: Boolean, default: false },
    overview: { type: Boolean, default: false },
    visitedPrefectures: { type: Array, default: () => [] },
    activePrefecture: { type: String, default: '' },
    landmarks: { type: Array, default: () => [] },
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
const geoError = ref(false)
const positionedLandmarks = ref([])
const mapSize = ref({ width: 1, height: 1 })
const selectedLandmark = ref('')
const activeLandmark = computed(() => props.landmarks.find(p => p.id === selectedLandmark.value))
const stageEl = ref(null), cardEl = ref(null), photoIndex = ref(0), photoFailed = ref(false)
let cardTrigger
const currentPhoto = computed(() => activeLandmark.value?.photos?.[photoIndex.value])
watch(currentPhoto, () => { photoFailed.value=false })
const cardStyle = computed(() => {
  const point=positionedLandmarks.value.find(p=>p.id===selectedLandmark.value)
  const width=Math.min(280,mapSize.value.width-16)
  return {width:width+'px',left:Math.max(8,Math.min(mapSize.value.width-width-8,(point?.x || width/2)-width/2))+'px',top:Math.max(8,Math.min(mapSize.value.height-330,(point?.y || 160)+14))+'px'}
})
async function openCard(id,event){selectedLandmark.value=id;photoIndex.value=0;photoFailed.value=false;cardTrigger=event?.currentTarget;await nextTick();cardEl.value?.focus({preventScroll:true})}
function closeCard(){if(!selectedLandmark.value)return;selectedLandmark.value='';cardTrigger?.focus({preventScroll:true})}
function outsideCard(event){if(selectedLandmark.value && !cardEl.value?.contains(event.target) && !event.target.closest?.('.landmark-model'))closeCard()}
watch(()=>props.landmarks,()=>{selectedLandmark.value='';photoIndex.value=0})
const miniatureMapStyle = computed(() => {
    if (!props.overview || !props.landmarks.length) return undefined
    const columns = Math.max(1, Math.floor((mapSize.value.width > 1 ? mapSize.value.width : 240) / 96))
    return { height: `${Math.max(440, Math.ceil(props.landmarks.length / columns) * 138 + 120)}px` }
})
let chart = null
let resizeObserver
let disposed = false
let initializing = false
let geoFeatures = []
let overviewBounds
const map_zoom = ref(2) // 初始与 DEFAULT_MAP_ZOOM 保持一致

const visitedSet = computed(() => new Set(props.visitedPrefectures))

// GeoJSON is pinned and served locally; provenance lives in public/maps/README.md.
// Source loading is shared by japan-geo.js.

const DEFAULT_MAP_CENTER = [137.5, 37.0]
const DEFAULT_MAP_ZOOM = 2
const MIN_MAP_ZOOM = 1.2
const MAX_MAP_ZOOM = 8
const ZOOM_FACTOR = 1.2

async function loadGeoJson() {
    const data = structuredClone(await loadJapanGeoJson())

    // 把每个 feature 的 name 改写为中文规范名，方便 ECharts data 匹配
    data.features = data.features.map(f => {
        const jaName = f.properties?.nam_ja || ''
        const zhName = JA_TO_ZH[jaName] || jaName
        f.properties.name = zhName   // ECharts 用 properties.name 匹配 series.data
        return f
    })

    geoFeatures = data.features
    updateOverviewBounds()
    return data
}

function updateOverviewBounds() {
    overviewBounds = undefined
    // Frame the main landmass of each visited prefecture, excluding remote islands.
    const points = geoFeatures.filter(f => visitedSet.value.has(f.properties.name)).flatMap(f => {
        const polygons = f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates : [f.geometry.coordinates]
        return [...polygons].sort((a, b) => b[0].length - a[0].length)[0]?.[0] || []
    })
    if (points.length) {
        const xs = points.map(p => p[0]), ys = points.map(p => p[1])
        const west = Math.min(...xs), east = Math.max(...xs), south = Math.min(...ys), north = Math.max(...ys)
        const dx = Math.max(.15, (east - west) * .12), dy = Math.max(.15, (north - south) * .12)
        overviewBounds = [[west - dx, north + dy], [east + dx, south - dy]]
    }

}

function positionLandmarks() {
    if (!chart || !props.overview) return
    const width = chart.getWidth(), height = chart.getHeight()
    mapSize.value = { width, height }
    const anchors = props.landmarks.map(landmark => {
        const pixel = chart.convertToPixel({ seriesIndex: 0 }, landmark.coordinate)
        return { ...landmark, anchorX: pixel?.[0], anchorY: pixel?.[1] }
    })
    positionedLandmarks.value = layoutLandmarks(anchors, width, height)
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
        if (visitedSet.value.has(name)) return {
            name,
            value: 1,
            ...(props.overview ? { label: {
                show: true,
                color: '#fffdf5',
                fontSize: 12,
                fontWeight: 600,
                textBorderColor: 'var(--text-paper)',
                textBorderWidth: 3,
            } } : {}),
        }
        return { name, value: 0 }
    })

    return {
        tooltip: {
            show: !props.compact && !props.overview,
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
            silent: props.compact || props.overview,
            roam: !props.compact && !props.overview,
            aspectScale: 0.9,
            preserveAspect: 'contain',
            preserveAspect: 'contain',
            ...(props.overview && overviewBounds ? { boundingCoords: overviewBounds, zoom: 1, top: 120, bottom: 36, left: 32, right: 32 } : {
                center: props.compact ? [137.5, 37.5] : DEFAULT_MAP_CENTER,
                zoom: props.compact ? 1.5 : DEFAULT_MAP_ZOOM,
            }),
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
            labelLayout: { hideOverlap: false },
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
    if (disposed || initializing) return
    initializing = true
    geoLoading.value = true
    geoError.value = false
    try {
        const geoJson = await loadGeoJson()
        if (disposed) return
        echarts.registerMap('japan-prefecture', geoJson)

        geoLoading.value = false
        await nextTick()
        if (disposed || !chartEl.value) return
        chart?.dispose()
        chart = echarts.init(chartEl.value, null, { renderer: 'svg' })
        chart.setOption(buildOption())
        positionLandmarks()
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
        if (disposed) return
        console.error('地图加载失败', e)
        geoLoading.value = false
        geoError.value = true
        chart?.dispose()
        chart = null
    } finally {
        initializing = false
    }
}

function updateChart() {
    updateOverviewBounds()
    if (!chart) return
    const view = getCurrentMapView()
    const option = buildOption()
    // Highlighting a prefecture must not undo the visitor's zoom or pan.
    if (!props.overview) Object.assign(option.series[0], view)
    chart.setOption(option)
    positionLandmarks()
}

// 监听 props 变化，局部更新 series（不重新注册地图）
watch(
    () => [props.visitedPrefectures, props.activePrefecture, props.landmarks],
    updateChart,
    { deep: true }
)

// 窗口 resize
function onResize() { chart?.resize(); positionLandmarks() }

onMounted(async () => {
    document.addEventListener('pointerdown', outsideCard)
    await initChart()
    if (disposed) return
    resizeObserver = new ResizeObserver(onResize)
    if (chartEl.value) resizeObserver.observe(chartEl.value)
    window.addEventListener('resize', onResize)
})

onUnmounted(() => {
    document.removeEventListener('pointerdown', outsideCard)
    disposed = true
    resizeObserver?.disconnect()
    window.removeEventListener('resize', onResize)
    chart?.dispose()
})
</script>

<style scoped>
.map-attribution { margin:8px 0 0; font-size:10px; line-height:1.6; opacity:.75; }
.map-attribution a { color:inherit; text-decoration:underline; }
.japan-map-card {
    margin-top: 12px;
    padding: 12px;
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(var(--v-theme-surface), 0.1);
    backdrop-filter: blur(var(--leleo-blur, 10px));
}

.map-stage { position: relative; }
.japan-map-card.souvenir-map { padding: 18px 16px 14px; overflow: hidden; background: radial-gradient(ellipse at 50% 40%, #476c6955, transparent 70%), #243b42; border-color: #b6c5a733; }
.souvenir-heading { display:flex; align-items:center; justify-content:space-between; gap:12px; color:#f0e4c6; font-size:13px; letter-spacing:.1em; }
.souvenir-heading small { font-size:8px; letter-spacing:.17em; opacity:.6; }
.souvenir-map .echarts-container, .souvenir-map .map-loading { height:420px; }
.landmark-connectors { position:absolute; inset:0; width:100%; height:100%; pointer-events:none; overflow:hidden; }
.landmark-connectors path { stroke:#e1d6aa88; stroke-width:1; stroke-dasharray:3 4; fill:none; }
.landmark-connectors circle { fill:#f3dc9c; stroke:#263f40; stroke-width:2; }
.landmark-connectors .is-selected path { stroke:#ffe8ae; stroke-width:1.5; }
.landmark-model { position:absolute; width:88px; height:114px; transform:translate(-50%,-100%); display:flex; flex-direction:column; align-items:center; justify-content:flex-end; border-radius:12px; cursor:pointer; color:#f8efd8; }
.landmark-model svg { width:84px; height:90px; flex-shrink:0; filter:drop-shadow(0 5px 5px #0a202655); transition:transform .2s ease; }
.landmark-model > span:not(.miniature-scene) { display:block; max-width:96px; white-space:nowrap; font-size:10px; line-height:22px; padding:0 7px; background:#21373eeb; border:1px solid #d2c49b40; border-radius:12px; }
.landmark-model:hover svg,.landmark-model.is-selected svg { transform:translateY(-5px); }
.landmark-model.is-selected > span:not(.miniature-scene) { background:#ecdfba; color:var(--text-paper); border-color:#ecdfba; }
.landmark-model:focus-visible, .souvenir-index button:focus-visible { outline:2px solid #ffe6a4; outline-offset:3px; }
.souvenir-caption { padding-top:16px; border-top:1px solid #d4d6b32e; }
.souvenir-kicker { font-size:9px; letter-spacing:.13em; color:#d8c494; }
.souvenir-caption p { min-height:44px; margin:7px 0 10px; font-size:12px; line-height:1.9; color:#dbe2da; }
.souvenir-caption strong { margin-right:6px; color:#fff0ce; font-weight:500; }
.souvenir-caption small { display:block; margin-top:12px; font-size:10px; line-height:1.8; color:#b3c5be; }
.souvenir-index { display:flex; flex-wrap:wrap; gap:6px; }
.souvenir-index button { padding:5px 9px; font-size:10px; border:1px solid #d2c49b40; border-radius:14px; color:#c8d8cf; }
.souvenir-index button[aria-pressed=true] { background:#d5c59a22; color:#fce6ac; border-color:#cbbb8e99; }
.map-error { padding:16px; font-size:12px; text-align:center; }
.map-error button { text-decoration:underline; margin-left:8px; }
@media(max-width:600px) { .japan-map-card.souvenir-map { padding:14px 8px; } .souvenir-heading { padding:0 6px; font-size:12px; } .souvenir-heading small { font-size:7px; } .souvenir-map .echarts-container,.souvenir-map .map-loading { height:390px; } .souvenir-caption { margin:0 6px; } }
@media(prefers-reduced-motion:reduce) { .landmark-model svg { transition:none; } }

.map-title {
    font-size: 0.8rem;
    opacity: 0.8;
}

.compact-map {
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    backdrop-filter: none;
    pointer-events: none;
}
.compact-map .echarts-container,
.compact-map .map-loading { height: 210px; }

.echarts-container {
    width: 100%;
    height: clamp(240px, 45dvh, 520px);
}

.map-loading {
    height: clamp(240px, 45dvh, 520px);
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

<style scoped>
.landmark-model{padding:0;border:0;background:none;isolation:isolate;transition:filter .25s;z-index:2}
.landmark-model :deep(.miniature-scene){max-width:none;padding:0;background:none;border:0;border-radius:0;line-height:normal;height:calc(100% - 22px);transition:transform .3s cubic-bezier(.2,.8,.2,1)}
.landmark-model:hover :deep(.miniature-scene),.landmark-model:focus-visible :deep(.miniature-scene){transform:translateY(-6px) scale(1.12);filter:drop-shadow(0 9px 8px #ffdeaa44)}
.landmark-model:hover{z-index:3}.landmark-model.is-selected{z-index:4}
.memory-card{position:absolute;z-index:10;max-height:calc(100% - 16px);overflow:auto;background:#f8f2e5;color:#334b48;border:1px solid #e7d9b8;border-radius:14px;box-shadow:0 18px 55px #071e3280;outline:none}
.memory-card:focus-visible{outline:2px solid #e7ce91;outline-offset:2px}.memory-close{position:absolute;right:8px;top:8px;width:32px;height:32px;border-radius:50%;background:#183c42cc;color:white;font-size:24px;z-index:1}
.memory-image{height:168px;background:#e0dfd0}.memory-image img{width:100%;height:100%;object-fit:contain;display:block}.memory-empty{height:100%;display:flex;flex-direction:column;gap:12px;align-items:center;justify-content:center;background:radial-gradient(ellipse,#f5ecd6,#cdd9c9);font-family:serif}.memory-empty small{font:11px sans-serif;opacity:.65}
.memory-body{padding:16px}.memory-body>small{font-size:10px;letter-spacing:.08em;color:#6d7f70}.memory-body h3{font:22px Georgia,serif;margin:7px 0}.memory-body p{font-size:12px;line-height:1.7;margin:0}.memory-paging{display:flex;align-items:center;justify-content:space-between;margin-top:8px;font-size:11px}.memory-paging button{padding:8px 14px}.memory-enter-active,.memory-leave-active{transition:opacity .2s,transform .25s}.memory-enter-from,.memory-leave-to{opacity:0;transform:translateY(12px) scale(.96)}
@media(prefers-reduced-motion:reduce){.landmark-model :deep(.miniature-scene),.memory-enter-active,.memory-leave-active{transition:none}.landmark-model:hover :deep(.miniature-scene){transform:none}}
</style>
