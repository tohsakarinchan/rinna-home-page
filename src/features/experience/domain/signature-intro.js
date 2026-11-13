// Coordinates are shared by the handwriting and the circular page reveal.
export const signatureCanvas = { width: 560, height: 240, dotX: 246, dotY: 111, dotRadius: 5.5 }
export const signatureTiming = { dotStart: 1950, dotEnd: 2200, revealStart: 2380, revealEnd: 3220, duration: 3320 }
const clamp = value => Math.max(0, Math.min(1, value))

export function signatureFrame(elapsed, width, height) {
  const scale = Math.min(640, width * .92) / signatureCanvas.width
  const x = (width - signatureCanvas.width * scale) / 2
  const y = (height - signatureCanvas.height * scale) / 2
  const cx = x + signatureCanvas.dotX * scale
  const cy = y + signatureCanvas.dotY * scale
  const dotRadius = signatureCanvas.dotRadius * scale
  const progress = clamp((elapsed - signatureTiming.revealStart) / (signatureTiming.revealEnd - signatureTiming.revealStart))
  // Start gently, accelerate through the scene, then clear every corner before removal.
  const eased = progress * progress * (3 - 2 * progress)
  const farthest = Math.hypot(Math.max(cx, width - cx), Math.max(cy, height - cy)) + 24
  return {
    x, y, scale, cx, cy, progress,
    dot: clamp((elapsed - signatureTiming.dotStart) / (signatureTiming.dotEnd - signatureTiming.dotStart)),
    radius: dotRadius + (farthest - dotRadius) * eased,
    hole: progress > 0 ? dotRadius + (farthest - dotRadius) * eased : 0,
    ringWidth: 1.8 * scale + 12 * eased,
  }
}
