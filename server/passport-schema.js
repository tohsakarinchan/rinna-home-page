// Database IDs are public identifiers; the integration token is server-only.
export const passportParent = '3dc55315-8fba-8173-a527-d1f4cc70bf3f'
export const databaseTitles = {
  trips: '旅行護照 · Trips', days: '每日旅行 · Days',
  stops: '旅行站點 · Stops', chapters: '旅行游記 · Chapters',
}
export function passportSchema(kind, ids, placesId) {
  const text = { rich_text: {} }, number = { number: {} }, url = { url: {} }
  const relation = database_id => ({ relation: { database_id, single_property: {} } })
  const base = { Name: { title: {} }, Key: text, Published: { checkbox: {} } }
  return { ...base, ...{
    trips: { Month: text, Order: number, Subtitle: text, Destinations: text, Places: relation(placesId), Icon: text, Stamp: text, Color: text, Effect: text },
    days: { Trip: relation(ids.trips), Date: { date: {} }, Day: number, Subtitle: text, 'Journal title': text, 'Journal notice': text, 'Location notice': text, References: text },
    stops: { Day: relation(ids.days), Order: number, Category: text, Latitude: number, Longitude: number, Zoom: number, 'Outside city': { checkbox: {} }, Provisional: { checkbox: {} }, Notes: text, Source: url, Contributor: text, 'Original source': url, License: url, Photo: { files: {} }, 'Photo alt': text, 'Photo credit': text, 'Photo source': url },
    chapters: { Day: relation(ids.days), Order: number, Body: text },
  }[kind] }
}
