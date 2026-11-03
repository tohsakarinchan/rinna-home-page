// Keep existing cookie formats and CSS names compatible with saved preferences.
export function appearanceProperties(config, saved) {
  const theme = saved || config
  return {
    '--leleo-welcomtitle-color': theme.color.welcometitlecolor,
    '--leleo-vcard-color': theme.color.themecolor,
    '--leleo-brightness': `${theme.brightness}%`,
    '--leleo-blur': `${theme.blur}px`,
  }
}

export function wallpaperSelection(config, saved, mobile) {
  return (saved || config.background)[mobile ? 'mobile' : 'pc']
}

export function applyAppearance(properties, root = document.documentElement) {
  for (const [key, value] of Object.entries(properties)) root.style.setProperty(key, value)
}
