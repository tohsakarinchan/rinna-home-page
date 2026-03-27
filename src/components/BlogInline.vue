<template>
    <div>
        <div class="blog-inline-header">
            <!-- 左侧标题 -->
            <div class="blog-section-title" style="color: var(--leleo-vcard-color);">
                <v-icon icon="mdi-airplane" class="mr-2"></v-icon>
                <span>旅游日记</span>
            </div>
        </div>

        <v-container fluid class="pa-0">
            <v-row class="ma-0">
                <!-- 左侧文章列表区域 (手机端排第二，PC端排第一) -->
                <v-col cols="12" md="9" lg="9" class="pa-0 pr-md-4 order-last order-md-first">
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
                                        <div class="blog-inline-title">{{ post.title }}</div>
                                        <div class="blog-inline-summary">{{ post.summary }}</div>
                                        <div class="mt-1">
                                            <v-chip v-for="tag in post.tags" :key="tag" size="x-small" class="mr-1"
                                                variant="tonal">{{ tag }}</v-chip>
                                        </div>
                                    </v-card-text>
                                </v-card>
                            </v-col>
                        </v-row>

                        <!-- 空状态 -->
                        <div v-else class="text-center py-10">
                            <v-icon size="48" opacity="0.3">mdi-post-outline</v-icon>
                            <p class="mt-3" style="opacity:0.5">暂无文章</p>
                        </div>

                        <!-- 加载更多按钮 -->
                        <div v-if="hasMore && !activeTag" class="text-center mt-4 mb-2">
                            <v-btn variant="tonal" :loading="loadingMore" @click="loadMore">
                                加载更多
                                <v-icon end>mdi-chevron-down</v-icon>
                            </v-btn>
                        </div>
                    </div>
                </v-col>

                <!-- 右侧标签栏 (手机端排第一，PC端排第二) -->
                <v-col cols="12" md="3" lg="3" :class="xs || sm ? 'px-2 mt-0 mb-4' : 'pa-0'"
                    class="order-first order-md-last">
                    <div class="tag-filters-container sticky-sidebar mx-0">
                        <span class="tag-label">
                            <v-icon size="small" class="mr-1">mdi-tag-multiple</v-icon>
                            游记标签
                        </span>
                        <div class="tag-filters">
                            <v-chip class="mr-1 mb-1" size="small" :variant="activeTag === '' ? 'elevated' : 'tonal'"
                                @click="activeTag = ''">全部</v-chip>
                            <v-chip v-for="tag in allTags" :key="tag" class="mr-1 mb-1" size="small"
                                :variant="activeTag === tag ? 'elevated' : 'tonal'" @click="activeTag = tag">{{ tag
                                }}</v-chip>
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

const { xs, sm } = useDisplay()

const posts = ref([])
const loading = ref(true)
const activeTag = ref('')
const loadingMore = ref(false)
const hasMore = ref(false)
const nextCursor = ref(null)
const PAGE_SIZE = 6

const allTags = computed(() => {
    const set = new Set()
    posts.value.forEach(p => p.tags.forEach(t => set.add(t)))
    return [...set]
})

const filteredPosts = computed(() => {
    if (!activeTag.value) return posts.value
    return posts.value.filter(p => p.tags.includes(activeTag.value))
})

// 初始加载
async function fetchPosts(cursor = null) {
    const params = new URLSearchParams({ page_size: PAGE_SIZE })
    if (cursor) params.append('cursor', cursor)

    const res = await fetch(`/api/blog-list?${params}`)
    const data = await res.json()
    return data
}

// 加载更多
async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
        const data = await fetchPosts(nextCursor.value)
        posts.value = [...posts.value, ...data.posts]  // 追加到现有列表
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
}

.blog-section-title {
    display: flex;
    align-items: center;
    font-size: 1.25rem;
    font-weight: 600;
    padding: 4px 8px;
    letter-spacing: 0.05em;
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

.sticky-sidebar {
    position: sticky;
    top: 16px;
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
