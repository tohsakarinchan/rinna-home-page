import { onRequestGet, onRequestOptions } from '../server/blog-post.js'
import { nodeHandler } from '../server/node-adapter.js'
export default nodeHandler(context => context.request.method === 'OPTIONS' ? onRequestOptions() : onRequestGet(context), '/api/blog-post')
