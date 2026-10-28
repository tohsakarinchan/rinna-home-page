import { mediaResponse } from '../../server/notion-media.js'
export const onRequest = context => mediaResponse(context, 'image')
