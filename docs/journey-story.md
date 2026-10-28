# 可复用游记与飞行过场
JourneyStory 接收 days、tripId 和可选 story。story 优先于 journey-stories.js 按游记 ID 保存的配置。无航班配置时直接切换，不套用其他旅行航线。
- prologue / epilogue：{ title, text }，text 为纯文本，支持换行。
- outbound / inbound：{ from, to, airline, livery, time }
- from / to：{ city, code, model }
- model：hongkong、tokyo、osaka；其他值使用通用楼群。新增地标扩展 JourneyCity。
- livery：{ primary, accent, label }，用于简化涂装客机，不代表已确认机型。
- time：day、afternoon、dusk、night，控制天空和日月。
- 地图站点 kind: airport 或名称包含机场/機場/空港/airport 时不显示；不因 outsideCity 删除其他郊外景点。
章节顺序：序言 → 去程 → 每日游记 → 回程 → 总结。
反向翻阅直接回到相邻章节，不把原航班反向播放。动画时长 4 秒，可跳过。关闭动效或系统要求减少动态时显示静态航班，手动继续。
当前六月旅行航班配置独立绑定到该旅行 ID。新增游记只需增加配置或传入 story。
序言、总结占位不写入 Notion，不编造个人经历；填写 text 即可替换。
