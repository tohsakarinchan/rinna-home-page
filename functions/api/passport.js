import { passportResponse } from '../../server/notion-passport.js'
import { passportDatabases } from '../../server/passport-config.js'

export function onRequest({ request, env }) {
  return passportResponse(request, env, passportDatabases)
}
