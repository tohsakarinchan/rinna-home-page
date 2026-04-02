<template>
    <div>
        <!-- ── 顶部标题栏：[✈️ 旅游日记] [搜索框] [地图按钮] ── -->
        <div class="blog-inline-header">
            <div class="blog-section-title" style="color: var(--leleo-vcard-color);">
                <v-icon icon="mdi-airplane" class="mr-2"></v-icon>
                <span>旅游日记</span>
            </div>

            <!-- 搜索框，紧贴标题 -->
            <div class="blog-search-input-wrap">
                <v-text-field v-model="searchQuery" placeholder="搜索..." variant="outlined" rounded hide-details
                    density="compact" clearable class="blog-search-field" @click:clear="onClear">
                    <template v-slot:prepend-inner>
                        <v-icon size="16" style="opacity: 0.6;">mdi-magnify</v-icon>
                    </template>
                </v-text-field>
            </div>

            <!-- 地图按钮，紧贴搜索框 -->
            <div class="map-btn-wrap">
                <v-btn :variant="activeTagNormalized ? 'tonal' : 'outlined'"
                    :color="activeTagNormalized ? 'var(--leleo-vcard-color)' : undefined" icon size="36"
                    class="map-trigger-btn" :class="{ 'map-btn-active': activeTagNormalized }" @click="openMapDialog">
                    <v-icon size="18">mdi-map-search</v-icon>
                </v-btn>
                <transition name="badge-pop">
                    <span v-if="activeTagNormalized" class="map-active-badge"></span>
                </transition>
            </div>
        </div>

        <!-- ── 搜索提示 ─────────────────────────────────────── -->
        <transition name="fade-hint">
            <div v-if="searchQuery.trim()" class="search-hint">
                <v-icon size="13" class="mr-1">mdi-text-search</v-icon>
                搜索「{{ searchQuery.trim() }}」，共找到
                <strong>{{ filteredPosts.length }}</strong> 篇文章
                <span v-if="activeTag" style="opacity:0.7;">（已筛选标签：{{ activeTag }}）</span>
            </div>
        </transition>

        <!-- ── 主体：文章列表 + 右侧标签栏 ──────────────────── -->
        <v-container fluid class="pa-0">
            <v-row class="ma-0">

                <!-- 左侧文章列表 -->
                <v-col cols="12" md="9" lg="9" class="pa-0 pr-md-4 order-last order-md-first">
                    <div v-if="loading">
                        <v-row class="ma-0">
                            <v-col v-for="i in PAGE_SIZE" :key="i" cols="6" sm="4" md="4" lg="4"
                                :style="xs ? { padding: '6px' } : { padding: '8px' }">
                                <v-skeleton-loader type="image, list-item-two-line" rounded="lg"
                                    :style="{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }">
                                </v-skeleton-loader>
                            </v-col>
                        </v-row>
                    </div>

                    <div v-else>
                        <v-row v-if="filteredPosts.length" class="ma-0">
                            <v-col v-for="post in filteredPosts" :key="post.id" cols="6" sm="4" md="4" lg="4"
                                :style="xs ? { padding: '6px' } : { padding: '8px' }">
                                <v-card class="blog-inline-card" :to="`/blog/${post.slug}`" hover rounded="lg">
                                    <v-img :src="post.cover" aspect-ratio="1.7778" cover>
                                        <template v-slot:placeholder>
                                            <div class="d-flex align-center justify-center fill-height">
                                                <v-icon size="36" opacity="0.3">mdi-image</v-icon>
                                            </div>
                                        </template>
                                    </v-img>
                                    <v-card-text class="pa-2">
                                        <div class="d-flex align-center mb-1">
                                            <v-icon size="12" class="mr-1" opacity="0.6">mdi-calendar</v-icon>
                                            <span class="text-caption" style="opacity:0.6;font-size:0.7rem!important">
                                                {{ post.date }}
                                            </span>
                                        </div>
                                        <div class="blog-inline-title" v-html="highlight(post.title)"></div>
                                        <div class="blog-inline-summary" v-html="highlight(post.summary)"></div>
                                        <div class="mt-1">
                                            <v-chip v-for="tag in post.tags" :key="tag" size="x-small" class="mr-1"
                                                :variant="activeTag === tag ? 'elevated' : 'tonal'"
                                                @click.prevent="activeTag = tag">{{ tag }}</v-chip>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <div v-else class="text-center py-10">
                            <v-icon size="48" opacity="0.3">mdi-post-outline</v-icon>
                            <p class="mt-3" style="opacity:0.5">
                                {{ searchQuery.trim() ? '没有找到相关文章' : '暂无文章' }}
                            </p>
                        </div>

                        <div v-if="hasMore && !activeTag && !searchQuery.trim()" class="text-center mt-4 mb-2">
                            <v-btn variant="tonal" :loading="loadingMore" @click="loadMore">
                                加载更多
                                <v-icon end>mdi-chevron-down</v-icon>
                            </v-btn>
                        </div>
                    </div>
                </v-col>

                <!-- 右侧标签栏（恢复，地图已移入弹窗） -->
                <v-col cols="12" md="3" lg="3" :class="xs || sm ? 'px-2 mt-0 mb-4' : 'pa-0'"
                    class="order-first order-md-last">
                    <div class="sticky-sidebar mx-0">
                        <div class="tag-filters-container">
                            <span class="tag-label">
                                <v-icon size="small" class="mr-1">mdi-tag-multiple</v-icon>
                                游记标签
                            </span>
                            <div class="tag-filters">
                                <v-chip class="mr-1 mb-1" size="small"
                                    :variant="activeTag === '' ? 'elevated' : 'tonal'"
                                    @click="activeTag = ''">全部</v-chip>
                                <v-chip v-for="tag in allTags" :key="tag" class="mr-1 mb-1" size="small"
                                    :variant="isTagActive(tag) ? 'elevated' : 'tonal'" @click="activeTag = tag">{{ tag
                                    }}</v-chip>
                            </div>
                        </div>
                    </div>
                </v-col>

            </v-row>
        </v-container>

        <!-- ── 地图弹出 Dialog ───────────────────────────── -->
        <v-dialog v-model="mapDialog" :max-width="xs ? '95vw' : 680" :scrim-opacity="0.45">
            <template v-slot:default>
                <transition name="map-dialog-pop" appear>
                    <v-card v-if="mapDialog" class="map-dialog-card" rounded="xl">
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
                                <v-btn v-if="activeTagNormalized" size="x-small" variant="text" @click="clearMapFilter">
                                    <v-icon size="14" class="mr-1">mdi-close-circle</v-icon>
                                    清除
                                </v-btn>
                                <v-btn icon size="28" variant="text" @click="mapDialog = false">
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
                            <JapanPrefectureMap ref="prefectureMapRef" :visited-prefectures="visitedPrefectures"
                                :active-prefecture="activeTagNormalized" :visit-records="visitRecords"
                                @select="onSelectPrefectureFromMap" />
                        </div>

                        <div class="map-dialog-footer">
                            <span style="font-size:0.7rem;opacity:0.5;">点击都道府县进行筛选，再次点击取消</span>
                        </div>

                        <div class="map-zoom-control">
                            <div class="map-zoom-bar">
                                <v-btn icon size="32" variant="text" @click="zoomOutMap">
                                    <v-icon size="16">mdi-minus</v-icon>
                                </v-btn>
                                <v-btn variant="text" size="small" class="px-2" style="min-width:0;"
                                    @click="resetMapView">
                                    {{ prefectureMapRef?.map_zoom ? (Math.round(prefectureMapRef.map_zoom * 10) /
                                        10).toFixed(1) + 'x' : '比例' }}
                                </v-btn>
                                <v-btn icon size="32" variant="text" @click="zoomInMap">
                                    <v-icon size="16">mdi-plus</v-icon>
                                </v-btn>
                            </div>
                        </div>
                    </v-card>
                </transition>
            </template>
        </v-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import JapanPrefectureMap from './JapanPrefectureMap.vue'
import { normalizePrefectureTag } from '../constants/prefectures'

const { xs, sm } = useDisplay()

const posts = ref([])
const mapPosts = ref([])
const loading = ref(true)
const activeTag = ref('')
const loadingMore = ref(false)
const hasMore = ref(false)
const nextCursor = ref(null)
const PAGE_SIZE = 6

const searchQuery = ref('')

const mapDialog = ref(false)
const prefectureMapRef = ref(null)
const selectFeedback = ref('')

function openMapDialog() { mapDialog.value = true }
function zoomInMap() { prefectureMapRef.value?.zoomIn?.() }
function zoomOutMap() { prefectureMapRef.value?.zoomOut?.() }
function resetMapView() { prefectureMapRef.value?.resetView?.() }
function clearMapFilter() { activeTag.value = '' }

function onSelectPrefectureFromMap(prefecture) {
    const isDeselect = activeTagNormalized.value === prefecture
    if (isDeselect) {
        activeTag.value = ''
        selectFeedback.value = '已清除筛选'
    } else {
        activeTag.value = prefecture
        selectFeedback.value = prefecture
    }
    setTimeout(() => {
        selectFeedback.value = ''
        mapDialog.value = false
    }, 850)
}

function onClear() { searchQuery.value = '' }

function fuzzyMatch(text = '', query = '') {
    if (!query.trim()) return true
    return query.trim().toLowerCase().split(/\s+/).every(t => text.toLowerCase().includes(t))
}

function highlight(text = '') {
    if (!searchQuery.value.trim()) return escapeHtml(text)
    const terms = searchQuery.value.trim().split(/\s+/).filter(Boolean)
    let result = escapeHtml(text)
    terms.forEach(term => {
        result = result.replace(new RegExp(`(${escapeReg(term)})`, 'gi'), '<mark class="search-highlight">$1</mark>')
    })
    return result
}

function escapeHtml(str = '') {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
function escapeReg(str = '') {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function parseVisitTimestamp(input = '') {
    const ts = Date.parse(String(input || '').trim())
    return Number.isFinite(ts) ? ts : Number.NaN
}

function formatVisitDate(input = '') {
    const ts = parseVisitTimestamp(input)
    if (!Number.isFinite(ts)) return input || '--'
    const pad = n => String(n).padStart(2, '0')
    const d = new Date(ts)
    const hasTime = /T|\s/.test(String(input))
    return hasTime
        ? `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
        : `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())}`
}

function mergeMapPosts(nextPosts = []) {
    if (!Array.isArray(nextPosts) || !nextPosts.length) return
    const map = new Map(mapPosts.value.map(item => [item.id, item]))
    nextPosts.forEach(item => { if (item?.id) map.set(item.id, item) })
    mapPosts.value = [...map.values()]
}

const allTags = computed(() => {
    const set = new Set()
    posts.value.forEach(p => p.tags.forEach(t => set.add(t)))
    return [...set]
})

const filteredPosts = computed(() => {
    let list = posts.value
    if (activeTag.value) {
        const norm = activeTagNormalized.value
        list = list.filter(p =>
            p.tags.some(tag => tag === activeTag.value || (norm && normalizePrefectureTag(tag) === norm))
        )
    }
    const q = searchQuery.value.trim()
    if (q) {
        list = list.filter(p =>
            fuzzyMatch(p.title, q) || fuzzyMatch(p.summary, q) || p.tags.some(t => fuzzyMatch(t, q))
        )
    }
    return list
})

const activeTagNormalized = computed(() => normalizePrefectureTag(activeTag.value))

const visitedPrefectures = computed(() => {
    const set = new Set()
    mapPosts.value.forEach(post => {
        post.tags.forEach(tag => { const n = normalizePrefectureTag(tag); if (n) set.add(n) })
    })
    return [...set]
})

const visitRecords = computed(() => {
    const firstVisit = new Map()
    mapPosts.value.forEach(post => {
        const ts = parseVisitTimestamp(post.date)
        if (!Number.isFinite(ts)) return
        post.tags.forEach(tag => {
            const n = normalizePrefectureTag(tag)
            if (!n) return
            const prev = firstVisit.get(n)
            if (!prev || ts < prev.ts) firstVisit.set(n, { name: n, ts, rawDate: post.date })
        })
    })
    return [...firstVisit.values()]
        .sort((a, b) => b.ts - a.ts)
        .map(item => ({ name: item.name, firstVisitLabel: formatVisitDate(item.rawDate) }))
})

function isTagActive(tag) {
    if (activeTag.value === tag) return true
    const n = normalizePrefectureTag(tag)
    return Boolean(n && n === activeTagNormalized.value)
}

async function fetchPosts(cursor = null, pageSize = PAGE_SIZE) {
    const params = new URLSearchParams({ page_size: pageSize })
    if (cursor) params.append('cursor', cursor)
    return (await fetch(`/api/blog-list?${params}`)).json()
}

async function syncAllMapPosts(initialPage) {
    mergeMapPosts(initialPage.posts ?? [])
    let cursor = initialPage.has_more ? initialPage.next_cursor : null
    while (cursor) {
        const data = await fetchPosts(cursor, 100)
        mergeMapPosts(data.posts ?? [])
        cursor = data.has_more ? data.next_cursor : null
    }
}

async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
        const data = await fetchPosts(nextCursor.value)
        posts.value = [...posts.value, ...data.posts]
        mergeMapPosts(data.posts ?? [])
        hasMore.value = data.has_more
        nextCursor.value = data.next_cursor
    } catch (e) {
        console.error('加载更多失败', e)
    } finally {
        loadingMore.value = false
    }
}

onMounted(async () => {
    try {
        const data = await fetchPosts()
        posts.value = data.posts ?? []
        mapPosts.value = data.posts ?? []
        hasMore.value = data.has_more
        nextCursor.value = data.next_cursor
        syncAllMapPosts(data).catch(e => console.warn('Map sync failed:', e))
    } catch (e) {
        console.error('博客列表加载失败', e)
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
/* ── 顶部标题栏 ───────────────────────────────────────────
   justify-content: flex-start → 三者从左到右紧凑排列
   gap 控制间距，不用 space-between
────────────────────────────────────────────────────────── */
.blog-inline-header {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 8px;
    margin: 12px 12px 10px 12px;
    flex-wrap: wrap;
}

.blog-section-title {
    display: flex;
    align-items: center;
    font-size: 1.25rem;
    font-weight: 600;
    padding: 4px 0;
    letter-spacing: 0.05em;
    flex-shrink: 0;
    white-space: nowrap;
}

.blog-search-input-wrap {
    width: 180px;
    flex-shrink: 0;
}

.blog-search-field :deep(.v-field) {
    background: rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(10px);
}

.blog-search-field :deep(.v-field__outline) {
    --v-field-border-opacity: 0.25;
}

/* ── 地图按钮 ─────────────────────────────────────────── */
.map-btn-wrap {
    position: relative;
    flex-shrink: 0;
}

.map-trigger-btn {
    transition: box-shadow 0.3s, transform 0.2s;
}

.map-btn-active {
    box-shadow: 0 0 10px var(--leleo-vcard-color, rgba(255, 255, 255, 0.5));
    animation: map-btn-pulse 2s ease-in-out infinite;
}

@keyframes map-btn-pulse {

    0%,
    100% {
        box-shadow: 0 0 6px var(--leleo-vcard-color, rgba(255, 255, 255, 0.4));
    }

    50% {
        box-shadow: 0 0 14px var(--leleo-vcard-color, rgba(255, 255, 255, 0.7));
    }
}

.map-active-badge {
    position: absolute;
    top: 2px;
    right: 2px;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--leleo-vcard-color, #4bdabe);
    border: 1.5px solid rgba(0, 0, 0, 0.3);
    pointer-events: none;
}

.badge-pop-enter-active {
    animation: badge-pop-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.badge-pop-leave-active {
    animation: badge-pop-out 0.2s ease-in;
}

@keyframes badge-pop-in {
    from {
        transform: scale(0);
        opacity: 0;
    }

    to {
        transform: scale(1);
        opacity: 1;
    }
}

@keyframes badge-pop-out {
    from {
        transform: scale(1);
        opacity: 1;
    }

    to {
        transform: scale(0);
        opacity: 0;
    }
}

/* ── 右侧标签栏 ────────────────────────────────────────── */
.sticky-sidebar {
    position: sticky;
    top: 16px;
}

.tag-filters-container {
    display: flex;
    flex-direction: column;
    background: rgba(var(--v-theme-surface), 0.1);
    backdrop-filter: blur(var(--leleo-blur, 10px));
    border-radius: 12px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    width: fit-content;
}

.tag-label {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-bottom: 6px;
    align-self: flex-start;
}

.tag-filters {
    display: flex;
    flex-wrap: wrap;
    align-items: flex-start;
}

/* ── 搜索提示 ──────────────────────────────────────────── */
.search-hint {
    margin: 0 12px 8px;
    font-size: 0.78rem;
    opacity: 0.7;
    display: flex;
    align-items: center;
}

.fade-hint-enter-active,
.fade-hint-leave-active {
    transition: opacity 0.2s, transform 0.2s;
}

.fade-hint-enter-from,
.fade-hint-leave-to {
    opacity: 0;
    transform: translateY(-4px);
}

/* ── 地图弹窗 ──────────────────────────────────────────── */
.map-dialog-card {
    background: rgba(30, 30, 40, 0.82) !important;
    backdrop-filter: blur(20px) !important;
    border: 1px solid rgba(255, 255, 255, 0.12);
    overflow: hidden;
    position: relative;
}

.map-dialog-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 12px 8px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.map-dialog-title {
    display: flex;
    align-items: center;
    font-size: 0.85rem;
    font-weight: 600;
    opacity: 0.9;
}

.map-dialog-body {
    padding: 8px 12px 0;
}

.map-dialog-footer {
    padding: 6px 64px 12px 12px;
    text-align: center;
}

.map-zoom-control {
    position: absolute;
    right: 12px;
    bottom: 12px;
    z-index: 12;
}

.map-zoom-bar {
    display: flex;
    align-items: center;
    background: rgba(30, 30, 40, 0.85);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.16);
    border-radius: 20px;
    padding: 2px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.map-dialog-pop-enter-active {
    animation: dialog-expand 0.32s cubic-bezier(0.34, 1.46, 0.64, 1);
    transform-origin: top right;
}

.map-dialog-pop-leave-active {
    animation: dialog-collapse 0.22s cubic-bezier(0.4, 0, 1, 1);
    transform-origin: top right;
}

@keyframes dialog-expand {
    from {
        opacity: 0;
        transform: scale(0.7) translateY(-16px);
    }

    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

@keyframes dialog-collapse {
    from {
        opacity: 1;
        transform: scale(1) translateY(0);
    }

    to {
        opacity: 0;
        transform: scale(0.7) translateY(-12px);
    }
}

.select-feedback-overlay {
    position: absolute;
    inset: 0;
    z-index: 10;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(4px);
    border-radius: inherit;
    pointer-events: none;
}

.select-feedback-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    background: rgba(20, 20, 28, 0.65);
    padding: 24px 48px;
    border-radius: 24px;
    border: 1.5px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6), 0 0 40px var(--leleo-vcard-color, rgba(255, 255, 255, 0.2));
}

.select-feedback-text {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--leleo-vcard-color, #fff);
    letter-spacing: 0.1em;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.select-flash-enter-active {
    animation: stamp-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
}

.select-flash-leave-active {
    animation: stamp-out 0.25s ease-in both;
}

@keyframes stamp-in {
    0% {
        opacity: 0;
        transform: scale(3.5) rotate(-15deg);
        filter: blur(8px);
    }

    50% {
        opacity: 1;
        transform: scale(0.9) rotate(5deg);
        filter: blur(0px);
    }

    100% {
        opacity: 1;
        transform: scale(1) rotate(0);
        filter: blur(0px);
    }
}

@keyframes stamp-out {
    0% {
        opacity: 1;
        transform: scale(1);
    }

    100% {
        opacity: 0;
        transform: scale(1.6);
        filter: blur(6px);
    }
}

/* ── 关键词高亮 ────────────────────────────────────────── */
:deep(.search-highlight) {
    background: var(--leleo-vcard-color);
    color: #000;
    border-radius: 2px;
    padding: 0 2px;
    font-style: normal;
}

/* ── 文章卡片 ──────────────────────────────────────────── */
.blog-inline-card {
    transition: transform 0.2s;
    text-decoration: none;
}

.blog-inline-card:hover {
    transform: translateY(-3px);
}

.blog-inline-title {
    font-size: 0.85rem;
    font-weight: bold;
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin-bottom: 4px;
}

.blog-inline-summary {
    font-size: 0.72rem;
    opacity: 0.65;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>