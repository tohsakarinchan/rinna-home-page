<template>
    <div class="blog-bg">
        <v-container class="py-8" style="max-width: 860px;">

            <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/" class="mb-6">
                返回主页
            </v-btn>

            <!-- 加载中 -->
            <div v-if="loading" class="text-center py-16">
                <v-progress-circular indeterminate size="48"></v-progress-circular>
            </div>

            <template v-else>
                <!-- 封面 -->
                <v-img v-if="meta.cover" :src="meta.cover" height="380" cover rounded="lg" class="mb-6"></v-img>

                <!-- 文章头部信息 -->
                <h1 class="post-title mb-3">{{ meta.title }}</h1>
                <div class="d-flex align-center flex-wrap ga-2 mb-6">
                    <span class="text-caption" style="opacity:0.6">
                        <v-icon size="13">mdi-calendar</v-icon>
                        {{ meta.date }}
                    </span>
                    <v-chip v-for="tag in meta.tags" :key="tag" size="x-small" variant="tonal">{{ tag }}</v-chip>
                </div>

                <v-divider class="mb-6"></v-divider>

                <!-- 正文 -->
                <div class="post-content" v-html="html"></div>
            </template>

        </v-container>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const loading = ref(true)
const meta = ref({})
const html = ref('')

onMounted(async () => {
    try {
        const res = await fetch(`/api/blog-post?slug=${route.params.slug}`)
        const data = await res.json()
        meta.value = data.meta
        html.value = data.html
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

.post-title {
    font-size: 2rem;
    font-weight: bold;
    color: var(--leleo-vcard-color);
    line-height: 1.3;
}

/* 文章正文样式 */
.post-content :deep(h1),
.post-content :deep(h2),
.post-content :deep(h3) {
    color: var(--leleo-vcard-color);
    margin: 1.8rem 0 0.8rem;
}

.post-content :deep(p) {
    line-height: 1.9;
    margin-bottom: 1rem;
    opacity: 0.9;
}

.post-content :deep(img) {
    max-width: 100%;
    border-radius: 8px;
    margin: 1rem 0;
}

.post-content :deep(blockquote) {
    border-left: 4px solid var(--leleo-vcard-color);
    padding-left: 1rem;
    opacity: 0.7;
    margin: 1rem 0;
}

.post-content :deep(code) {
    background: rgba(0, 0, 0, 0.15);
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 0.9em;
}

.post-content :deep(pre) {
    background: rgba(0, 0, 0, 0.2);
    padding: 1rem;
    border-radius: 8px;
    overflow-x: auto;
}

.post-content :deep(iframe) {
    width: 100%;
    aspect-ratio: 16/9;
    border-radius: 8px;
    margin: 1rem 0;
}
</style>