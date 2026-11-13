// One owner, one pending cue. Cancelled callbacks can never navigate later.
export function createCueController({ schedule = setTimeout, unschedule = clearTimeout, change = () => {} } = {}) {
  let current = null, timer, disposed = false
  function cancel() {
    unschedule(timer)
    timer = undefined
    current = null
    change(null)
  }
  function finish() {
    if (!current || disposed) return
    const complete = current.complete
    cancel()
    complete?.()
  }
  function start(cue, complete, enabled = true) {
    cancel()
    if (disposed) return
    current = { ...cue, complete }
    if (!enabled) { finish(); return }
    change(cue)
    const owned = current
    timer = schedule(() => { if (owned === current) finish() }, cue.duration ?? 2000)
  }
  return { start, finish, cancel, dispose() { disposed = true; cancel() } }
}
