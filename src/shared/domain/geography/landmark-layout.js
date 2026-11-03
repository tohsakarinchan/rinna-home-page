// Models grow north of their actual geographic anchor. Displace only to avoid collisions.
export function layoutLandmarks(anchors, width, height) {
  if (width < 100 || height < 180) return []
  const placed = [], size = width < 360 ? 92 : 112, modelHeight = size * 1.24
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v))
  for (const point of anchors.filter(p => Number.isFinite(p.anchorX) && Number.isFinite(p.anchorY))) {
    let best, bestScore = Infinity
    for (const dy of [0, -45, -90, 45, -135, 90]) for (const dx of [0, -size, size, -size*2, size*2]) {
      const x = clamp(point.anchorX + dx, size/2, width-size/2)
      const y = clamp(point.anchorY + dy, modelHeight, height-8)
      const overlap = placed.reduce((s,p) => s + Math.max(0, size+4-Math.abs(x-p.x))*Math.max(0, modelHeight+4-Math.abs(y-p.y)), 0)
      const score = overlap*100 + (x-point.anchorX)**2 + (y-point.anchorY)**2*1.4 + Math.max(0,y-point.anchorY)*80
      if (score < bestScore) { bestScore=score; best={ ...point,x,y,size } }
    }
    placed.push(best)
  }
  return placed
}
