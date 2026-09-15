export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    return setCors(res).status(204).end()
  }

  if (req.method !== 'GET') {
    return setCors(res).status(405).json({ error: 'Method Not Allowed' })
  }

  const notionToken = process.env.NOTION_TOKEN
  const placesDatabaseId = process.env.NOTION_PLACES_DATABASE_ID
  const visitsDatabaseId = process.env.NOTION_VISITS_DATABASE_ID

  if (!notionToken) {
    return setCors(res).status(500).json({ error: 'Missing NOTION_TOKEN' })
  }

  // Keep endpoint non-breaking if the new databases are not configured yet.
  if (!placesDatabaseId || !visitsDatabaseId) {
    return setCors(res).status(200).json({
      visited_places: [],
      visit_records: [],
      places: [],
      visits: [],
      warning: 'NOTION_PLACES_DATABASE_ID or NOTION_VISITS_DATABASE_ID is missing',
    })
  }

  const headers = {
    Authorization: `Bearer ${notionToken}`,
    'Notion-Version': '2022-06-28',
    'Content-Type': 'application/json',
  }

  try {
    const [placesPages, visitsPages] = await Promise.all([
      queryAllDatabasePages(placesDatabaseId, headers, [{ timestamp: 'last_edited_time', direction: 'descending' }]),
      queryAllDatabasePages(visitsDatabaseId, headers, [{ timestamp: 'last_edited_time', direction: 'descending' }]),
    ])

    const places = placesPages.map(pageToPlace)
    const placeById = new Map(places.map((p) => [p.id, p]))
    const visits = visitsPages.map((page) => pageToVisit(page, placeById))

    const visitedPlacesSet = new Set()
    const firstVisitByName = new Map()

    places.forEach((place) => {
      if (!place.name) return
      if (place.visited || place.firstVisitDate || place.lastVisitDate) {
        visitedPlacesSet.add(place.name)
      }
      pushFirstVisit(firstVisitByName, place.name, place.firstVisitDate || place.lastVisitDate)
    })

    visits.forEach((visit) => {
      if (!visit.placeName) return
      visitedPlacesSet.add(visit.placeName)
      pushFirstVisit(firstVisitByName, visit.placeName, visit.date)
    })

    const visitRecords = [...firstVisitByName.values()]
      .sort((a, b) => b.ts - a.ts)
      .map((item) => ({ name: item.name, firstVisitDate: item.rawDate }))

    return setCors(res).status(200).json({
      visited_places: [...visitedPlacesSet],
      visit_records: visitRecords,
      places,
      visits,
    })
  } catch (error) {
    console.error('visit-data error:', error)
    return setCors(res).status(500).json({ error: 'Failed to fetch visit data' })
  }
}

async function queryAllDatabasePages(databaseId, headers, sorts = []) {
  const results = []
  let cursor

  do {
    const body = {
      page_size: 100,
      sorts,
    }
    if (cursor) body.start_cursor = cursor

    const notionRes = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!notionRes.ok) {
      const err = await notionRes.text()
      throw new Error(`Notion query failed (${databaseId}): ${err}`)
    }

    const data = await notionRes.json()
    results.push(...(data.results || []))
    cursor = data.has_more ? data.next_cursor : undefined
  } while (cursor)

  return results
}

function pageToPlace(page) {
  const props = page.properties || {}
  return {
    id: page.id,
    name: getTextProp(props, ['Name', '名称', 'Place', '地点', 'Prefecture', '都道府县']) || '',
    countryCity: getTextProp(props, ['Country/City', 'CountryCity', '国家/城市', '城市']) || '',
    visited: getCheckboxProp(props, ['Visited', 'Been', '去过', '去过?']),
    firstVisitDate: getDateProp(props, ['First Visit', 'FirstVisit', '首次到访', '首次到訪']) || '',
    lastVisitDate: getDateProp(props, ['Last Visit', 'LastVisit', '最近到访', '最近到訪']) || '',
  }
}

function pageToVisit(page, placeById) {
  const props = page.properties || {}
  const relation = getRelationProp(props, ['Place', 'Places', '地点', '地點']) || []
  const placeId = relation[0]?.id || ''
  const placeNameFromRelation = placeId ? placeById.get(placeId)?.name || '' : ''
  const placeNameFallback =
    getTextProp(props, ['Place Name', 'PlaceName', '地点名称', '地點名稱', 'Prefecture', '都道府县']) || ''

  return {
    id: page.id,
    placeId,
    placeName: placeNameFromRelation || placeNameFallback,
    date: getTextProp(props, ['Month']) || getDateProp(props, ['Date', 'Visit Date', 'VisitDate', '日期', '到访日期', '到訪日期']) || '',
    source: getTextProp(props, ['Source', '来源', '來源', 'Type', '类型', '類型']) || '',
    note: getTextProp(props, ['Notes', 'Note', '备注', '備註']) || '',
  }
}

function pushFirstVisit(map, name, rawDate) {
  if (!name || !rawDate) return
  const ts = Date.parse(String(rawDate))
  if (!Number.isFinite(ts)) return
  const prev = map.get(name)
  if (!prev || ts < prev.ts) {
    map.set(name, { name, ts, rawDate })
  }
}

function getPropByNames(props, names = []) {
  for (const name of names) {
    if (props[name]) return props[name]
  }
  return null
}

function getTextProp(props, names = []) {
  const prop = getPropByNames(props, names)
  if (!prop) return ''
  if (prop.type === 'title') return prop.title?.[0]?.plain_text || ''
  if (prop.type === 'rich_text') return prop.rich_text?.[0]?.plain_text || ''
  if (prop.type === 'select') return prop.select?.name || ''
  if (prop.type === 'multi_select') return prop.multi_select?.map((item) => item.name).join(', ') || ''
  return ''
}

function getDateProp(props, names = []) {
  const prop = getPropByNames(props, names)
  if (!prop || prop.type !== 'date') return ''
  return prop.date?.start || ''
}

function getCheckboxProp(props, names = []) {
  const prop = getPropByNames(props, names)
  if (!prop || prop.type !== 'checkbox') return false
  return Boolean(prop.checkbox)
}

function getRelationProp(props, names = []) {
  const prop = getPropByNames(props, names)
  if (!prop || prop.type !== 'relation') return []
  return prop.relation || []
}

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  return res
}
