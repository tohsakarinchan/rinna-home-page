export function resolveCoverUrl(page) {
  if (page.cover?.file?.url) return `/api/notion-cover?id=${encodeURIComponent(page.id)}`;
  return (page.cover?.external?.url || page.properties?.Cover?.url || '').replace(/^http:/, 'https:');
}
export async function mediaResponse({ request, env }, kind) {
  if (request.method !== 'GET') return Response.json({ error: 'Method Not Allowed' }, { status: 405 });
  const id = new URL(request.url).searchParams.get('id');
  if (!/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(id || '')) return Response.json({ error: 'Invalid media id' }, { status: 400 });
  if (!env.NOTION_TOKEN) return Response.json({ error: 'Media unavailable' }, { status: 503 });
  try {
    const upstream = await fetch(`https://api.notion.com/v1/${kind === 'cover' ? 'pages' : 'blocks'}/${id}`, {
      headers: { Authorization: `Bearer ${env.NOTION_TOKEN}`, 'Notion-Version': '2022-06-28' }, signal: AbortSignal.timeout(10000),
    });
    if (!upstream.ok) return Response.json({ error: 'Media unavailable' }, { status: 502 });
    const data = await upstream.json();
    const file = kind === 'cover' ? data.cover?.file : data[data.type]?.file;
    if (!file?.url) return Response.json({ error: 'Media not found' }, { status: 404 });
    const url = new URL(file.url);
    if (url.protocol !== 'https:') throw new Error('Invalid media URL');
    const ttl = file.expiry_time ? Math.max(0, Math.min(300, Math.floor((Date.parse(file.expiry_time) - Date.now()) / 1000) - 60)) : 0;
    return new Response(null, { status: 302, headers: { Location: url.href, 'Cache-Control': Number.isFinite(ttl) && ttl > 0 ? `private, max-age=${ttl}` : 'no-store' } });
  } catch { return Response.json({ error: 'Media unavailable' }, { status: 502 }) }
}
