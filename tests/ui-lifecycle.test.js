import test from 'node:test'
import assert from 'node:assert/strict'
import { ref, reactive, nextTick } from 'vue'
import { mountComposable, mockGlobal } from './helpers/vue.js'
import { useBlogPost } from '../src/features/blog/composables/useBlogPost.js'
import { useClock } from '../src/features/home/composables/useClock.js'
import { useWallpaper } from '../src/features/appearance/composables/useWallpaper.js'

const noop = () => {}

test('article initializes rendered content, retries errors and removes image/scroll handlers', async t => {
  const listeners = new Set(), imageListeners = new Set()
  mockGlobal(t, 'window', { addEventListener: name => listeners.add(name), removeEventListener: name => listeners.delete(name) })
  mockGlobal(t, 'document', { documentElement: { scrollHeight: 1000, clientHeight: 500, scrollTop: 100 }, querySelector: () => null })
  mockGlobal(t, 'cancelAnimationFrame', noop)
  let article, fail = false
  const heading = { textContent: '标题', tagName: 'H2', getBoundingClientRect: () => ({ top: 10 }) }
  const image = { style: {}, src: 'image.jpg', addEventListener: (_, fn) => imageListeners.add(fn), removeEventListener: (_, fn) => imageListeners.delete(fn) }
  const mounted = mountComposable(() => {
    article = useBlogPost(() => '日本 & 回忆', {
      getPost: async slug => {
        assert.equal(slug, '日本 & 回忆')
        if (fail) throw Object.assign(new Error('missing'), { status: 404 })
        return { meta: { title: 'Test' }, html: '<h2>标题</h2><img>' }
      },
    })
    article.postContent.value = { querySelectorAll: selector => {
      assert.equal(article.loading.value, false, 'loading must end before initializing the rendered article')
      return selector === 'img' ? [image] : [heading]
    } }
    return article
  })
  t.after(mounted.unmount)
  await nextTick(); await nextTick()
  assert.equal(article.toc.value.length, 1)
  assert.equal(imageListeners.size, 1)
  fail = true
  await article.loadPost()
  assert.ok(article.error.value.includes('不存在'))
  assert.equal(imageListeners.size, 0)
  fail = false
  await article.loadPost()
  assert.equal(article.error.value, '')
  assert.equal(imageListeners.size, 1)
  mounted.unmount()
  assert.equal(imageListeners.size, 0)
  assert.equal(listeners.size, 0)
})

test('article route changes cancel earlier requests and unmount ignores late responses', async t => {
  mockGlobal(t, 'window', { addEventListener: noop, removeEventListener: noop })
  mockGlobal(t, 'document', { querySelector: () => null, documentElement: {} })
  mockGlobal(t, 'cancelAnimationFrame', noop)
  const slug = ref('first'), requests = []
  const { state, unmount } = mountComposable(() => useBlogPost(() => slug.value, {
    getPost: (slug, { signal }) => new Promise(resolve => requests.push({ slug, signal, resolve })),
  }))
  slug.value = 'second'
  await nextTick()
  assert.equal(requests[0].signal.aborted, true)
  requests[0].resolve({ meta: { title: 'stale' }, html: 'stale' })
  await nextTick()
  assert.equal(state.html.value, '')
  unmount()
  assert.equal(requests[1].signal.aborted, true)
  requests[1].resolve({ meta: { title: 'late' }, html: 'late' })
  await nextTick()
  assert.equal(state.html.value, '')
})

test('home clock starts immediately and clears its interval on unmount', t => {
  let tick, cleared
  t.mock.method(globalThis, 'setInterval', fn => { tick = fn; return 42 })
  t.mock.method(globalThis, 'clearInterval', id => { cleared = id })
  const { state, unmount } = mountComposable(useClock)
  assert.ok(state.formattedDate.value)
  assert.ok(state.formattedTime.value)
  tick()
  unmount()
  assert.equal(cleared, 42)
})

test('wallpaper follows saved device settings, pauses for overlays and disposes listeners', async t => {
  const listeners = new Map(), properties = new Map()
  const saved = { pc: { type: 'video', datainfo: { url: 'desktop.mp4' } }, mobile: { type: 'pic', datainfo: { url: 'mobile.jpg' } } }
  mockGlobal(t, 'document', { hidden: false, cookie: `leleodatabackground=${encodeURIComponent(JSON.stringify(saved))}`,
    documentElement: { style: { setProperty: (key, value) => properties.set(key, value) } },
    addEventListener: (name, fn) => listeners.set(name, fn), removeEventListener: name => listeners.delete(name),
  })
  let plays = 0, pauses = 0
  const player = ref({ play: () => { plays++; return Promise.resolve() }, pause: () => pauses++ })
  const props = reactive({ mobile: false, motionEnabled: true, paused: false })
  const { state, unmount } = mountComposable(() => useWallpaper(props, player))
  t.after(unmount)
  await nextTick()
  assert.equal(state.source.value, 'desktop.mp4')
  assert.ok(plays > 0)
  props.paused = true
  await nextTick()
  assert.ok(pauses > 0)
  props.paused = false
  props.motionEnabled = false
  await nextTick()
  const count = plays
  listeners.get('visibilitychange')()
  assert.equal(plays, count)
  props.mobile = true
  await nextTick()
  assert.equal(state.source.value, '')
  assert.equal(properties.get('--leleo-background-image-url'), "url('mobile.jpg')")
  unmount()
  assert.equal(listeners.size, 0)
})
