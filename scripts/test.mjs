import { readdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'

// Expand test paths in Node so Windows and Unix run the same suite.
const files = readdirSync(new URL('../tests/', import.meta.url))
  .filter(name => name.endsWith('.test.js')).sort()
  .map(name => `tests/${name}`)
if (!files.length) throw new Error('No test files found')
const result = spawnSync(process.execPath, ['--test', ...files], { stdio: 'inherit' })
if (result.error) throw result.error
process.exit(result.status ?? 1)
