# 项目映射

核验日期：2026-10-28；范围为本地入口、共用服务和构建映射，不证明线上正在使用这些版本。

## 页面与数据

| 对象 | 路径与关系 |
| --- | --- |
| 应用入口 | [src/main.js](../../src/main.js) 挂载 RootApp 并安装路由；[路由](../../src/router/index.js) 将 `/` 指向 App、`/blog/:slug` 指向 BlogPost |
| 主页配置 | [src/config.js](../../src/config.js) 为配置文件；[src/app.js](../../src/app.js) 中搜索 `VITE_CONFIG` 定位覆盖逻辑；字段说明沿用 [配置说明](../../img/config.md) |
| 旅行界面 | [TravelPassport](../../src/components/TravelPassport.vue)、[DailyJourney](../../src/components/DailyJourney.vue)、[JapanPrefectureMap](../../src/components/JapanPrefectureMap.vue)；行为资料按 [索引](../../PROJECT_INDEX.md) 路由 |
| 护照服务 | [server/notion-passport.js](../../server/notion-passport.js) 为共享处理入口；`?view=summary` 只读旅行/地区，`?trip=<id>` 按关联读详情，不带参数保留完整响应；数据库映射在 [passport-config.js](../../server/passport-config.js)，字段语义沿用 [交接专题](../passport-preview-handoff.md#内容在哪里编辑) |
| 博客与媒体 | [blog-list](../../server/blog-list.js)、[blog-post](../../server/blog-post.js)、[notion-media](../../server/notion-media.js) 为共享实现；`functions/api/` 提供 Sites/Pages 入口，`api/` 通过 [Node 适配器](../../server/node-adapter.js) 接入 Vercel |
| 静态资源 | `public/`、`img/`；都道府县地图固定于 `public/maps/japan-c686f194.geojson`，来源与更新约束见 [地图说明](../../public/maps/README.md)，由 [加载器](../../src/utils/japan-geo.js) 同站读取 |
| 测试 | [package.json](../../package.json) 的 `test` 脚本指向 `tests/*.test.js`；按修改对象选择相关测试 |

## 版本与运行配置

- 版本声明、依赖范围和脚本以 [package.json](../../package.json) 为准；锁定解析以 `package-lock.json` 为准。未核实当前安装树与锁文件是否一致。
- [vite.config.js](../../vite.config.js) 配置 Vue 插件及 `/api` 到本地服务的代理；本地运行方法见 [RUNBOOK](RUNBOOK.md#本地开发)。
- `docs/` 已有三份旅行专题，基础上下文放在 `docs/context/`；包脚本另有 `docs:*`，其可用性见 [RISKS](RISKS.md#文档站命令)。

## 服务与部署候选入口

| 方式 | 源码 / 配置 | 输出或关联 |
| --- | --- | --- |
| 本地 API | [scripts/dev-api.mjs](../../scripts/dev-api.mjs) | 使用 `functions/api/` 处理器，与 Vite 代理配合 |
| Vercel | [api/passport.js](../../api/passport.js)、`api/`、[vercel.json](../../vercel.json) | 护照接口声明 `maxDuration: 60`；实际项目、域名、构建设置待核实 |
| Cloudflare Pages | `functions/api/`、[wrangler.jsonc](../../wrangler.jsonc) | 根配置输出 `./dist/client`；用户确认当前未单独使用 Cloudflare 部署 |
| Sites Worker 构建 | [scripts/build-sites.mjs](../../scripts/build-sites.mjs)、[worker/index.js](../../worker/index.js) | `build` 先生成 `dist/client`，再打包 `dist/server/index.js` 并生成服务端配置、复制 hosting 配置；Worker 含 `/api/*` 与 `/mcp` 分支 |

以上是仓库中的候选路径，不据目录存在认定当前生产平台。部署适配缺口见 [RISKS](RISKS.md#构建与部署映射)。本次未读取生产密钥或日志；本地产物检查结果见 [NOW](NOW.md)。
