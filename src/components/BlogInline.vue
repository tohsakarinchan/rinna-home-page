<template>
    <div>
        <div class="blog-inline-header">
            <!-- 左侧标题 -->
            <div class="blog-section-title" style="color: var(--leleo-vcard-color);">
                <v-icon icon="mdi-airplane" class="mr-2"></v-icon>
                <span>旅游日记</span>
            </div>

            <!-- 搜索框 -->
            <div class="blog-search-input-wrap">
                <v-text-field v-model="searchQuery" placeholder="搜索标题、摘要、标签..." variant="outlined" rounded hide-details
                    density="compact" clearable class="blog-search-field" @click:clear="onClear">
                    <template v-slot:prepend-inner>
                        <v-icon size="16" style="opacity: 0.6;">mdi-magnify</v-icon>
                    </template>
                </v-text-field>
            </div>
        </div>

        <!-- 当前搜索关键词提示 -->
        <transition name="fade-hint">
            <div v-if="searchQuery.trim()" class="search-hint">
                <v-icon size="13" class="mr-1">mdi-text-search</v-icon>
                搜索「{{ searchQuery.trim() }}」，共找到
                <strong>{{ filteredPosts.length }}</strong> 篇文章
                <span v-if="activeTag" style="opacity:0.7;">（已筛选标签：{{ activeTag }}）</span>
            </div>
        </transition>

        <JapanPrefectureMap class="blog-map-section" :visited-prefectures="visitedPrefectures"
            :active-prefecture="activeTagNormalized" @select="onSelectPrefecture"></JapanPrefectureMap>

        <div class="tag-filters-container">
            <span class="tag-label">
                <v-icon size="small" class="mr-1">mdi-tag-multiple</v-icon>
                游记标签
            </span>
            <div class="tag-filters">
                <v-chip class="mr-1 mb-1" size="small" :variant="activeTag === '' ? 'elevated' : 'tonal'"
                    @click="activeTag = ''">全部</v-chip>
                <v-chip v-for="tag in allTags" :key="tag" class="mr-1 mb-1" size="small"
                    :variant="isTagActive(tag) ? 'elevated' : 'tonal'" @click="activeTag = tag">{{ tag }}</v-chip>
            </div>
        </div>

        <v-container fluid class="pa-0">
            <v-row class="ma-0">
                <!-- 文章列表区域 -->
                <v-col cols="12" class="pa-0">
                    <!-- 加载中 -->
                    <div v-if="loading">
                        <v-row class="ma-0">
                            <v-col v-for="i in PAGE_SIZE" :key="i" cols="6" sm="4" md="4" lg="4"
                                :style="xs ? { padding: '6px' } : { padding: '8px' }">
                                <v-skeleton-loader type="image, list-item-two-line" rounded="lg" :style="{
                                    background: 'rgba(255,255,255,0.05)',
                                    backdropFilter: 'blur(10px)'
                                }"></v-skeleton-loader>
                            </v-col>
                        </v-row>
                    </div>

                    <!-- 文章卡片网格 -->
                    <div v-else>
                        <v-row v-if="filteredPosts.length" class="ma-0">
                            <v-col v-for="post in filteredPosts" :key="post.id" cols="6" sm="4" md="4" lg="4"
                                :style="xs ? { padding: '6px' } : { padding: '8px' }">
                                <v-card class="blog-inline-card" :to="`/blog/${post.slug}`" hover rounded="lg">
                                    <!-- 封面图 -->
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
                                            <span class="text-caption" style="opacity:0.6;font-size:0.7rem!important">{{
                                                post.date
                                            }}</span>
                                        </div>
                                        <!-- 标题：搜索时高亮关键词 -->
                                        <div class="blog-inline-title" v-html="highlight(post.title)"></div>
                                        <!-- 摘要：搜索时高亮关键词 -->
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

                        <!-- 空状态 -->
                        <div v-else class="text-center py-10">
                            <v-icon size="48" opacity="0.3">mdi-post-outline</v-icon>
                            <p class="mt-3" style="opacity:0.5">
                                {{ searchQuery.trim() ? '没有找到相关文章' : '暂无文章' }}
                            </p>
                        </div>

                        <!-- 搜索中不显示加载更多 -->
                        <div v-if="hasMore && !activeTag && !searchQuery.trim()" class="text-center mt-4 mb-2">
                            <v-btn variant="tonal" :loading="loadingMore" @click="loadMore">
                                加载更多
                                <v-icon end>mdi-chevron-down</v-icon>
                            </v-btn>
                        </div>
                    </div>
                </v-col>

            </v-row>
        </v-container>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import JapanPrefectureMap from './JapanPrefectureMap.vue'
import { normalizePrefectureTag } from '../constants/prefectures'

const { xs, sm } = useDisplay()

const posts = ref([])
const loading = ref(true)
const activeTag = ref('')
const loadingMore = ref(false)
const hasMore = ref(false)
const nextCursor = ref(null)
const PAGE_SIZE = 6

// 搜索状态
const searchQuery = ref('')

function onClear() {
    searchQuery.value = ''
}

/**
 * 将查询字符串拆成词组，对文本做大小写不敏感的模糊匹配
 * 返回是否命中
 */
function fuzzyMatch(text = '', query = '') {
    if (!query.trim()) return true
    const terms = query.trim().toLowerCase().split(/\s+/)
    const t = text.toLowerCase()
    return terms.every(term => t.includes(term))
}

/**
 * 在文本中高亮匹配的关键词（返回 HTML 字符串）
 */
function highlight(text = '') {
    if (!searchQuery.value.trim()) return escapeHtml(text)
    const terms = searchQuery.value.trim().split(/\s+/).filter(Boolean)
    let result = escapeHtml(text)
    terms.forEach(term => {
        const reg = new RegExp(`(${escapeReg(term)})`, 'gi')
        result = result.replace(reg, '<mark class="search-highlight">$1</mark>')
    })
    return result
}

function escapeHtml(str = '') {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function escapeReg(str = '') {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const allTags = computed(() => {
    const set = new Set()
    posts.value.forEach(p => p.tags.forEach(t => set.add(t)))
    return [...set]
})

const filteredPosts = computed(() => {
    let list = posts.value

    // 标签筛选
    if (activeTag.value) {
        const normalizedActive = activeTagNormalized.value
        list = list.filter(p =>
            p.tags.some(tag =>
                tag === activeTag.value || (normalizedActive && normalizePrefectureTag(tag) === normalizedActive)
            )
        )
    }

    // 关键词搜索：匹配标题、摘要、标签
    const q = searchQuery.value.trim()
    if (q) {
        list = list.filter(p =>
            fuzzyMatch(p.title, q) ||
            fuzzyMatch(p.summary, q) ||
            p.tags.some(t => fuzzyMatch(t, q))
        )
    }

    return list
})

const activeTagNormalized = computed(() => normalizePrefectureTag(activeTag.value))

const visitedPrefectures = computed(() => {
    const set = new Set()
    posts.value.forEach(post => {
        post.tags.forEach(tag => {
            const normalized = normalizePrefectureTag(tag)
            if (normalized) set.add(normalized)
        })
    })
    return [...set]
})

function isTagActive(tag) {
    if (activeTag.value === tag) return true
    const normalizedTag = normalizePrefectureTag(tag)
    return Boolean(normalizedTag && normalizedTag === activeTagNormalized.value)
}

function onSelectPrefecture(prefecture) {
    activeTag.value = activeTagNormalized.value === prefecture ? '' : prefecture
}

async function fetchPosts(cursor = null) {
    const params = new URLSearchParams({ page_size: PAGE_SIZE })
    if (cursor) params.append('cursor', cursor)
    const res = await fetch(`/api/blog-list?${params}`)
    const data = await res.json()
    return data
}

async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
        const data = await fetchPosts(nextCursor.value)
        posts.value = [...posts.value, ...data.posts]
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
        hasMore.value = data.has_more
        nextCursor.value = data.next_cursor
    } catch (e) {
        console.error('博客列表加载失败', e)
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
.blog-inline-header {
    display: flex;
    align-items: center;
    margin: 12px 12px 16px 12px;
    gap: 4px;
}

.blog-section-title {
    display: flex;
    align-items: center;
    font-size: 1.25rem;
    font-weight: 600;
    padding: 4px 8px;
    letter-spacing: 0.05em;
}

.blog-search-input-wrap {
    width: 220px;
}

.blog-search-field :deep(.v-field) {
    background: rgba(255, 255, 255, 0.07);
    backdrop-filter: blur(10px);
}

.blog-search-field :deep(.v-field__outline) {
    --v-field-border-opacity: 0.25;
}

/* 搜索命中数提示 */
.search-hint {
    margin: 0 12px 10px;
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

/* 关键词高亮 */
:deep(.search-highlight) {
    background: var(--leleo-vcard-color);
    color: #000;
    border-radius: 2px;
    padding: 0 2px;
    font-style: normal;
}

.blog-map-section {
    margin: 0 12px 10px;
}

/* 标签栏 */
.tag-filters-container {
    display: flex;
    flex-direction: column;
    background: rgba(var(--v-theme-surface), 0.1);
    backdrop-filter: blur(var(--leleo-blur, 10px));
    border-radius: 12px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    width: calc(100% - 24px);
    margin: 0 12px 14px;
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

/* 卡片 */
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
