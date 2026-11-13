# 另一台电脑接力：签名开场与主页美术

接力日期：2026-11-13。请先读本文件，再按需读 [AGENTS](AGENTS.md)、[当前状态](docs/context/NOW.md) 和 [项目索引](PROJECT_INDEX.md)。

**临时文件删除要求：在新电脑完成接手、确认代码和环境可用，并将仍有价值的信息归入对应专题后，删除本文件。删除时同步移除索引中的临时入口；不要在尚未完成信息接收前删除，也不要把全文复制到其他入口。** 用户已要求这份临时交接随代码上传 GitHub。

## 已完成与本次发布范围

- 三空间主页、艾蕾四态入口、独立旅行层级及可取消过场；旅行护照双面翻页、纸叠、磨砂弹窗、地图和正文目录调整。接口及需求以 [三空间专题](docs/three-spaces.md) 为准。
- 全屏签名已实现：暖白背景逐笔写 Rinna，最后补空心 i 点，从该圆同心扩张揭开主页；时长约 3.32 秒，可跳过和重播，遵循减少动态偏好。**当前不是“签名变宝石”的最终演出，宝石和后续演出已暂缓。** 用户本次确认手写分镜已实现，不要重新设计或回退。
- 关键源码：[SignatureIntro.vue](src/features/experience/components/SignatureIntro.vue)、[signature-intro.js](src/features/experience/domain/signature-intro.js)、[useExperience.js](src/features/experience/composables/useExperience.js)。
- 场景入口：[HomePage.vue](src/features/home/pages/HomePage.vue)、[SceneStage.vue](src/features/experience/components/SceneStage.vue)、[scenes.js](src/features/experience/domain/scenes.js)、[experience.css](src/features/experience/styles/experience.css)。
- 2026-11-13：来源检查 44 个 Vue 组件、66 项测试和前端/Sites Worker 构建通过，仍有既有大 chunk 提示；实际打开本地构建预览，确认全屏开场进入主页。此轮未重新逐项检查全部旅行交互和真实手机；之前桌面/手机视口证据见 NOW。
- 本次用户已授权提交、GitHub 推送及部署全部现有项目改动。最终发布结果与应用提交以 [NOW](docs/context/NOW.md) 为准。该授权不延伸为以后每次美术修改的自动发布授权。

## 接力后首先处理的事项

用户因本机软件/性能限制转移工作。**不要立刻继续绘图或生成素材：先核对新电脑工具是否安装、能否可靠操作、是否有足够性能，再讨论制作流程。** 上次对话最终停在工具准备建议，并未验证 Blender、Krita/Photoshop、Cubism 的安装和能力。

用户明确否决使用 imagegen 生成背景。之前试生成的客厅/窗帘/火焰不属于采用方案，没有接入当前页面；本仓库没有可直接接力的正式背景、窗帘、火焰、人物或 Cubism 成品。不要把旧聊天中“已生成”当成获准使用，更不要声称这些资产随 GitHub 拉取就会出现。

工具建议仅为候选：Blender 搭房间和统一透视/光照；Krita 或 Photoshop 修绘与分层；真正 Live2D 需要 Cubism Editor 绑定/导出；Figma/Inkscape 可辅助构图。未授权自动安装或购买软件。用户希望精良的动画背景，仅靠简单手写 SVG 难以达成目标，不能以粗糙占位冒充最终美术。

## 美术方向与参考

整体：近景赤色宝石与魔术光效 → 中景伸手施法的远坂凛 → 远景远坂家室内；脸和手清晰，背景适度景深，近景和远景有不同视差。桌面人物偏右并留文字空间，手机需单独构图而非简单裁切。

后续以 ufotable《Unlimited Blade Works》客厅方向为主。旧对话实际查看了第三方收录的第 0 话截图，尚未逐帧核实影片时间码与完整房间布局：

- [客厅截图](https://formeinfullbloom.wordpress.com/wp-content/uploads/2014/10/rinsdrawingroom.jpg)
- [截图对应分析文章](https://formeinfullbloom.wordpress.com/2014/10/10/mistress-of-the-house-rin-tohsaka/)
- [UBW 美术集出版社资料](https://seikaisha.co.jp/books/others/44vje39mr/)；公开找到的部分内页是地下工房，不能当客厅证据。
- [较早的原作游戏客厅参考](https://trypticon.org/trips/japan-2010/fate/tohsaka%20residence%20-%20living%20room.png) 与动画布局不同，勿混用为同一版本。

动画参考特征：左侧高窗与暗红窗帘、中央后墙雕饰壁炉及交叉剑饰、右侧高书架与梯子、前景沙发与茶几、花纹地毯、深色格状天花与吊灯。采用方向是首页改编构图，不是已完成背景资产。

用户希望窗帘和壁炉有 Live2D 式细微动态。先确定静态整体构图与品质，再拆背景、窗帘、火焰/光晕、人物、宝石及前景层；被移动图层遮挡的背景也应完整。候选前端格式：静态背景 WebP；透明层 PNG/WebP；真正 Cubism 使用模型、纹理及设置文件。普通图层变形不等同 Cubism 模型。火焰可单独循环并联动局部暖光，幅度待确认。保留可编辑原档、素材来源与使用条件。

## 新电脑启动与验收

1. 从 [GitHub 仓库](https://github.com/tohsakarinchan/rinna-home-page) 获取最新 main；先检查本机未提交修改，不覆盖旧成果。按 README 安装依赖，使用锁文件恢复版本。
2. 按 [RUNBOOK](docs/context/RUNBOOK.md) 启动前端和本地 API。环境变量/凭证不在 Git 中；需要时通过用户既有安全渠道配置，不写入本文件或聊天。仅前端静态预览不能证明真实旅行 API 可用。
3. 先检查当前签名、跳过/重播、动态关闭、三空间导航与现有旅行功能，再讨论美术工具与资产计划。
4. 执行 `npm run check:source`、`npm test`、`npm run build`。每次后续页面修改必须自行打开本地预览看实际效果，修正后复查；旅行页同样适用。真实手机手感和最终审美验收单列，不仅凭构建通过宣称界面修复。
5. 接手成功后，将长期有效的新结论局部写入对应专题/状态文件，再删除本临时文件及其索引入口。

原讨论：Codex 聊天“研究全屏签名开场动画与万豪参考”，ID `01a1aec1-ca98-7541-9eef-d308eeb311d9`。本文件已提供接手必要摘要，不需要默认重读整段聊天。
