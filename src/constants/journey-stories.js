export const journeyStories = {
  '3e455315-8fba-8162-ba83-f7d9b061b8bd': {
    prologue: { title: '出发之前', text: '' },
    epilogue: { title: '旅程之后', text: '' },
    outbound: { from: { city: '香港', code: 'HKG', model: 'hongkong' }, to: { city: '东京', code: 'NRT', model: 'tokyo' }, airline: '香港快运', livery: { primary: '#6b398e', accent: '#ed334e', label: 'HK express' }, time: 'afternoon' },
    inbound: { from: { city: '大阪 · 关西', code: 'KIX', model: 'osaka' }, to: { city: '香港', code: 'HKG', model: 'hongkong' }, airline: '乐桃航空', livery: { primary: '#cf2789', accent: '#df93c4', label: 'peach' }, time: 'afternoon' }
  }
}
export function cityStops(stops = []) {
  return stops.filter(s => s.kind !== 'airport' && !/机场|機場|空港|airport/i.test(s.name || ''))
}
