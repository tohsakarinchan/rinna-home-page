// Coordinates are approximate display anchors [longitude, latitude], not route data.
// A region alone never proves a landmark was visited. Match confirmed stops only.
export const landmarkCatalog = [
  { id: 'uji', name: '宇治桥', region: '宇治', kind: 'bridge', coordinate: [135.806, 34.892], aliases: ['宇治桥', '宇治橋'], caption: '以跨过宇治川的小桥，留下这次宇治散步。' },
  { id: 'nara', name: '奈良', region: '奈良', kind: 'deer', coordinate: [135.839, 34.685], aliases: ['奈良', 'Nara'], caption: '用一只小鹿代表到访的奈良，收藏古都的印象。' },
  { id: 'tokyo-tower', name: '东京塔', region: '东京', kind: 'tower', coordinate: [139.7454, 35.6586], aliases: ['东京塔', '東京タワー', '東京塔', 'Tokyo Tower'], caption: '把东京的红白铁塔，收藏成一枚立体回忆。' },
  { id: 'kiyomizu', name: '清水寺', region: '京都', kind: 'temple', coordinate: [135.785, 34.9949], aliases: ['清水寺', 'Kiyomizu'], caption: '层叠的屋檐与木构舞台，留住京都的一角。' },
  { id: 'meiji', name: '明治神宫', region: '东京', kind: 'torii', coordinate: [139.6993, 35.6764], aliases: ['明治神宫', '明治神宮', 'Meiji Jingu'], caption: '以林间鸟居，记下这次神宫散步。' },
  { id: 'gyoen', name: '新宿御苑', region: '东京', kind: 'garden', coordinate: [139.71, 35.6852], aliases: ['新宿御苑', 'Shinjuku Gyoen'], caption: '用一座小小的庭园，收藏《言叶之庭》的绿意。' },
  { id: 'chitose', name: '千登世步道桥', region: '东京', kind: 'bridge', coordinate: [139.712836, 35.720835], aliases: ['千登世步道桥', '千登世歩道橋'], caption: '把《MyGO!!!!!》巡礼中的步道桥，放回东京。' },
  { id: 'shimokita', name: '下北泽', region: '东京', kind: 'guitar', coordinate: [139.6664, 35.6613], aliases: ['下北泽', '下北沢', 'Shimokitazawa'], caption: '以一把吉他，纪念这次《孤独摇滚》街区巡礼。' },
  { id: 'fuji', name: '富士山', region: '山梨 / 静冈', kind: 'mountain', coordinate: [138.7274, 35.3606], aliases: ['富士山', 'Mount Fuji'], caption: '雪顶与山的棱线，是这一程的纪念。' },
  { id: 'kinosaki', name: '城崎温泉', region: '兵库', kind: 'onsen', coordinate: [134.8094, 35.6253], aliases: ['城崎温泉', '城崎溫泉', 'Kinosaki Onsen'], caption: '小浴屋和升起的蒸汽，收藏温泉街的时光。' },
]

// Visits newly confirmed by the owner; month keys also work with Notion UUIDs.
const confirmedVisits = { '2024.06': ['tokyo-tower'] }
const prefectures = { uji: '京都府', nara: '奈良县', 'tokyo-tower': '东京都', kiyomizu: '京都府', meiji: '东京都', gyoen: '东京都', chitose: '东京都', shimokita: '东京都', fuji: '山梨县', kinosaki: '兵库县' }
const priority = ['tokyo-tower', 'kiyomizu', 'kinosaki', 'fuji', 'nara', 'uji', 'meiji', 'gyoen', 'shimokita', 'chitose']
export function tripLandmarks(trip) {
  const confirmed = new Set(confirmedVisits[trip.month] || [])
  const stops = (trip.days || []).flatMap(day => day.stops || []).filter(stop => !stop.provisional)
  const chosen = new Set()
  return [...landmarkCatalog].sort((a,b) => priority.indexOf(a.id) - priority.indexOf(b.id)).flatMap(landmark => {
    const matches = stops.filter(stop => landmark.aliases.some(alias => (stop.name || '').toLowerCase().includes(alias.toLowerCase())))
    if (!confirmed.has(landmark.id) && !matches.length) return []
    const prefecture = landmark.id === 'fuji' && !trip.prefectures?.includes('山梨县') && trip.prefectures?.includes('静冈县') ? '静冈县' : prefectures[landmark.id]
    if (chosen.has(prefecture)) return []
    chosen.add(prefecture)
    const photos = matches.flatMap(stop => [stop.photo, ...(stop.photos || [])]).filter(photo => photo?.url)
    return [{ ...landmark, prefecture, photos: [...new Map(photos.map(p => [p.url,p])).values()] }]
  })
}
