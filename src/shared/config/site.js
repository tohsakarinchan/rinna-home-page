import defaults from './defaults.js'

// One configuration entry for pages and appearance settings.
export function resolveSiteConfig(override) {
  return override ? JSON.parse(override) : defaults
}

export default resolveSiteConfig(import.meta.env?.VITE_CONFIG)
