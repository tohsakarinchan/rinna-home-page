# 项目映射

核验日期：2026-11-04；范围为三空间本地源码入口、旅行复用边界及既有构建映射，不证明线上正在使用这些版本。

## 页面与数据

| 对象 | 路径与关系 |
| --- | --- |
| 应用入口 | [src/main.js](../../src/main.js) 挂载 [app/App.vue](../../src/app/App.vue)，安装 [Vuetify](../../src/app/plugins/vuetify.js) 与 [路由](../../src/app/router.js)；[routes.js](../../src/app/routes.js) 定义独立空间和旅行层级，全部页面延迟加载；地址与行为见 [三空间专题](../three-spaces.md#第一阶段接口) |
| 主页配置 | [shared/config/defaults.js](../../src/shared/config/defaults.js) 保存默认值；[site.js](../../src/shared/config/site.js) 为唯一读取入口，统一处理 `VITE_CONFIG` 覆盖；字段说明见 [配置说明](../../img/config.md) |
| 空间与外壳 | [ExperienceLayout](../../src/features/experience/layouts/ExperienceLayout.vue) 管理导航、开场、控制中心与页脚；[HomePage](../../src/features/home/pages/HomePage.vue)、`features/experience/pages/` 分别维护三空间。[SceneStage](../../src/features/experience/components/SceneStage.vue) 提供分层资产/插槽；[scenes.js](../../src/features/experience/domain/scenes.js) 管理角色和四态描述；[useExperience](../../src/features/experience/composables/useExperience.js) 与 [过场控制器](../../src/features/experience/domain/cue-controller.js) 管理会话与可取消转场。旧 HomeLayout/HomeContent 保留但不再作为首页入口 |
| 旅行层级与展示 | [TravelLayout](../../src/features/travel/layouts/TravelLayout.vue) 提供共享摘要与详情缓存；`features/travel/pages/` 管理地球/国家页面；[TravelGlobe](../../src/features/travel/components/TravelGlobe.vue) 提供投影和可失败回退的 renderer 插槽。[countries.js](../../src/features/travel/domain/countries.js) 管理国家、坐标、努努与地标描述和国内分组；[useTripRoute](../../src/features/travel/composables/useTripRoute.js) 同步旅程地址与弹窗。[TravelPassport](../../src/features/travel/components/TravelPassport.vue)、[TripDialog](../../src/features/travel/components/TripDialog.vue)、[DailyJourney](../../src/features/travel/components/DailyJourney.vue) 继续承载既有护照、概览、地图和正文；非日本收藏不挂载日本地图 |
| 旅行逻辑 | `features/travel/api/` 管理摘要/详情请求与校验；`composables/` 的 [usePassportData](../../src/features/travel/composables/usePassportData.js)、[usePassportNavigation](../../src/features/travel/composables/usePassportNavigation.js)、[useJourneyMap](../../src/features/travel/composables/useJourneyMap.js)、[useReadingProgress](../../src/features/travel/composables/useReadingProgress.js) 分别管理数据、翻页、Leaflet 实例及阅读联动；纯逻辑在 `domain/`，本地种子和资料在 `data/` |
| 博客前端 | [API](../../src/features/blog/api/blog.js) 管理文章列表、正文和到访记录请求及校验；[BlogList](../../src/features/blog/components/BlogList.vue) 组合卡片与足迹弹窗，数据/搜索/文章阅读逻辑分别在 `features/blog/composables/`；搜索与到访记录转换在 `domain/`。保留当前首页隐藏独立博客列表的行为 |
| 外观与共享能力 | `features/appearance/` 管理设置、壁纸选择与播放；[共享动态偏好](../../src/shared/composables/useMotionPreferences.js) 供首页、旅行与地标使用；共用地理渲染组件位于 [shared/components/geography/](../../src/shared/components/geography/JapanPrefectureMap.vue)，不依赖旅行内容 |
| 样式入口 | [styles/index.css](../../src/styles/index.css) 顺序加载语义变量、基础样式、首页布局和主题；[tokens.css](../../src/styles/tokens.css) 保持当前默认视觉值，既有 `--leleo-*` 设置通过统一外观入口写入。特定组件样式归功能目录；`styles/legacy/` 集中保留旧 LESS 兼容样式，不再从 public/css 加载 |
| 护照服务 | [server/notion-passport.js](../../server/notion-passport.js) 为共享处理入口；`?view=summary` 只读旅行/地区，`?trip=<id>` 按关联读详情，不带参数保留完整响应；可选国家/地区字段与旧数据适配见 [三空间专题](../three-spaces.md#第一阶段接口)，不修改真实数据；数据库映射在 [passport-config.js](../../server/passport-config.js)，其余字段语义沿用 [交接专题](../passport-preview-handoff.md#内容在哪里编辑) |
| 博客与媒体 | [blog-list](../../server/blog-list.js)、[blog-post](../../server/blog-post.js)、[notion-media](../../server/notion-media.js) 为共享实现；`functions/api/` 提供 Sites/Pages 入口，`api/` 通过 [Node 适配器](../../server/node-adapter.js) 接入 Vercel |
| 静态资源 | `public/`、`img/`；都道府县地图固定于 `public/maps/japan-c686f194.geojson`，来源与更新约束见 [地图说明](../../public/maps/README.md)，由 [加载器](../../src/shared/lib/japan-geo.js) 同站读取 |
| 测试 | [package.json](../../package.json) 的 `test` 通过 [scripts/test.mjs](../../scripts/test.mjs) 枚举 `tests/*.test.js`，避免依赖平台通配符展开；`npm run check:source` 检查源码导入与全部 Vue 模板（含未在首页使用的列表）；按修改对象选择相关测试 |

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
