import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { setMeta } from '../../../shared/lib/page.js'
import config from '../../../shared/config/site.js'
import { fetchPost } from '../api/blog.js'

export function useBlogPost(slug, { getPost = fetchPost } = {}) {
  const loading = ref(true)
  const error = ref('')
  let controller, scrollFrame
  function queueHeading() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(() => { scrollFrame = 0; updateActiveHeading() })
  }
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
  let imageCleanups = []
  function clearImageClicks() { imageCleanups.forEach(cleanup => cleanup()); imageCleanups = [] }

  function setupImageClick() {
    clearImageClicks()
    if (!postContent.value) return
    const imgs = postContent.value.querySelectorAll('img')
    imgs.forEach(img => {
        img.style.cursor = 'zoom-in'
        const open = () => { lightboxSrc.value = img.src; lightbox.value = true }
        img.addEventListener('click', open)
        imageCleanups.push(() => img.removeEventListener('click', open))
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

  async function loadPost() {
    controller?.abort();
    clearImageClicks();
    const current = controller = new AbortController();
    loading.value = true; error.value = ''; toc.value = []; lightbox.value = false;
    try {
        const data = await getPost(slug(), { signal: current.signal });
        if (current.signal.aborted) return;
        meta.value = data.meta;
        html.value = data.html;
        setMeta(meta.value.title, meta.value.summary || meta.value.title, meta.value.tags?.join(',') || '', '/favicon.ico');
        loading.value = false;
        await nextTick();
        if (current.signal.aborted) return;
        setupImageClick();
        buildToc();
        updateActiveHeading();
    } catch (e) {
        if (current.signal.aborted) return;
        error.value = e.status === 404 ? '文章不存在或尚未发布。' : '文章暂时无法加载，请稍后重试。';
        loading.value = false;
    }
  }
  onMounted(() => window.addEventListener('scroll', queueHeading, { passive: true }));
  watch(slug, loadPost, { immediate: true });

  onUnmounted(() => {
    controller?.abort()
    clearImageClicks()
    cancelAnimationFrame(scrollFrame)
    window.removeEventListener('scroll', queueHeading)

    // 还原回主页默认 meta
    setMeta(
        config.metaData.title,
        config.metaData.description,
        config.metaData.keywords,
        config.metaData.icon
    )
  })
  return { loading, error, meta, html, postContent, progress, lightbox, lightboxSrc, toc, activeHeading, scrollToHeading, loadPost }
}
