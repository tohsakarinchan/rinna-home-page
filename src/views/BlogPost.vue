<template>
    <!-- 阅读进度条 -->
    <div class="reading-progress-bar" :style="{ width: progress + '%' }"></div>

    <div class="blog-bg">
        <v-container class="py-8" style="max-width: 860px;">

            <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/" class="mb-6">
                返回主页
            </v-btn>

            <div v-if="loading" class="text-center py-16">
                <v-progress-circular indeterminate size="48"></v-progress-circular>
            </div>

            <template v-else>
                <v-img v-if="meta.cover" :src="meta.cover" height="380" cover rounded="lg" class="mb-6"></v-img>

                <h1 class="post-title mb-3">{{ meta.title }}</h1>
                <div class="d-flex align-center flex-wrap ga-2 mb-6">
                    <span class="text-caption" style="opacity:0.6">
                        <v-icon size="13">mdi-calendar</v-icon>
                        {{ meta.date }}
                    </span>
                    <v-chip v-for="tag in meta.tags" :key="tag" size="x-small" variant="tonal">{{ tag }}</v-chip>
                </div>

                <v-divider class="mb-6"></v-divider>

                <!-- 有目录时用两栏布局，没有目录时单栏 -->
                <div :class="toc.length ? 'post-layout' : ''">

                    <!-- 正文 -->
                    <div class="post-content" ref="postContent" v-html="html"></div>

                    <!-- 目录 -->
                    <div v-if="toc.length" class="toc-container">
                        <div class="toc-inner">
                            <div class="toc-title">
                                <v-icon size="16" class="mr-1">mdi-format-list-bulleted</v-icon>
                                目录
                            </div>
                            <ul class="toc-list">
                                <li v-for="item in toc" :key="item.id"
                                    :class="['toc-item', `toc-${item.level.toLowerCase()}`, { 'toc-active': activeHeading === item.id }]">
                                    <a :href="`#${item.id}`" @click.prevent="scrollToHeading(item.id)">
                                        {{ item.text }}
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </template>

        </v-container>
    </div>

    <!-- 图片放大 dialog -->
    <v-dialog v-model="lightbox" max-width="90vw" @click:outside="lightbox = false">
        <div class="lightbox-wrapper" @click="lightbox = false">
            <img :src="lightboxSrc" class="lightbox-img" @click.stop />
            <v-btn icon variant="tonal" class="lightbox-close" @click="lightbox = false">
                <v-icon>mdi-close</v-icon>
            </v-btn>
        </div>
    </v-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { setMeta } from '../utils/common.js'
import config from '../config.js'

const route = useRoute()
const loading = ref(true)
const meta = ref({})
const html = ref('')
const postContent = ref(null)   // 正文容器的 ref

// 进度条
const progress = ref(0)
function updateProgress() {
    const el = document.documentElement
    const total = el.scrollHeight - el.clientHeight
    progress.value = total > 0 ? Math.min((el.scrollTop / total) * 100, 100) : 0
}

// 图片放大
const lightbox = ref(false)
const lightboxSrc = ref('')

function setupImageClick() {
    if (!postContent.value) return
    const imgs = postContent.value.querySelectorAll('img')
    imgs.forEach(img => {
        img.style.cursor = 'zoom-in'
        img.addEventListener('click', () => {
            lightboxSrc.value = img.src
            lightbox.value = true
        })
    })
}

// 目录
const toc = ref([])
const activeHeading = ref('')

function buildToc() {
    if (!postContent.value) return
    const headings = postContent.value.querySelectorAll('h1, h2, h3')
    toc.value = [...headings].map((el, index) => {
        // 给每个标题加上 id，方便锚点跳转
        const id = `heading-${index}`
        el.id = id
        return {
            id,
            text: el.textContent,
            level: el.tagName,   // H1 / H2 / H3
        }
    })
}

function scrollToHeading(id) {
    const el = document.getElementById(id)
    if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
}

// 滚动时高亮当前所在的目录项
function updateActiveHeading() {
    if (!postContent.value) return
    const headings = postContent.value.querySelectorAll('h1, h2, h3')
    let current = ''
    headings.forEach(el => {
        const rect = el.getBoundingClientRect()
        if (rect.top <= 120) {   // 距顶部 120px 以内就算进入
            current = el.id
        }
    })
    activeHeading.value = current

    // 顺便更新进度条
    updateProgress()
}

onMounted(async () => {
    window.addEventListener('scroll', updateActiveHeading, { passive: true })

    try {
        const res = await fetch(`/api/blog-post?slug=${route.params.slug}`)
        const data = await res.json()
        meta.value = data.meta
        html.value = data.html

        //文章加载完后设置 meta
        setMeta(
            meta.value.title,
            meta.value.summary || meta.value.title,
            meta.value.tags?.join(',') || '',
            '/favicon.ico'
        )

        // 等 v-html 渲染完再操作 DOM
        await nextTick()
        setupImageClick()
        buildToc()
    } catch (e) {
        console.error('加载失败', e)
    } finally {
        loading.value = false
    }
})

onUnmounted(() => {
    window.removeEventListener('scroll', updateActiveHeading)

    // 还原回主页默认 meta
    setMeta(
        config.metaData.title,
        config.metaData.description,
        config.metaData.keywords,
        config.metaData.icon
    )
})
</script>

<style scoped>
/* 进度条 */
.reading-progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    height: 3px;
    background: var(--leleo-vcard-color);
    transition: width 0.1s linear;
    z-index: 9999;
    border-radius: 0 2px 2px 0;
}

.blog-bg {
    min-height: 100vh;
    background-color: #1a1a2e;
    background-image: var(--leleo-background-image-url, none);
    background-size: cover;
    background-position: center;
}

.post-title {
    font-size: 2rem;
    font-weight: bold;
    color: var(--leleo-vcard-color);
    line-height: 1.3;
}

/* 有目录时正文和目录并排 */
.post-layout {
    display: flex;
    gap: 32px;
    align-items: flex-start;
}

.post-content {
    flex: 1;
    min-width: 0;
    /* 防止内容溢出 */
}

/* 目录 */
.toc-container {
    width: 220px;
    flex-shrink: 0;
}

.toc-inner {
    position: sticky;
    top: 24px;
    background: rgba(0, 0, 0, 0.2);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 16px;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.toc-title {
    font-size: 0.8rem;
    font-weight: bold;
    opacity: 0.7;
    margin-bottom: 10px;
    display: flex;
    align-items: center;
}

.toc-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.toc-item a {
    display: block;
    font-size: 0.78rem;
    opacity: 0.6;
    text-decoration: none;
    color: inherit;
    padding: 3px 0;
    line-height: 1.4;
    transition: opacity 0.2s, color 0.2s;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.toc-item a:hover {
    opacity: 1;
}

/* H2 正常缩进，H3 多缩进一级 */
.toc-h2 {
    padding-left: 0;
}

.toc-h3 {
    padding-left: 12px;
}

.toc-h1 {
    padding-left: 0;
    font-weight: bold;
}

/* 当前阅读位置高亮 */
.toc-active a {
    opacity: 1;
    color: var(--leleo-vcard-color);
    font-weight: bold;
}

/* 文章正文样式 */
.post-content :deep(h1),
.post-content :deep(h2),
.post-content :deep(h3) {
    color: var(--leleo-vcard-color);
    margin: 1.8rem 0 0.8rem;
    scroll-margin-top: 80px;
    /* 锚点跳转时留出顶部空间 */
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
    transition: opacity 0.2s;
}

.post-content :deep(img:hover) {
    opacity: 0.85;
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

/* 图片放大 */
.lightbox-wrapper {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(0, 0, 0, 0.85);
    border-radius: 12px;
    padding: 16px;
    cursor: zoom-out;
}

.lightbox-img {
    max-width: 100%;
    max-height: 85vh;
    object-fit: contain;
    border-radius: 8px;
    cursor: default;
}

.lightbox-close {
    position: absolute;
    top: 12px;
    right: 12px;
}
</style>