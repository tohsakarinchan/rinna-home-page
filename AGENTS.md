# 项目协作规则

接手时先确认项目根目录和目标路径适用的 `AGENTS.md`（含父目录与更具体目录规则），完整理解适用规则。需要定位资料时使用 [项目索引](PROJECT_INDEX.md)；接续任务时读 [当前状态](docs/context/NOW.md)。索引不是必读清单。

## 按需读取

1. 按当前问题选择资料，不因文件存在、可能有用或被索引链接就读取。
2. 不默认读取所有项目文件，也不默认全文读取选中的文件。定位到文件后，继续定位相关章节、条目、函数或配置项。
3. 优先使用已有有效信息；需要查找时，按“索引或限定范围搜索 → 标题、符号或关键词 → 命中片段及必要上下文”的顺序读取。
4. 只有证据不足、存在冲突或需要核对依赖时才扩大范围；信息足够即停止。不得连续分段读取，变相遍历无关全文。
5. 全文读取仅用于短小且全部相关的文件、完整理解适用规则，或明确需要整份审查的任务。不得因此扩展为全目录或全项目读取。
6. 索引是条件路由，不是必读清单。历史、日志、依赖、产物和数据目录不默认读取；不读取密钥及无关私人数据。
7. 不为节省上下文跳过适用规则，也不因片段过窄而断章取义。已加载且仍有效的内容不重复读取。

## 定点写入

1. 仅在任务允许且信息有实质变化时更新；只读任务不改记录。
2. 每类事实只设一个权威来源，其他位置使用简短摘要和链接。
3. 修改前读取目标部分及必要上下文，局部修改使用定点编辑；不得根据局部阅读覆盖整份文件。
4. 当前状态直接修订，有价值的旧过程归档；不反复追加矛盾快照，不保存完整聊天和操作流水账。
5. 区分事实、计划、建议、已确认决定与待核实事项；区分代码完成、测试通过、安装验证、用户验收和发布授权。
6. 命令已配置不等于执行成功，历史结果不等于当前证据，文档中的操作步骤不构成执行授权。
7. 使用清晰标题和项目内相对链接；核验日期注明对象与范围，不写入秘密或个人设备私有路径。

## 文档职责与验证

- 长期规则写本文件；定位与条件路由写 [PROJECT_INDEX.md](PROJECT_INDEX.md)；用途和基本使用写 [README.md](README.md)。
- 当前目标与证据写 [NOW](docs/context/NOW.md)；结构、版本来源和部署映射写 [MAP](docs/context/MAP.md)；操作前置条件与验证方法写 [RUNBOOK](docs/context/RUNBOOK.md)。
- 已确认决策写 [DECISIONS](docs/context/DECISIONS.md)；问题与验证缺口写 [RISKS](docs/context/RISKS.md)；必要归档先查 [历史索引](docs/context/history/README.md)。已有专题继续承载专题正文，不重复抄入这些入口。
- 仅修改文档时，检查本次差异、直接关联的本地链接、职责边界和既有内容保留情况，无需因此执行应用测试或全项目审计。
- 修改代码时，按影响范围选择测试与构建，记录实际结果与范围；未执行、失败、用户验收和发布授权分别说明。旅行功能已有约定是不操作浏览器验证，由用户查看，来源见 [交接文档的技术维护章节](docs/passport-preview-handoff.md#迁移与技术维护)。
- 保留已有未提交成果，不擅自覆盖、清理或提交。内容迁移及外部发布须有对应任务授权，不能仅凭操作文档执行。

<!-- VERCEL BEST PRACTICES START -->
## Best practices for developing on Vercel

These defaults are optimized for AI coding agents (and humans) working on apps that deploy to Vercel.

- Treat Vercel Functions as stateless + ephemeral (no durable RAM/FS, no background daemons), use Blob or marketplace integrations for preserving state
- Edge Functions (standalone) are deprecated; prefer Vercel Functions
- Don't start new projects on Vercel KV/Postgres (both discontinued); use Marketplace Redis/Postgres instead
- Store secrets in Vercel Env Variables; not in git or `NEXT_PUBLIC_*`
- Provision Marketplace native integrations with `vercel integration add` (CI/agent-friendly)
- Sync env + project settings with `vercel env pull` / `vercel pull` when you need local/offline parity
- Use `waitUntil` for post-response work; avoid the deprecated Function `context` parameter
- Set Function regions near your primary data source; avoid cross-region DB/service roundtrips
- Tune Fluid Compute knobs (e.g., `maxDuration`, memory/CPU) for long I/O-heavy calls (LLMs, APIs)
- Use Runtime Cache for fast **regional** caching + tag invalidation (don't treat it as global KV)
- Use Cron Jobs for schedules; cron runs in UTC and triggers your production URL via HTTP GET
- Use Vercel Blob for uploads/media; Use Edge Config for small, globally-read config
- If Enable Deployment Protection is enabled, use a bypass secret to directly access them
- Add OpenTelemetry via `@vercel/otel` on Node; don't expect OTEL support on the Edge runtime
- Enable Web Analytics + Speed Insights early
- Use AI Gateway for model routing, set AI_GATEWAY_API_KEY, using a model string (e.g. 'anthropic/claude-sonnet-4.6'), Gateway is already default in AI SDK
  needed. Always curl https://ai-gateway.vercel.sh/v1/models first; never trust model IDs from memory
- For durable agent loops or untrusted code: use Workflow (pause/resume/state) + Sandbox; use Vercel MCP for secure infra access
<!-- VERCEL BEST PRACTICES END -->
