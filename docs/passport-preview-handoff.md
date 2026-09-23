# 旅行护照：Notion 管理与部署交接

2026-09-23 已按用户正式部署要求完成 Notion 迁移。生产组件通过 `/api/passport` 读取 Notion，不再导入本地旅行常数。以下是迁移约束与后续维护约定。

用户要求，后续继续遵守：

- 将旅行、贴纸标题／色彩／印章、每日日期与顺序、站点与定位精度、照片（含替代文字与署名）、资料来源、游记正文迁移到 Notion。
- 复用并检查已有旅行数据库，迁移应可重复运行，不能覆盖用户编辑或重复生成记录。
- 网站通过服务端 API 读取 Notion；凭证只留在服务端，保留加载、失败和空白状态。
- Notion 日期与站点排序驱动翻页；不要生成尚未提供的日程。
- 本地 `src/constants/trips.js` 与 `travel-days.js` 是预览素材，不是正式的数据源。
- 每日正文标注为代拟草稿；のぞき坂的个人到访匹配和国立竞技场场馆名称仍待确认。
- 三轩茶屋、下北泽、上野及机场使用区域锚点，不得误称为精确到访地址或实际 GPS 路线。
- 保留 Anitabi 署名、链接及衍生地标数据 CC BY-NC-SA 4.0 说明。

截至 2026-09-22，仅已收到第一次旅行的第 1 天：2024-06-07，共九站。后续日期与素材待用户提供。

## 内容在哪里编辑

在原管理页下新增四个表，现有 Places 与 Visits 未修改：

- [旅行護照 · Trips](https://www.notion.so/3e4553158fba8199bae3d0b70e44cdb8)：5 笔。Name 为贴纸标题，Month 仅记录月份；Order 排序，Subtitle、Destinations、Stamp、Color、Icon、Effect 控制贴纸内容。Places 关联原有地区表。
- [每日旅行 · Days](https://www.notion.so/3e4553158fba819fae25d4a2b0134517)：1 笔。Trip 关联旅行，Date 驱动日期翻页，Day 是旅行天数，Name/Subtitle 为每日标题。Journal title/notice 为游记标题与草稿说明，Location notice/References 为校对与可点击来源。
- [旅行站點 · Stops](https://www.notion.so/3e4553158fba81638a29fb1373362cc1)：9 笔。Day 关联日期，Order 为站点顺序，Latitude/Longitude 为坐标，Zoom 为街区放大层级，Outside city 控制机场是否计入市区范围。Provisional 保留待确认状态。Notes、Category、Source、Contributor、Original source、License 管理说明和来源。
- [旅行游記 · Chapters](https://www.notion.so/3e4553158fba81c7b365c88d5bd40101)：5 笔。Day 关联日期，Order 排序，Name 为段落标题，Body 为正文（可直接编辑属性，不需要写代码）。

每张表的 Published 控制是否在网站展示；未发布的旅行／日期不会显示其子内容。新增记录时先填写必需字段与关联，再开启 Published。日期不能为空，站点坐标必须有效，否则 API 返回错误并提供重试，不会偷偷退回预览资料。

照片放在 Stops 的 Photo 文件属性，首张作为卡片照片；支持上传或外部图片。Photo alt、Photo credit、Photo source 分别是替代文字、署名、来源。当前没有真实照片，字段留空，网站继续使用设计占位；不要放无关图片。

Color 使用六位十六进制色值，Icon 使用 `mdi-...` 名称，Effect 可选 `lights`、`snow`、`petals`、`steam`、`cloud`。日期按 Date 自动排序；不要为未知行程生成日期。Notion 修改通常约 1–3 分钟在重新加载网站后显示（服务端缓存）。

## 迁移与技术维护

- `node scripts/migrate-passport.mjs` 仅检查；加 `--apply` 才新增缺失的表和记录。按表名、父页面、Key 查重，已有记录一律跳过，不覆盖人工编辑。不要修改已有 Key；新记录的 Key 应唯一。
- 首次迁移新增 20 笔，第二次执行新增 0、跳过 20；迁移前后对 Places/Visits 完整页面数据做哈希比对，保留 10 个地区、17 笔到访。
- `scripts/import-travel-2026.mjs` 是此前一次性脚本，仍不提交、不执行。
- 数据库 ID 位于 `server/passport-config.js`，不是凭证；Notion token 仍只来自服务器环境变量。生产使用原有 `NOTION_TOKEN` 与 `NOTION_PLACES_DATABASE_ID`。
- 本地常数仅保留作迁移种子与测试资料；正式前端不导入它们。生产 API 仅读取 Published 内容，照片签名链接通过短缓存刷新。
- `npm test` 覆盖排序、关系、分页、照片、无效 URL、空白及失败状态；`npm run build` 校验构建。用户要求后续修改不操作浏览器验证，由用户自行查看页面。
