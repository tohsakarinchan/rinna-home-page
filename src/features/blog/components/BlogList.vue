<template>
    <div class="travel-section">
        <!-- ── 顶部标题栏：[✈️ 旅游日记] [搜索框] [地图按钮] ── -->
        <div class="blog-inline-header">
            <div class="blog-section-title" style="color: var(--leleo-vcard-color);">
                <v-icon icon="mdi-airplane" class="mr-2"></v-icon>
                <span>旅游日记</span>
            </div>

            <!-- 搜索框，紧贴标题 -->
            <div class="blog-search-input-wrap">
                <v-text-field v-model="searchQuery" placeholder="搜索游记或地点" aria-label="搜索游记或地点" variant="outlined" rounded hide-details
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
                    class="map-trigger-btn" aria-label="打开日本足迹地图" :class="{ 'map-btn-active': activeTagNormalized }" @click="openMapDialog">
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
                <v-col cols="12" md="8" lg="8" class="pa-0 pr-md-4 order-last order-md-first">
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

                    <div v-else-if="loadError" class="text-center py-10" role="alert">
                        <p>{{ loadError }}</p>
                        <v-btn class="mt-3" variant="tonal" @click="loadInitialPosts">重新加载</v-btn>
                    </div>

                    <div v-else>
                        <v-row v-if="filteredPosts.length" class="ma-0">
                            <v-col v-for="post in filteredPosts" :key="post.id" cols="12" sm="6" :md="filteredPosts.length === 1 ? 12 : 6" :lg="filteredPosts.length === 1 ? 12 : 6"
                                :style="xs ? { padding: '6px' } : { padding: '8px' }">
                                <BlogCard :post="post" :active-tag="activeTag" :query="searchQuery" @select-tag="activeTag = $event" />
                            </v-col>
                        </v-row>

                        <div v-else class="text-center py-10">
                            <v-icon size="48" opacity="0.3">mdi-post-outline</v-icon>
                            <p class="mt-3" style="opacity:0.5">
                                {{ searchQuery.trim() ? '没有找到相关文章' : '暂无文章' }}
                            </p>
                        </div>

                        <p v-if="loadMoreError" role="alert" class="text-center mt-3">{{ loadMoreError }}</p>
                        <div v-if="hasMore && !activeTag && !searchQuery.trim()" class="text-center mt-4 mb-2">
                            <v-btn variant="tonal" :loading="loadingMore" @click="loadMore">
                                加载更多
                                <v-icon end>mdi-chevron-down</v-icon>
                            </v-btn>
                        </div>
                    </div>
                </v-col>

                <!-- 右侧标签栏（恢复，地图已移入弹窗） -->
                <v-col cols="12" md="4" lg="4" :class="xs || sm ? 'px-2 mt-0 mb-4' : 'pa-0'"
                    class="order-first order-md-last">
                    <div class="sticky-sidebar mx-0">
                        <button class="footprint-preview" type="button" aria-label="打开日本足迹地图" aria-haspopup="dialog" :aria-expanded="mapDialog" @click="openMapDialog">
                            <span class="footprint-eyebrow">JAPAN · TRAVEL JOURNAL</span>
                            <span class="footprint-heading">我的日本足迹 <v-icon size="20">mdi-arrow-top-right</v-icon></span>
                            <span class="footprint-map" aria-hidden="true">
                                <JapanPrefectureMap compact :visited-prefectures="visitedPrefectures" :active-prefecture="activeTagNormalized" />
                            </span>
                            <span class="footprint-caption">{{ visitLoading ? '正在同步足迹…' : `已点亮 ${visitedPrefectures.length} / 47 个都道府县` }}</span>
                            <span class="footprint-link">{{ visitError ? '部分记录未加载 · 打开重试' : '展开地图与到访记录' }}</span>
                        </button>
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
        <BlogFootprintDialog v-model="mapDialog" :active-tag-normalized="activeTagNormalized" :visited-prefectures="visitedPrefectures" :visit-records="visitRecords" :map-sync-error="mapSyncError" :map-sync-loading="mapSyncLoading" :visit-loading="visitLoading" :visit-error="visitError" :visit-warning="visitWarning" @select="activeTag = $event" @retry-map="retryMapSync" @retry-visits="loadVisitData" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import BlogFootprintDialog from './BlogFootprintDialog.vue'
import BlogCard from './BlogCard.vue'
import JapanPrefectureMap from '../../../shared/components/geography/JapanPrefectureMap.vue'
import { useBlogData } from '../composables/useBlogData.js'
import { useBlogFilters } from '../composables/useBlogFilters.js'
import { buildVisitSummary } from '../domain/visits.js'
import { BLOG_PAGE_SIZE as PAGE_SIZE } from '../api/blog.js'
const { xs, sm } = useDisplay()
const { posts, mapPosts, notionVisitedPlaces, notionVisitRecords, loading, loadingMore, hasMore,
  loadError, loadMoreError, visitLoading, visitError, visitWarning, mapSyncLoading, mapSyncError,
  loadInitialPosts, loadMore, loadVisitData, retryMapSync } = useBlogData()
const { searchQuery, activeTag, allTags, filteredPosts, activeTagNormalized, isTagActive } = useBlogFilters(posts)
const summary = computed(() => buildVisitSummary(mapPosts.value, notionVisitedPlaces.value, notionVisitRecords.value))
const visitedPrefectures = computed(() => summary.value.visitedPrefectures)
const visitRecords = computed(() => summary.value.visitRecords)
const mapDialog = ref(false)
function openMapDialog() { mapDialog.value = true }
function onClear() { searchQuery.value = '' }
onMounted(() => { void loadInitialPosts(); void loadVisitData() })
</script>

<style scoped src="../styles/blog-list.css"></style>
