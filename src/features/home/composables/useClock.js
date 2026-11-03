import { ref, onMounted, onScopeDispose } from 'vue'
import { getFormattedDate, getFormattedTime } from '../../../shared/lib/page.js'

export function useClock() {
  const formattedDate = ref(''), formattedTime = ref('')
  let timer
  function update() {
    const now = new Date()
    formattedDate.value = getFormattedDate(now)
    formattedTime.value = getFormattedTime(now)
  }
  onMounted(() => { update(); timer = setInterval(update, 1000) })
  onScopeDispose(() => clearInterval(timer))
  return { formattedDate, formattedTime }
}
