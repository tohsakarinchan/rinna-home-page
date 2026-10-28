import { onRequest } from '../functions/api/passport.js'
import { nodeHandler } from '../server/node-adapter.js'
export default nodeHandler(onRequest, '/api/passport')
