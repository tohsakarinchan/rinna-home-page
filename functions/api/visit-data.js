import { visitDataResponse } from '../../server/visit-data.js'

export function onRequest({ request, env }) {
  return visitDataResponse(request, env)
}
