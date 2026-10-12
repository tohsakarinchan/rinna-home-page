export function notionClient(token, fetcher = fetch) {
  return async (path, method = 'GET', body) => {
    const options = {
      method, headers: { Authorization: `Bearer ${token}`, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }
    let response
    for (let attempt = 0; attempt < 3; attempt++) {
      response = await fetcher(`https://api.notion.com/v1/${path}`, { ...options, signal: AbortSignal.timeout(8000) })
      if (response.status !== 429 || !(method === 'GET' || path.endsWith('/query')) || attempt === 2) break
      const seconds = Number(response.headers.get('Retry-After')) || 1
      await new Promise(resolve => setTimeout(resolve, Math.min(5, Math.max(1, seconds)) * 1000))
    }
    if (!response.ok) throw new Error(`Notion request failed (${response.status})`)
    return response.json()
  }
}
export async function queryPages(request, id, published = false) {
  const pages = []
  let cursor
  do {
    const data = await request(`databases/${id}/query`, 'POST', {
      page_size: 100, ...(cursor ? { start_cursor: cursor } : {}),
      ...(published ? { filter: { property: 'Published', checkbox: { equals: true } } } : {}),
    })
    pages.push(...data.results)
    cursor = data.has_more ? data.next_cursor : null
    if (data.has_more && !cursor) throw new Error('Invalid Notion pagination')
  } while (cursor)
  return pages
}
export const propertyText = (page, key) => {
  const prop = page.properties?.[key]
  return (prop?.title || prop?.rich_text || []).map(t => t.plain_text ?? t.text?.content ?? '').join('')
}
const number = (page, key) => page.properties?.[key]?.number
const checked = (page, key) => page.properties?.[key]?.checkbox === true
const related = (page, key) => (page.properties?.[key]?.relation || []).map(r => r.id)
const httpUrl = value => {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : '' } catch { return '' }
}
const url = (page, key) => httpUrl(page.properties?.[key]?.url)
const ordered = pages => [...pages].sort((a, b) => (number(a, 'Order') ?? 0) - (number(b, 'Order') ?? 0) || a.id.localeCompare(b.id))

export function assemblePassport({ trips, days, stops, chapters, places }) {
  const names = new Map(places.map(p => [p.id, propertyText(p, 'Name')]))
  const output = ordered(trips).map(trip => {
    const tripDays = days.filter(d => related(d, 'Trip').includes(trip.id)).map(d => {
      const date = d.properties.Date?.date?.start?.slice(0, 10)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '') || !Number.isFinite(Date.parse(date))) throw new Error('Invalid travel date')
      return {
        id: d.id, date, day: number(d, 'Day') || 1, title: propertyText(d, 'Name'), subtitle: propertyText(d, 'Subtitle'),
        journalTitle: propertyText(d, 'Journal title'), journalNotice: propertyText(d, 'Journal notice'), locationNotice: propertyText(d, 'Location notice'),
        references: (d.properties.References?.rich_text || []).map(t => ({ text: t.plain_text ?? t.text?.content ?? '', url: httpUrl(t.href || t.text?.link?.url) })),
        stops: ordered(stops.filter(s => related(s, 'Day').includes(d.id))).map(s => {
          const geo = [number(s, 'Latitude'), number(s, 'Longitude')]
          if (!geo.every(Number.isFinite) || Math.abs(geo[0]) > 90 || Math.abs(geo[1]) > 180) throw new Error('Invalid stop coordinates')
          const photo = s.properties.Photo?.files?.[0]
          const photoUrl = httpUrl(photo?.file?.url || photo?.external?.url)
          return {
            id: s.id, name: propertyText(s, 'Name'), category: propertyText(s, 'Category'), geo,
            zoom: Math.min(19, Math.max(1, number(s, 'Zoom') || 16)), outsideCity: checked(s, 'Outside city'), provisional: checked(s, 'Provisional'),
            note: propertyText(s, 'Notes'), source: url(s, 'Source'), contributor: propertyText(s, 'Contributor'), originalSource: url(s, 'Original source'), license: url(s, 'License'),
            ...(photoUrl ? { photo: { url: photoUrl, alt: propertyText(s, 'Photo alt'), credit: propertyText(s, 'Photo credit'), source: url(s, 'Photo source') } } : {}),
          }
        }),
        journal: ordered(chapters.filter(c => related(c, 'Day').includes(d.id))).map(c => ({ heading: propertyText(c, 'Name'), text: propertyText(c, 'Body') })),
      }
    }).sort((a, b) => a.date.localeCompare(b.date))
    const color = propertyText(trip, 'Color')
    const effect = propertyText(trip, 'Effect')
    const icon = propertyText(trip, 'Icon')
    return {
      id: trip.id, month: propertyText(trip, 'Month'), title: propertyText(trip, 'Name'), subtitle: propertyText(trip, 'Subtitle'), places: propertyText(trip, 'Destinations'),
      prefectures: related(trip, 'Places').map(id => names.get(id)).filter(Boolean), stamp: propertyText(trip, 'Stamp'),
      color: /^#[0-9a-f]{6}$/i.test(color) ? color : '#355c78', effect: ['lights', 'snow', 'petals', 'steam', 'cloud'].includes(effect) ? effect : 'lights',
      icon: /^mdi-[a-z0-9-]+$/.test(icon) ? icon : 'mdi-map-marker-outline', days: tripDays,
    }
  })
  return { trips: output }
}

export async function passportResponse(request, env, ids) {
  if (request.method !== 'GET') return Response.json({ error: 'Method Not Allowed' }, { status: 405 })
  if (!env.NOTION_TOKEN || !env.NOTION_PLACES_DATABASE_ID || ['trips', 'days', 'stops', 'chapters'].some(k => !ids[k])) {
    return Response.json({ error: 'Travel content is not configured' }, { status: 503 })
  }
  try {
    const query = notionClient(env.NOTION_TOKEN)
    // Sequential batches stay within Notion's request rate and use no persistent process state.
    const data = {}
    for (const kind of ['trips', 'days', 'stops', 'chapters']) data[kind] = await queryPages(query, ids[kind], true)
    data.places = await queryPages(query, env.NOTION_PLACES_DATABASE_ID)
    return Response.json(assemblePassport(data), { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120' } })
  } catch {
    return Response.json({ error: 'Unable to load travel content' }, { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }
}
