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
