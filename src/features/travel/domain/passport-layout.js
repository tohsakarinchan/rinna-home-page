// Two stickers per physical page; every spread always has a left and right page.
export function passportSpreads(trips) {
  const spreads = []
  for (let i = 0; i < trips.length; i += 4) {
    const entries = trips.slice(i, i + 4).map((trip, index) => ({ trip, number: i + index + 1 }))
    spreads.push([entries.slice(0, 2), entries.slice(2)])
  }
  return spreads
}
export function latestTrip(trips) {
  return [...trips].sort((a, b) => (b.month || '').localeCompare(a.month || '', undefined, { numeric: true }))[0] || null
}

// Turning one spread transfers one physical leaf from right to left.
// Keep the true leaf counts; compress only the visual depth of large collections.
export function passportPageStacks(spreadCount, spreadIndex) {
  const remaining = Math.max(0, Math.trunc(spreadCount) - 1)
  const leftLeaves = Math.min(remaining, Math.max(0, Math.trunc(spreadIndex)))
  const rightLeaves = remaining - leftLeaves
  return {
    leftLeaves, rightLeaves,
    leftDepth: Math.min(12, leftLeaves * 1.5),
    rightDepth: Math.min(12, rightLeaves * 1.5),
  }
}
