<template>
    <div class="blog-bg">
        <v-container class="py-8">

            <!-- 顶部标题 -->
            <div class="blog-header mb-8">
                <v-btn variant="text" prepend-icon="mdi-arrow-left" :to="'/'">返回主页</v-btn>
                <h1 class="blog-title mt-4">旅游日记</h1>
                <p class="blog-subtitle">记录走过的地方</p>
            </div>

            <!-- 标签筛选 -->
            <div class="mb-6">
                <v-chip class="mr-2 mb-2" :variant="activeTag === '' ? 'elevated' : 'tonal'"
                    @click="activeTag = ''">全部</v-chip>
                <v-chip v-for="tag in allTags" :key="tag" class="mr-2 mb-2"
                    :variant="activeTag === tag ? 'elevated' : 'tonal'" @click="activeTag = tag">{{ tag }}</v-chip>
            </div>

            <!-- 加载中 -->
            <div v-if="loading" class="text-center py-16">
                <v-progress-circular indeterminate size="48"></v-progress-circular>
            </div>

            <!-- 文章列表 -->
            <v-row v-else>
                <v-col v-for="post in filteredPosts" :key="post.id" cols="12" sm="6" lg="4">
                    <v-card class="blog-card" :to="`/blog/${post.slug}`" hover rounded="lg">
                        <!-- 封面图 -->
                        <v-img :src="post.cover" height="200" cover class="blog-card-cover">
                            <template v-slot:placeholder>
                                <div class="d-flex align-center justify-center fill-height">
                                    <v-icon size="48" opacity="0.3">mdi-image</v-icon>
                                </div>
                            </template>
                        </v-img>

                        <v-card-text>
                            <div class="d-flex align-center mb-2">
                                <v-icon size="14" class="mr-1" opacity="0.6">mdi-calendar</v-icon>
                                <span class="text-caption" style="opacity:0.6">{{ post.date }}</span>
                            </div>
                            <h3 class="blog-card-title mb-2">{{ post.title }}</h3>
                            <p class="blog-card-summary">{{ post.summary }}</p>
                            <div class="mt-3">
                                <v-chip v-for="tag in post.tags" :key="tag" size="x-small" class="mr-1"
                                    variant="tonal">{{ tag }}</v-chip>
                            </div>
                        </v-card-text>
                    </v-card>
                </v-col>
            </v-row>

            <!-- 空状态 -->
            <div v-if="!loading && filteredPosts.length === 0" class="text-center py-16">
                <v-icon size="64" opacity="0.3">mdi-post-outline</v-icon>
                <p class="mt-4" style="opacity:0.5">暂无文章</p>
            </div>

        </v-container>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const posts = ref([])
const loading = ref(true)
const activeTag = ref('')

const allTags = computed(() => {
    const set = new Set()
    posts.value.forEach(p => p.tags.forEach(t => set.add(t)))
    return [...set]
})

const filteredPosts = computed(() => {
    if (!activeTag.value) return posts.value
    return posts.value.filter(p => p.tags.includes(activeTag.value))
})

onMounted(async () => {
    try {
        const res = await fetch('/api/blog-list')
        const data = await res.json()
        posts.value = data.posts
    } catch (e) {
        console.error('加载失败', e)
    } finally {
        loading.value = false
    }
})
</script>

<style scoped>
.blog-bg {
    min-height: 100vh;
    background: var(--leleo-background-image-url) center/cover;
}

.blog-header {
    text-align: center;
}

.blog-title {
    font-size: 2.5rem;
    font-weight: bold;
    color: var(--leleo-vcard-color);
}

.blog-subtitle {
    opacity: 0.7;
    font-size: 1rem;
}

.blog-card {
    transition: transform 0.2s;
    backdrop-filter: blur(var(--leleo-blur));
    text-decoration: none;
}

.blog-card:hover {
    transform: translateY(-4px);
}

.blog-card-title {
    font-size: 1.1rem;
    font-weight: bold;
    line-height: 1.4;
}

.blog-card-summary {
    font-size: 0.85rem;
    opacity: 0.7;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}
</style>