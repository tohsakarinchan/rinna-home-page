import { passportResponse } from '../server/notion-passport.js'
import { passportDatabases } from '../server/passport-config.js'

export default async function handler(req, res) {
  const response = await passportResponse(new Request('https://localhost/api/passport', { method: req.method }), process.env, passportDatabases)
  for (const [key, value] of response.headers) res.setHeader(key, value)
  res.status(response.status).send(await response.text())
}
