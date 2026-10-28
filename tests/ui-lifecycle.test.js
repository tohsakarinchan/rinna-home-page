import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import { passportSpreads, latestTrip } from '../src/utils/passport-layout.js'

const ref = value => ({ value })
const computed = getter => ({ get value() { return getter() } })
const noop = () => {}
async function setupScript(path, globals, exports) {
  const text = await readFile(new URL(path, import.meta.url), 'utf8')
  const code = text.match(/<script setup>([\s\S]*?)<\/script>/)[1].replace(/^import .*$/gm, '')
  return vm.runInNewContext(code + `\n;({${exports}})`, {
    ref, computed, watch: noop, onMounted: noop, onUnmounted: noop, onBeforeUnmount: noop,
    useMotionPreferences: () => ({ motionEnabled: ref(true), reducedMotion: ref(false), toggleMotion: noop }), passportSpreads, latestTrip,
    defineAsyncComponent: noop, defineEmits: () => noop, AbortController, encodeURIComponent,
    ...globals,
  })
}

test('article initializes only after loading ends; failure and retry have a visible state', async () => {
  let article, imageClicks = 0, fail = false
  const heading = { textContent: '标题', tagName: 'H2', getBoundingClientRect: () => ({ top: 10 }) }
  const image = { style: {}, addEventListener() { imageClicks++ } }
  article = await setupScript('../src/views/BlogPost.vue', {
    useRoute: () => ({ params: { slug: '日本 & 回忆' } }), setMeta: noop, config: {},
    document: { documentElement: { scrollHeight: 1000, clientHeight: 500, scrollTop: 100 } },
    fetchJson: async url => {
      assert.ok(url.includes(encodeURIComponent('日本 & 回忆')))
      if (fail) throw Object.assign(new Error('missing'), { status: 404 })
      return { meta: { title: 'Test' }, html: '<h2>标题</h2><img>' }
    },
    nextTick: async () => {
      assert.equal(article.loading.value, false, '正文的 v-else 必须先挂载')
      article.postContent.value = { querySelectorAll: selector => selector === 'img' ? [image] : [heading] }
    },
  }, 'loadPost, loading, error, toc, postContent')
  await article.loadPost()
  assert.equal(article.toc.value.length, 1)
  assert.equal(imageClicks, 1)
  fail = true
  await article.loadPost()
  assert.ok(article.error.value.includes('不存在'))
  assert.equal(article.loading.value, false)
  fail = false
  await article.loadPost()
  assert.equal(article.error.value, '')
})

test('switching trips ignores late responses; returning to a loaded trip reuses detail', async () => {
  const requests = []
  const passport = await setupScript('../src/components/TravelPassport.vue', {
    fetchJson: (url, { signal }) => new Promise(resolve => requests.push({ url, signal, resolve })),
  }, 'openTrip, selected, detailLoading, detailError')
  const first = passport.openTrip({ id: 'a' })
  const second = passport.openTrip({ id: 'b' })
  assert.equal(requests[0].signal.aborted, true)
  requests[1].resolve({ trips: [{ id: 'b', days: [{ id: 'day' }] }] })
  await second
  requests[0].resolve({ trips: [{ id: 'a', days: [] }] })
  await first
  assert.equal(passport.selected.value.id, 'b')
  assert.equal(passport.detailLoading.value, false)
  await passport.openTrip({ id: 'b' })
  assert.equal(requests.length, 2)
  assert.equal(passport.selected.value.days.length, 1)
})

test('home is visible without media readiness and disposes its clock and listeners', async () => {
  const source = (await readFile(new URL('../src/app.js', import.meta.url), 'utf8'))
    .replace(/^import .*$/gm, '').replace('export default', 'const options =').replaceAll('import.meta.env.VITE_CONFIG', 'undefined')
  const listeners = new Set()
  const target = { addEventListener(name) { listeners.add(name) }, removeEventListener(name) { listeners.delete(name) }, pause: noop }
  let tick, cleared = false
  const app = vm.runInNewContext(source + ';options', {
    defineAsyncComponent: noop, homeright: {}, loader: {}, config: {}, getCookie: noop,
    setMeta: noop, getFormattedTime: () => 'time', getFormattedDate: () => 'date', dataConsole: noop,
    AbortController, setInterval(fn) { tick = fn; return 42 }, clearInterval(id) { cleared = id === 42 },
    document: target, window: { matchMedia: () => ({ ...target, matches: true }) },
  })
  const ctx = { ...app.data(), ...app.methods, configdata: { metaData: {} }, $refs: { audioPlayer: target, VdPlayer: target }, $nextTick: fn => fn(), setMainProperty: noop, getMusicInfo: async () => {} }
  await app.mounted.call(ctx)
  assert.equal(ctx.isloading, false)
  tick()
  assert.equal(ctx.formattedDate, 'date')
  app.beforeUnmount.call(ctx)
  assert.equal(cleared, true)
  assert.equal(listeners.size, 0)
})
