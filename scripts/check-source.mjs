import fs from 'node:fs'
import path from 'node:path'
import { parse, compileScript, compileTemplate } from 'vue/compiler-sfc'

// Compile retained screens too, including the blog list currently hidden from the home page.
const errors = []
let components = 0
function checkImports(file, source) {
  for (const match of source.matchAll(/\b(?:from\s*|import\s*(?:\(\s*)?)(['"])(\.{1,2}\/[^'"]+)\1/g)) {
    if (!fs.existsSync(path.resolve(path.dirname(file), match[2]))) errors.push(`${file}: unresolved ${match[2]}`)
  }
}
function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) { walk(file); continue }
    if (!/\.(js|vue)$/.test(file)) continue
    const source = fs.readFileSync(file, 'utf8')
    if (file.endsWith('.js')) { checkImports(file, source); continue }
    const { descriptor, errors: parseErrors } = parse(source, { filename: file })
    errors.push(...parseErrors)
    try {
      const script = descriptor.script || descriptor.scriptSetup ? compileScript(descriptor, { id: file }) : null
      checkImports(file, descriptor.scriptSetup?.content || descriptor.script?.content || '')
      for (const style of descriptor.styles) {
        if (style.src && !fs.existsSync(path.resolve(path.dirname(file), style.src))) errors.push(`${file}: missing style ${style.src}`)
      }
      const template = compileTemplate({ source: descriptor.template.content, filename: file, id: file,
        compilerOptions: { bindingMetadata: script?.bindings || {} } })
      errors.push(...template.errors)
      if (descriptor.scriptSetup) {
        for (const match of template.code.matchAll(/_resolveComponent\("([^"\n]+)"\)/g)) {
          if (!/^(v-|V[A-Z]|router-link$|RouterLink$|RouterView$)/.test(match[1])) errors.push(file + ': unresolved component ' + match[1])
        }
        const unbound = new Set([...template.code.matchAll(/_ctx\.([\w$]+)/g)].map(match => match[1]))
        for (const name of unbound) {
          if (!['$emit', '$slots', '$attrs'].includes(name)) errors.push(`${file}: unbound template identifier ${name}`)
        }
      }
      components++
    } catch (error) { errors.push(`${file}: ${error.message}`) }
  }
}
walk('src')
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1 }
else console.log(`Source imports and ${components} Vue components checked.`)
