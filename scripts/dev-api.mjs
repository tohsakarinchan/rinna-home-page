// Local Cloudflare-compatible API runner. Credentials stay on the server.
import { createServer } from 'node:http'
import { readFileSync, existsSync } from 'node:fs'
import { parseEnv } from 'node:util'
import { onRequestGet as blogList } from '../functions/api/blog-list.js'
import { onRequestGet as blogPost } from '../functions/api/blog-post.js'
import { onRequest as visitData } from '../functions/api/visit-data.js'
import { onRequest as passport } from '../functions/api/passport.js'

const env = { ...process.env }
for (const file of ['.env.local', '.dev.vars']) {
  if (existsSync(file)) Object.assign(env, parseEnv(readFileSync(file, 'utf8')))
}
const routes = { '/api/blog-list': blogList, '/api/blog-post': blogPost, '/api/visit-data': visitData, '/api/passport': passport }
createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://127.0.0.1:8788')
    const handler = routes[url.pathname]
    if (!handler || req.method !== 'GET') { res.writeHead(404).end(); return }
    const response = await handler({ request: new Request(url), env })
    res.writeHead(response.status, Object.fromEntries(response.headers))
    res.end(await response.text())
  } catch {
    res.writeHead(500, { 'Content-Type': 'application/json' }).end(JSON.stringify({ error: 'Local API failed' }))
  }
}).listen(8788, '127.0.0.1', () => console.log('Local API ready at http://127.0.0.1:8788'))
