import { mediaResponse } from '../server/notion-media.js'
import { nodeHandler } from '../server/node-adapter.js'
export default nodeHandler(context => mediaResponse(context, 'cover'), '/api/notion-cover')
