# Pagekiln

Pagekiln 2.0 是 TypeScript/Node 22+ 的静态优先网站编译器。它把 YAML 1.2 Frontmatter、CommonMark/GFM Markdown、Pattern、Block 和 Schema Data 编译成可检查、可部署的 `dist/`。页面内容写在 Markdown，主题负责结构与视觉，编译器负责路由、翻译、资源和交付文件。

## Quick Start

```bash
npm install
npm run g -- --profile
npm run check
npm run s
```

源码仓库使用 `npm run g`、`npm run check` 和 `npm run s`；将项目用 `npm link` 链接到本机或安装已发布 CLI 后，才使用 `pagekiln g`、`pagekiln check` 和 `pagekiln s`。打开 `http://127.0.0.1:4173/` 选择网站版本。语言选择页保留语言自称：`简体中文`、`繁體中文` 和 `English`。`g --profile` 会输出 discover、load、validate、parse、route、render、assets、write 各阶段时间。构建后的页面不为每页启动 HTTP 或 Fetch 生命周期；`src/runtime/` 是预编译 JavaScript。

## Start Writing

### Content paths

通用页面放在 `content/pages/<id>/<locale>.md`，产品笔记放在 `content/posts/<id>/<locale>.md`，资源放在 `content/assets/`。默认站点提供 `zh-sg`、`zh-tw`、`en`，文件名最后的 locale 决定翻译关系、路由和 hreflang。

```markdown
---
title: 发布一条可复用的产品笔记
description: 记录一次明确的产品决定。
pattern: blog
date: 2026-08-09
cover: /assets/product-note-cover.webp
---

# 发布一条可复用的产品笔记

先写决定、证据和后续影响。`<more>` 前的内容会成为归档摘要。

<more>

这里是完整正文，仍然是普通 Markdown。
```

### Markdown model

正文支持 GFM 表格、任务列表、删除线、引用、代码围栏和自动链接。Block Directive 只承载短标量属性，标题、列表、表格和说明保留在 Markdown：

```markdown
:::feature-grid{columns="3"}
### 页面
适合首页、说明和目录。

### 产品笔记
适合持续记录产品决策。

### 主题
适合二次开发视觉与页面结构。
:::
```

未知 Block、错误属性、缺少 schema 字段和路由冲突会报告源文件、行列和修复建议。原始 HTML 默认转义；只有经过代码审阅的可信值才可使用 `unsafeHtml`。MDX、JSX、虚拟 DOM 和 HTML comment Slot 不在编译路径中。

### Built-in outputs

站点默认生成静态 HTML、404、自定义 Feed（RSS/Atom 类的更新订阅文件）、`sitemap.xml`（搜索引擎站点地图）、本地搜索索引、`llms.txt`（给 Agent 读取站点入口的简明文本）、`.pagekiln/catalog.json`（列出主题能力和内容上下文）以及 `.well-known/agent.json`。搜索结果会标注命中标题、摘要、正文小节或路径，而不是只给出模糊标题。

## Secondary Development

### Project structure

```text
config.yml                 站点信息、语言、路由、collection 和插件开关
content/                   Markdown 内容与用户资产
themes/default/            theme.yml、i18n.yml、theme.ts、style.css、插件脚本和 Pattern/Block 资源
src/compiler.ts            BuildContext、解析、schema、依赖图、缓存和静态输出
src/theme-api.ts           主题 Pattern、Block、Shell 契约
src/lib/                   Markdown、SafeHtml、URL 与小型基础模块
src/fetch-router.ts        共享 Web Standard Fetch 路由器
backend/handler.ts         动态业务和秘密读取的唯一来源
test/                      单元、集成和输出契约测试
scripts/benchmark.mjs      临时规模夹具，不写入生产 dist
```

`src/runtime/`、`.pagekiln/` 和 `dist/` 都是生成物，不手动编辑。项目根目录的 `src/` 不再保留空的旧层；需要新的内容能力先检查主题和现有 Block。

### Commands

| 命令 | 用途 |
| --- | --- |
| `pagekiln init` | 创建不含生产域名、令牌和个人身份的中性项目 |
| `pagekiln g --profile` | 生成静态站点并写入机器可读构建剖面 |
| `pagekiln s [port]` | 长期保持 BuildContext 的增量预览 |
| `pagekiln d --dry-run` | 按 `config.yml` 预览部署动作，不上传 |
| `pagekiln d` | 按 `config.yml` 将 `dist/` 上传到明确目标 |
| `pagekiln check` | 检查 Markdown、schema、Block、路由和输出 |
| `pagekiln catalog` | 查看当前主题的 Pattern、Block、schema、示例和资源依赖 |
| `pagekiln inspect <id>` | 查看内容身份、路由、locale 和 Directive 源位置 |

### Theme-first extension

二次开发从 `themes/<name>/` 开始。复制默认主题后，在 `theme.ts` 中新增 Pattern 或 Block，在 `theme.yml` 中声明 schema，把样式统一写入 `style.css`，并把可选能力放在带 `enabled: true|false` 开关的 `plugins.<name>` 二级节点；本地化 UI 文案放进独立的 `i18n.yml`。页面 shell、移动端断点、目录展开、搜索命中标注、无动效默认和 Cookie 选择器都属于主题边界。普通页面不 hydration。

Pattern → Block → Schema Data 是推荐组合方式。集合、翻译 fallback、Feed、站点地图、搜索、图片缓存、增量依赖图和部署产物由核心提供，避免为每个页面重复写模板。

### Configuration boundaries

`config.yml` 只管理站点信息、语言、导航、collection、路由、schema、图片处理、搜索、隐私和部署等设置。它不是 CSS、HTML、浏览器脚本或 `unsafeHtml` 注入入口。视觉与行为进入主题目录，动态业务进入 `backend/handler.ts`。

默认主题只保留实际使用的 `style.css`。CSS 构建为压缩单行文件，CSS 和原生 ESM 文件名使用内容指纹版本化，不依赖查询字符串缓存。OG 图和产品笔记封面由图片变体配置生成，未提供页面资源时使用默认源图。

### Privacy and accessibility

Cookie 选择器由主题的 `privacyConsent` 插件声明，并可由主题和 `config.yml` 中的 `enabled` 开关关闭。必要类别默认存在，可选类别默认关闭；未同意前不会插入可选脚本。人类访客从页脚打开本地化设置，Agent 读取单独的 JSON 披露文件，两者不混在同一入口中。输出包含跳过链接、语义标题、键盘焦点、`aria` 状态、hreflang 和站点地图；移动端表格转为带字段标签的纵向内容，目录展开后随页面流动，不依赖原生横向滑动条。

可选服务写在 `config.yml` 的 `privacy.cookieConsent.integrations` 中，不填写脚本路径。内置 provider 包括 `googleAnalytics`（`measurementId`）、`googleAds`（`conversionId`）、`cloudflareWebAnalytics`（`token`）和 `baiduTongji`（`siteId`）；它们只有在对应类别获得选择后才加载，Google 同步 Consent Mode，百度保留官方异步代码，Cloudflare Web Analytics 即使不使用 Cookie 也作为可选数据发送服务处理。

```yaml
privacy:
  cookieConsent:
    integrations:
      googleAnalytics: { enabled: true, measurementId: G-XXXXXXXXXX, category: analytics }
      googleAds: { enabled: true, conversionId: AW-XXXXXXXXXX, category: advertising }
      cloudflareWebAnalytics: { enabled: true, token: YOUR_CLOUDFLARE_TOKEN, category: analytics }
      baiduTongji: { enabled: true, siteId: YOUR_BAIDU_SITE_ID, category: analytics }
```

### Deployments and dependencies

统一 `dist/` 可直接交给 CDN、Caddy 或 Nginx。部署目标和路径只写在站点根目录 `config.yml`；`targets` 可以填一个目标，也可以填多个目标，按列表顺序执行：

```yaml
deployment:
  targets: [vps, cloudflare-pages]
  cloudflare:
    accountId: CF_ACCOUNT_ID
    apiTokenEnv: CLOUDFLARE_API_TOKEN
    pages:
      project: site-name
      branch: production
    workers:
      name: site-worker
      compatibilityDate: '2026-08-10'
  github:
    remote: origin
    branch: gh-pages
    tokenEnv: GITHUB_TOKEN
  vps:
    host: vps.example.com
    user: deploy
    port: 22
    remotePath: /var/www/site
    identityFile: ~/.ssh/id_ed25519
    publicKeyFile: ~/.ssh/id_ed25519.pub
```

然后运行 `pagekiln d`；`pagekiln d --dry-run` 只检查所有已选动作。Cloudflare Pages 需要项目名，可选分支；Workers 需要 Worker 名称和兼容日期。配置 `cloudflare.apiTokenEnv` 后，脚本只从该环境变量读取 Cloudflare API token；省略或设为 `null` 时交给 Wrangler 使用本机登录状态。GitHub 需要已存在的 remote 名称和目标分支；配置 `github.tokenEnv` 后，HTTPS remote 使用子进程环境中的 Git authorization header，token 不进入命令行、配置或日志，SSH remote 则继续使用本机 SSH agent/config。VPS 需要主机、用户、SSH 端口和已存在的远程目录；`identityFile` 是私钥，`publicKeyFile` 可选用于确认配套公钥文件存在，公钥必须预先放在服务器的 `authorized_keys` 中，Pagekiln 不上传密钥。所有凭据只存在运行时环境或本机密钥文件中。OpenAI Sites 目标仍是可选适配，但本项目已移除 Sites 绑定，不会再默认发布到该平台。

凭据边界遵循 [GitHub 的 HTTPS token 说明](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)、[Wrangler 的 Cloudflare API token 说明](https://developers.cloudflare.com/workers/wrangler/commands/general/) 和 [OpenSSH scp 的 `-i` 私钥参数](https://man.openbsd.org/scp.1)。部署成功只代表托管平台接收并发布了产物，不代表所有地区都能访问；DNS、运营商路由、企业网络策略、平台区域可用性和自定义域名状态都可能造成部分地区打不开。面向多地区访客时，应从目标地区实测，并准备 Cloudflare、GitHub Pages 或 VPS 等替代出口。

生产直接依赖有明确职责：`markdown-it` 和 `markdown-it-task-lists` 解析 GFM，`yaml` 解析 YAML 1.2，`sharp` 生成图片变体，`lucide` 提供成熟开源 SVG 图标。遍历、watch、hash、路由、RSS、站点地图、搜索序列化、原子写和测试使用 Node/Web Standard，未增加重复便利包。

### Verification and limits

```bash
npm run compile-runtime
npm run compile-theme
npm run compile-backend
npm test
pagekiln g --profile
pagekiln check
npm run catalog
npm run inspect -- home
npm run bench -- 100
npm run bench:compare -- --sizes=100 --scenario=cold --tools=pagekiln,astro,eleventy,hugo
```

规模夹具在系统临时目录生成并在运行结束清理，默认测 100 份内容，可用 `--locales=3` 测三语言、`--images` 测图片缓存、`--quick` 测冷构建与无变化构建。每行 JSON 包含机器、阶段、场景、输出数量、图片计数和 `maxRssMiB`；它表示 Node 进程峰值常驻内存（RSS，KiB 除以 1024 得到 MiB），不是 `dist/` 大小，也不是单页占用。仓库不提交临时构建 JSON，也不把夹具结果伪装成产品承诺。

对比研究页只使用各工具官方文档可确认的能力，并将工具本身耗时与 Pagekiln 额外交付契约分开记录。完整边界和复现方式见 `content/pages/about/`、`content/pages/guide/` 与 `content/pages/development/`。

MIT 许可证、`NOTICE`、现有用户资产和可选的 `Pagekiln by JSW Teams` 署名策略必须保留。`branding.showAttribution` 只控制页脚是否显示署名，不改变许可证义务。
