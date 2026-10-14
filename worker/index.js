import * as blogList from '../functions/api/blog-list.js';
import * as blogPost from '../functions/api/blog-post.js';
import * as passport from '../functions/api/passport.js';
import * as visitData from '../functions/api/visit-data.js';
const routes = {'/api/blog-list': blogList, '/api/blog-post': blogPost, '/api/passport': passport, '/api/visit-data': visitData};
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const route = routes[url.pathname];
    if (route) {
      const handler = route.onRequest || route['onRequest' + request.method[0] + request.method.slice(1).toLowerCase()];
      if (!handler) return new Response('Method not allowed', {status:405});
      if (request.method !== 'OPTIONS' && !env.NOTION_TOKEN) return Response.json({error:'Notion integration is not configured'}, {status:503});
      return handler({request, env, waitUntil: ctx.waitUntil.bind(ctx)});
    }
    if (url.pathname.startsWith('/api/')) return new Response('Not found', {status:404});
    let response = await env.ASSETS.fetch(request);
    if (response.status === 404 && request.headers.get('accept')?.includes('text/html')) response = await env.ASSETS.fetch(new Request(new URL('/index.html', request.url), request));
    return response;
  }
};
