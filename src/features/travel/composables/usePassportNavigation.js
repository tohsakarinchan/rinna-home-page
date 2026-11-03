import { ref, computed, watch } from 'vue'

// Call within a Vue setup/effect scope so watchers share the owner's lifetime.
export function usePassportNavigation(spreads, effects) {
  const spreadIndex = ref(0)
  const currentSpread = computed(() => spreads.value[spreadIndex.value] || [[], []])
  const turnDirection = ref('forward')
  const turning = ref(false)
  function turnPage(step) {
    const target = spreadIndex.value + step
    if (turning.value || target < 0 || target >= spreads.value.length) return
    turnDirection.value = step > 0 ? 'forward' : 'backward'
    turning.value = effects.value
    spreadIndex.value = target
  }
  let swipe = null
  let suppressSwipeClick = false
  function startSwipe(event) {
    suppressSwipeClick = false
    if (turning.value || spreads.value.length < 2 || event.pointerType === 'mouse' || !event.isPrimary) return
    swipe = { id: event.pointerId, x: event.clientX, y: event.clientY }
  }
  function moveSwipe(event) {
    if (!swipe || swipe.id !== event.pointerId) return
    const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y
    if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { cancelSwipe(); return }
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      suppressSwipeClick = true
      event.currentTarget.setPointerCapture?.(event.pointerId)
    }
  }
  function endSwipe(event) {
    if (!swipe || swipe.id !== event.pointerId) return
    const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y
    swipe = null
    const threshold = Math.min(80, Math.max(40, event.currentTarget.clientWidth * .12))
    if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.4) {
      suppressSwipeClick = true
      turnPage(dx < 0 ? 1 : -1)
    }
  }
  function cancelSwipe() { swipe = null }
  function guardSwipeClick(event) {
    if (!suppressSwipeClick) return
    event.preventDefault()
    event.stopPropagation()
    suppressSwipeClick = false
  }
  function retireSpread(element) {
    // Outgoing stickers remain visible during the turn but must not receive input.
    element.inert = true
    element.setAttribute('aria-hidden', 'true')
  }
  function handlePageKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    // Keep keyboard focus outside the spread that is about to be removed.
    if (!turning.value && ((event.key === 'ArrowLeft' && spreadIndex.value > 0) || (event.key === 'ArrowRight' && spreadIndex.value < spreads.value.length - 1))) {
      event.currentTarget.closest('.passport-book')?.querySelector('.book-pagination')?.focus()
    }
    turnPage(event.key === 'ArrowLeft' ? -1 : 1)
  }
  watch(() => spreads.value.length, count => { spreadIndex.value = Math.min(spreadIndex.value, Math.max(0, count - 1)) })
  watch(effects, enabled => { if (!enabled) turning.value = false })
  return { spreadIndex, currentSpread, turnDirection, turning, turnPage, startSwipe, moveSwipe, endSwipe, cancelSwipe, guardSwipeClick, retireSpread, handlePageKey }
}
