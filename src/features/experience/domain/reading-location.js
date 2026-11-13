export function readingLocation(path) {
  return typeof path === 'string' && /^\/travel\/[a-z]{2}(?:\/trips\/[^/?#\s]+)?$/.test(path) ? path : ''
}
