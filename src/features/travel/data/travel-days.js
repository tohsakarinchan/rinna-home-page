// Route order and date supplied by the owner. Coordinates are display anchors,
// not GPS traces. Anitabi-derived point data: CC BY-NC-SA 4.0, see sources below.
// Optional stop.photo: { url, alt, credit, source }. Leave absent until real photos are supplied.
export const travelDays = {
  '01': [{
    id: '2024-06-07', date: '2024-06-07', day: 1,
    title: '走进故事里的东京', subtitle: '从成田落地，到上野的晚餐',
    stops: [
      { id: 'narita', name: '成田机场', category: '抵达', geo: [35.7719, 140.3929], outsideCity: true, zoom: 12, note: '早上落地。坐标为机场区域示意，航站楼与进城方式待补充。' },
      { id: 'nozoki', name: 'のぞき坂', category: '《路人女主》', geo: [35.717257, 139.713705], zoom: 17, provisional: true, note: '依据“坡道”记忆与 Anitabi 补充的候选地点；请对照照片确认。', source: 'https://anitabi.cn/map?bangumiId=100403', contributor: '卜卜口' },
      { id: 'chitose', name: '千登世步道桥', category: '《MyGO!!!!!》', geo: [35.720835, 139.712836], zoom: 17, note: 'Anitabi 对应“成为人类桥”的场景地标；只标公共步道桥，不标角色住宅原型。', source: 'https://anitabi.cn/map?bangumiId=428735', originalSource: 'https://www.google.com/maps/d/viewer?mid=1Bx4IeQCQlmRdjJCSQ5vLfxQ8DyhBLYE' },
      { id: 'stadium', name: '国立竞技场', category: '城市散步', geo: [35.6779, 139.7145], zoom: 15, provisional: true, note: '暂按你说的“东京国立竞技馆”理解为新宿的国立竞技场，场馆名称待确认。坐标为区域示意。' },
      { id: 'gyoen', name: '新宿御苑', category: '《言叶之庭》', geo: [35.6852, 139.7100], zoom: 15, note: '到访公园已确认。Anitabi 收录东屋、上之池等场景；园内具体拍摄点待补，当前只定位公园。', source: 'https://anitabi.cn/map?bangumiId=58949' },
      { id: 'meiji', name: '明治神宫', category: '城市散步', geo: [35.6764, 139.6993], zoom: 15, note: '到访地由你提供，坐标为神宫区域示意，不代表具体入口或参拜路线。' },
      { id: 'sancha', name: '三轩茶屋', category: '《P5》', geo: [35.6437, 139.6702], zoom: 15, note: '已确认在此进行《P5》巡礼。暂以车站周边代表区域，不指定咖啡店、澡堂或街巷。' },
      { id: 'shimokita', name: '下北泽', category: '《孤独摇滚》', geo: [35.6613, 139.6664], zoom: 15, note: '已确认在此巡礼。暂以车站周边代表区域，未将 SHELTER 等具体场所写作已到访。' },
      { id: 'ueno', name: '上野 · 寿司郎', category: '晚餐', geo: [35.7100, 139.7750], zoom: 14, note: '晚餐由你提供；具体分店未确认，地图标记上野区域，并非店铺地址。' },
    ],
    journal: [
      { heading: '01 / 从机场，走进东京', text: '2024 年 6 月 7 日早上，我落地成田机场，第一次日本旅行从这里开始。进城之后，这一天的目的地不只有城市地标，还有《路人女主》《MyGO!!!!!》《言叶之庭》《P5》和《孤独摇滚》里的那些地方。' },
      { heading: '02 / 坡道与天桥', text: '第一段巡礼交给了《路人女主》的坡道，接着是《MyGO!!!!!》里那座与“想成为人类”有关的天桥。回头整理这一天时，我把作品和现实地点放在同一张地图上：坡道暂对照为のぞき坂，天桥则补上了千登世步道桥这个名字。原本只记得画面的地方，开始有了可以重访的坐标。' },
      { heading: '03 / 在城市与庭园之间', text: '随后，我去了记忆里的东京国立竞技场馆，再到新宿御苑进行《言叶之庭》巡礼，之后前往明治神宫。场馆、公园和神宫，构成了这一天中段的三个停靠点。御苑里的具体取景位置还留着空白，等照片和更多记忆补齐，再把这一页写得更细。' },
      { heading: '04 / 从《P5》到《孤独摇滚》', text: '离开明治神宫后，行程继续到三轩茶屋和下北泽：前者是这次《P5》巡礼的一站，后者则留给《孤独摇滚》。这份初稿先记下走到过的街区，不把后来查到的店名直接当成自己的足迹。等具体地点确认后，再让每一个小小的标记都有自己的故事。' },
      { heading: '05 / 在上野收尾', text: '这一天最后到了上野，吃了一顿寿司郎。从早上落地成田，到东京不同街区里的动漫巡礼，再到晚餐，第一天就这样串成了护照里的第一页。暂时没有写下来的细节，也留在这里，等下一次想起。' },
    ],
  }],
}

export function orderedDays(tripId) {
  return [...(travelDays[tripId] || [])].sort((a, b) => a.date.localeCompare(b.date))
}
export function mapStops(day, includeArrival = false) {
  return day.stops.filter(stop => Array.isArray(stop.geo) && (includeArrival || !stop.outsideCity))
}
