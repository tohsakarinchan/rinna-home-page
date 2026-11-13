import { ref, computed, watch, onScopeDispose } from 'vue'

export const PASSPORT_TURN_MS = 720

// One leaf: the old page is its front; the destination page is its back.
export function usePassportNavigation(spreads, effects) {
  const spreadIndex = ref(0), turnDirection = ref('forward'), turning = ref(false)
  const sourceIndex = ref(null), dragProgress = ref(0), returning = ref(false)
  const duration = ref(PASSPORT_TURN_MS)
  const currentSpread = computed(() => spreads.value[spreadIndex.value] || [[], []])
  const step = computed(() => turnDirection.value === 'forward' ? 1 : -1)
  const turnLayer = computed(() => {
    if (!effects.value || sourceIndex.value === null) return null
    const from = spreads.value[sourceIndex.value], to = spreads.value[sourceIndex.value + step.value]
    if (!from || !to) return null
    const frontSide = step.value > 0 ? 1 : 0, backSide = 1 - frontSide
    return {
      base: to, baseIndex: sourceIndex.value + step.value,
      stationary: from[backSide], stationarySide: backSide,
      stationaryNumber: sourceIndex.value * 2 + backSide + 1,
      front: from[frontSide], frontSide, frontNumber: sourceIndex.value * 2 + frontSide + 1,
      back: to[backSide], backSide, backNumber: (sourceIndex.value + step.value) * 2 + backSide + 1,
    }
  })
  let timer, swipe = null, suppressSwipeClick = false
  function finishTurn() {
    clearTimeout(timer)
    turning.value = false
    returning.value = false
    sourceIndex.value = null
    dragProgress.value = 0
  }
  function settle(cancelled = false) {
    returning.value = cancelled
    duration.value = Math.max(120, PASSPORT_TURN_MS * (cancelled ? dragProgress.value : 1 - dragProgress.value))
    turning.value = true
    clearTimeout(timer)
    timer = setTimeout(finishTurn, duration.value + 100)
  }
  function turnPage(amount) {
    const target = spreadIndex.value + amount
    if (turning.value || target < 0 || target >= spreads.value.length) return
    sourceIndex.value = spreadIndex.value
    turnDirection.value = amount > 0 ? 'forward' : 'backward'
    spreadIndex.value = target
    if (effects.value) settle()
    else finishTurn()
  }
  function startSwipe(event) {
    suppressSwipeClick = false
    if (turning.value || spreads.value.length < 2 || !event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
    swipe = { id: event.pointerId, x: event.clientX, y: event.clientY }
  }
  function moveSwipe(event) {
    if (!swipe || swipe.id !== event.pointerId) return
    const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y
    if (Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { cancelSwipe(); return }
    if (Math.abs(dx) <= 12 || Math.abs(dx) <= Math.abs(dy) * 1.4) return
    suppressSwipeClick = true
    event.currentTarget.setPointerCapture?.(event.pointerId)
    const direction = dx < 0 ? 1 : -1, target = spreadIndex.value + direction
    if (!effects.value || target < 0 || target >= spreads.value.length) {
      if (dragProgress.value) finishTurn()
      return
    }
    sourceIndex.value = spreadIndex.value
    turnDirection.value = direction > 0 ? 'forward' : 'backward'
    dragProgress.value = Math.min(.95, Math.abs(dx) / Math.max(1, event.currentTarget.clientWidth / 2))
  }
  function endSwipe(event) {
    if (!swipe || swipe.id !== event.pointerId) return
    const dx = event.clientX - swipe.x, dy = event.clientY - swipe.y
    swipe = null
    const threshold = Math.min(80, Math.max(40, event.currentTarget.clientWidth * .12))
    if (Math.abs(dx) >= threshold && Math.abs(dx) > Math.abs(dy) * 1.4) {
      suppressSwipeClick = true
      const direction = dx < 0 ? 1 : -1, target = spreadIndex.value + direction
      if (target >= 0 && target < spreads.value.length) turnPage(direction)
      else if (dragProgress.value) settle(true)
    } else if (dragProgress.value) settle(true)
  }
  function cancelSwipe() {
    swipe = null
    if (dragProgress.value && !turning.value) settle(true)
  }
  function guardSwipeClick(event) {
    if (!suppressSwipeClick) return
    event.preventDefault()
    event.stopPropagation()
    suppressSwipeClick = false
  }
  function handlePageKey(event) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
    event.preventDefault()
    if (!turning.value && ((event.key === 'ArrowLeft' && spreadIndex.value > 0) || (event.key === 'ArrowRight' && spreadIndex.value < spreads.value.length - 1))) {
      event.currentTarget.closest('.passport-volume')?.querySelector('.book-pagination')?.focus()
    }
    turnPage(event.key === 'ArrowLeft' ? -1 : 1)
  }
  watch(spreads, () => {
    swipe = null
    finishTurn()
    spreadIndex.value = Math.min(spreadIndex.value, Math.max(0, spreads.value.length - 1))
  })
  watch(effects, enabled => { if (!enabled) { swipe = null; finishTurn() } })
  onScopeDispose(() => { clearTimeout(timer); swipe = null })
  return { spreadIndex, currentSpread, turnDirection, turning, returning, dragProgress, duration, turnLayer,
    turnPage, finishTurn, startSwipe, moveSwipe, endSwipe, cancelSwipe, guardSwipeClick, handlePageKey }
}
