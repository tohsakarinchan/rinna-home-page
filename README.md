# leleo-home-page 个人主页

当前工作区在此个人主页基础上包含博客、Notion 旅行护照及游记功能。保留上游名称与演示资料；演示地址不代表本项目当前生产地址。

本地第一阶段已接入三空间：默认 `/` 为远坂凛主页，`/eresh` 为艾蕾四态空间，`/archer` 为弓凛旅行入口；从 `/travel` 选择国家后翻阅护照，原文章地址继续有效。顶部控制中心可切换动态、重播开场和回到最后打开的旅行；底部可展开页脚彩蛋。当前使用构图占位，逐页美术与接口约定见 [三空间专题](docs/three-spaces.md)，本地验证及发布边界见 [当前状态](docs/context/NOW.md)。

## 项目文档入口

- 按任务定位资料：[PROJECT_INDEX.md](PROJECT_INDEX.md)，它是条件路由，不是必读清单。
- 协作与读写规则：[AGENTS.md](AGENTS.md)；接续工作：[当前状态](docs/context/NOW.md)。
- 运行与维护细节：[操作手册](docs/context/RUNBOOK.md)；源码和部署关系：[项目映射](docs/context/MAP.md)。

核验日期：2026-10-22；本次仅核对文档及选定配置，未运行应用或验证线上环境。下文部署教程、上游演示及配置示例保留作历史参考，其与当前构建和平台设置的适配待核实，见 [验证缺口](docs/context/RISKS.md)。

## 目录
- [项目简介](#项目简介)
- [功能特性](#功能特性)  
- [演示地址](#演示地址)
- [技术栈](#技术栈)
- [安装与运行](#安装与运行)
  - [本地运行](#本地运行)
  - [Vercel在线部署](#vercel在线部署)
  - [CloudFlare Pages 在线部署](#cloudflare-pages-在线部署)
- [修改配置](#修改配置)


## 项目简介

这是一个简单的个人主页项目，用于展示个人信息、技能、项目等。主页设计简洁、响应式，适合在不同设备上浏览。支持自定义配置。

<img src="./img/leleo-home-page/1737532219807.png" width="600" alt="桌面端预览" style="display: block; margin: 10px auto;border-radius:8px;">
<img src="./img/leleo-home-page/1737533474493.png" width="170" alt="移动端预览" style="display: block; margin: 10px auto;border-radius:8px;">
<img src="./img/leleo-home-page/1737532290584.png" width="600" alt="功能预览1" style="display: block; margin: 10px auto;border-radius:8px;">
<img src="./img/leleo-home-page/1737532316302.png" width="600" alt="功能预览2" style="display: block; margin: 10px auto;border-radius:8px;">

## 功能特性

- **响应式设计**：适配桌面、平板和手机等不同设备
- **个人信息展示**：包括头像、个性标签、简介、技能等
- **项目展示**：展示项目，包括项目描述、技术栈和链接  
- **预览配置**：支持主题、背景壁纸预览（包括动、静态/PC、移动端壁纸设置）；音乐功能已移除，动态效果可切换并遵循系统偏好
- **在线部署配置**：支持vercel一键部署及使用vercel环境变量进行在线自定义配置

## 演示地址

[在线演示](https://leleo.top)

## 技术栈

- **前端**：Vue
- **UI框架**：Vuetify  
- **构建工具**：Vite
- **版本控制**：Git
- **部署平台**：Vercel

## 安装与运行

### 本地运行

在当前项目根目录操作，先准备 Node.js 和 npm。以下命令为使用说明，本次未执行。

1. 安装依赖：

```bash
npm install
```

2. 启动开发服务器：

```bash
npm run dev
```

博客与旅行功能还需要本地 API 和服务端配置，前置条件、变量加载顺序及验证方法统一见 [操作手册](docs/context/RUNBOOK.md#本地开发)。测试与构建方法见 [测试与构建](docs/context/RUNBOOK.md#测试与构建)。

### Vercel在线部署

> 无需服务器，点击链接一键在线部署到 [Vercel](https://vercel.com/new/clone?s=https://github.com/leleo886/leleo-home-page.git)（首先需要有github和vercel账号）

![Vercel部署步骤1](./img/leleo-home-page/1737785497852.png)

> ---登录vercel账号，并选择github关联账号，为项目取个名字，然后点击"Create"按钮开始部署

![Vercel部署完成](./img/leleo-home-page/1737538980894.png)

> ---部署完成后，点击回到控制面板

![Vercel控制面板](./img/leleo-home-page/1737539171658.png)

注意：Vercel提供的`.vercel.app`域名在中国大陆地区可能无法访问，所以建议绑定自定义域名。（若没有自己的域名，这里提供简单的[免费二级域名服务](https://sds.leleo.top)及本项目如何进行域名绑定的[说明](./img/domainToVercel.md)）

### CloudFlare Pages 在线部署

> 无需服务器，对站长友好(需要有CloudFlare以及Github账号)

1. Fork本项目到自己的账号下
   
2. 登录CloudFlare并点击左侧栏目中"计算(workers)"底下的"Workers 和 Pages"

![Workers页](./img/leleo-home-page/IMG_20250813_122124.jpg)

3. 点击右上角"创建"，选择"Pages"，点击"导入现有 Git 存储库"右侧的"开始使用"

![创建页](./img/leleo-home-page/IMG_20250813_122156.jpg)

4. 点击"连接 Github"，并登录你的 Github 账号

5. 选择项目存储库(如果你没有更名那应该是"leleo-home-page")并开始设置，在接下来的页面中框架预设选择`Vue`(如果不选择，你的网站会访问为空白)，点击保存并部署

![配置页](./img/leleo-home-page/IMG_20250813_122251.jpg)

此时，项目已经部署完成，可以直接点击上方链接预览

如果需要绑定域名，可以点击"添加自定义域"、"设置自定义域"并填入目标域，点击继续

> 你的域名托管在CloudFlare，直接点击"激活域"就可以完成

> 你的域名没有托管在CloudFlare，根据指引添加CNAME记录即可

## 修改配置

### 方法1. 修改配置文件

自定义默认配置位于 [src/shared/config/defaults.js](./src/shared/config/defaults.js)，字段见[配置说明](./img/config.md)。页面与设置通过 `src/shared/config/site.js` 统一读取配置。修改后按当前部署方式构建与发布，部署入口见 [MAP](./docs/context/MAP.md)。

**若使用此方法请勿配置环境变量**

### 方法2. 在线修改环境变量

**注意**：当前前端统一由 `VITE_CONFIG` 覆盖默认配置；它是构建期配置，不区分托管平台。

#### vercel部署

> (1). 首先还是打开vercel中本项目主面板，然后依次点击`Settings`、`Environments`、`Production`
![Vercel控制面板](./img/leleo-home-page/1737624788108.png)

> (2). 然后下翻点击`Add Environment Variable`按钮，要求填入`Key`值为`VITE_CONFIG`,`Value`值如[环境变量值](./img/env.md)所示，全部复制粘贴即可（有点多），根据个人情况自定义修改，配置说明同方法1。
![Vercel控制面板](./img/leleo-home-page/1737625015472.png)

> (3). 回到项目主面板，依次点击`Project`、`Build Logs`，进入新页面后再找到`Redeploy`。最后等待重新部署完成即可。
![Vercel控制面板](./img/leleo-home-page/1737626184576.png)
![Vercel控制面板](./img/leleo-home-page/1737626397809.png)

#### CloudFlare部署

> (1). 到你的Pages项目，点击"设置"，找到"变量和机密"点击右侧"添加"
![设置页](./img/leleo-home-page/IMG_20250813_125718.jpg)

> (2). 要求填入"变量名称"为`VITE_CONFIG`,"值"如[环境变量值](./img/env.md)所示，全部复制粘贴即可（有点多），根据个人情况自定义修改，配置说明同方法1

> (3). 点击"部署"，找到左侧带绿条的那个点击右侧三个点"重试部署" 等待部署完成即可
![重试部署](./img/leleo-home-page/IMG_20250813_131021.jpg)
