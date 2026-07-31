# Pagekiln

[English README](README.en.md)

<p align="center">
  <img src="content/assets/icon-192.png" alt="Pagekiln project icon" width="160">
</p>

Pagekiln 是一个偏 Hexo 思路的静态网站/博客构建器。当前正式 npm 版本是 `1.1.0`。站点信息放在 `config.yml`，文章和页面放在 `content/`，主题放在 `themes/<name>/`，构建输出到 `dist/`。

它的目标很直接：如果你只是写内容，就像普通 Markdown 站点一样改 `content/`；如果你要客制化站点，再进入主题、配置和构建器扩展。`1.1.0` 起默认模板保持中性，不强制生成博客归档、分类、标签或搜索页；这些能力由 `content/pages` 文件和动态 slot 决定。默认主题仍提供多语言、文章、feed、sitemap、robots、llms、Agent discovery、Consent 偏好和可选第三方脚本加载等可复用能力。

## 快速上手

只写博客或维护普通内容站时，不需要先理解主题开发。先安装 pagekiln，初始化站点，改好配置和站点图标，然后用 `pagekiln s` 预览、`pagekiln g` 生成、`pagekiln c` 检查。

### 如何安装pagekiln

新建站点目录并安装 Pagekiln：

```bash
mkdir my-site
cd my-site
npm i pagekiln
npx pagekiln init .
```

`pagekiln init` 使用 npm 包内的中立根项目模板。模板不包含生产/预览环境 secrets；站点名、`siteUrl`、analytics、robots、部署目标和环境配置都应由 fork 或二次开发者自行填写。

如果你是在调试 Pagekiln 框架仓库本身，也可以直接运行：

```bash
node src/bin/pagekiln.mjs init my-site
```

### 如何运行pagekiln

常用命令对应 Hexo 用户习惯：

```bash
pagekiln s
pagekiln g
pagekiln c
```

- `pagekiln s` / `pagekiln server` 类似 `hexo server` / `hexo s`，用于本地实时预览。
- `pagekiln g` / `pagekiln generate` 类似 `hexo generate` / `hexo g`，用于生成 `dist/`。
- `pagekiln c` / `pagekiln check` 检查 `dist/`、主题资源、sitemap、按内容生成的 feed/搜索索引、Agent discovery 和 WebMCP bootstrap。

本地预览默认地址：

```text
http://127.0.0.1:4173/
```

`pagekiln s` 每 10 秒监听 `content/`、`themes/` 和 `config.yml`。检测到变更才重新生成。构建出错时预览进程不会退出，浏览器会显示错误；修好后会继续重建。`content/pages/<slug>/index.<locale>.md` 的变更会优先只重建对应页面。

`pagekiln init` 会在新项目的 `package.json` 中写入 `generate`、`server`、`check` 等兼容脚本；公开文档优先写 `pagekiln g/s/c`，完整命令 `pagekiln generate/server/check` 也可用。

### 如何配置站点配置

`config.yml` 是站点层入口。它不是普通构建参数附录，而是二次开发和 agent 协作时最重要的结构化信息来源。

最小示例：

```yaml
siteUrl: https://example.com
defaultLocale: zh-CN
activeLocales:
  - zh-CN
  - zh-TW
  - en
theme:
  name: default
```

适合放在 `config.yml` 的内容：

- `siteName`、`description`、`author`：生成标题、SEO 摘要、JSON-LD、feed 标题和默认页面文案。
- `defaultLocale`、`activeLocales`：决定多语言路由、语言切换和 hreflang。
- `nav.links`、`nav.utilityLinks`：生成主导航、搜索入口、归档入口和站点级链接。
- `footer`、`head`、`pwa`、`icons`：生成页脚、头部元信息、PWA 和图标资源。
- `plugins`、`features`、`featureScripts`、`featureCategories`：控制搜索、评论、统计、广告、WebMCP 和 consent 加载策略。
- `robots`、`llms`、`feed`、`discovery`：生成 `robots.txt`、`llms.txt`、`llms-full.txt`、有公开文章时的 `feed.xml`、`openapi.json`、`.well-known/api-catalog`、`.well-known/mcp/server-card.json` 和 `_headers`。

如果某个站务文件能从 `config.yml` 或根目录 `AGENTS.md` 推导出来，就不要维护另一份手写公开副本。需要改 robots、llms、OpenAPI、API catalog、MCP server card、`AGENTS.md` 或 `_headers` 时，优先改配置、根文档或补动态生成逻辑。

### 如何配置站点ICO图标和OG图

站点身份资源放在 `content/assets/`：

- `content/assets/icon-source.png` 是站点图标源图。定制站点时至少替换这张图，建议使用清晰的正方形 PNG，尺寸不小于 512x512，最好在 32px favicon 尺寸下仍能辨认。
- `content/assets/og-default-source.png` 是默认 Open Graph 源图。定制站点时至少替换这张图，建议使用 1200x630 PNG/JPG，画面要能代表站点，并适合在社交平台、聊天软件和链接预览中裁切展示。

替换 `icon-source.png` 或 `og-default-source.png` 后，直接运行：

```bash
pagekiln g
```

构建器会从源图生成 ICO、PWA icon 和 OG 分享图并写入 `dist/`，让站点图标与链接分享资源跟随项目定制化。派生文件可以继续保存在 `content/assets/` 作为模板资源，但它们不是构建入口；`pagekiln g` 优先读取源图并生成输出。

## 开始写作

写作阶段主要改 `content/pages/`；需要文章集合时再添加 `content/posts/`。`content/pages/` 和 `content/posts/` 整个目录不存在也不应影响构建。没有自定义页面时，Pagekiln 会生成中性的根入口、语言首页 fallback、404 和站务发现文件，而不是生成一组博客默认页。公开文章存在时，文章进入文章详情页、feed、sitemap、llms 和 Markdown mirror；页面用于首页、关于页、归档页、分类页、标签页、搜索页和其他普通页面。

页面路由由 `content/pages/*` 决定。删除 `content/pages/archive`、`categories`、`tags` 或 `search` 后，构建器不会再自动补这些博客型页面。`content/pages/` 缺失等同于没有自定义页面，不是构建错误；`content/posts/` 缺失等同于没有公开文章。搜索索引由页面里的 `<!-- pagekiln:search-panel -->` slot 牵引，未使用搜索组件时不会生成搜索索引、OpenAPI 搜索路径或 post search discovery。

### 如何开始写第一篇文章

文章路径：

```text
content/posts/<slug>/index.<locale>.md
```

例如：

```text
content/posts/hello-pagekiln/index.zh-CN.md
content/posts/hello-pagekiln/index.en.md
```

frontmatter 示例：

```yaml
---
title: "文章标题"
description: "SEO 摘要"
date: "2026-04-27"
updated: "2026-04-27"
translationKey: "welcome"
tags: ["站点公告"]
category: "公告"
draft: false
sitemap: true
cover: ""
---
```

`draft: true` 不会进入公开页面、搜索索引、sitemap、feed 或 llms 文件。`sitemap: false` 可单独排除某篇文章或页面。

### 如何开始编辑你的页面

页面路径：

```text
content/pages/<slug>/index.<locale>.md
```

默认特殊页也走同一套 pages 规则：

```text
content/pages/home/index.<locale>.md        # /<locale>/
content/pages/archive/index.<locale>.md     # 文件存在时输出 /<locale>/archive/
content/pages/categories/index.<locale>.md  # 文件存在时输出 /<locale>/categories/
content/pages/tags/index.<locale>.md        # 文件存在时输出 /<locale>/tags/
content/pages/search/index.<locale>.md      # 文件存在时输出 /<locale>/search/
```

`content/pages` 里的 Markdown 可以直接写 HTML。优先用常见 Markdown 语法表达内容结构，例如 `#`、`##`、`###` 标题、段落、列表、引用、表格、链接、图片、行内 `code` 和代码块；需要更明确结构时再写 `<header>`、`<section>`、`figure` 等语义 HTML。不要为了调样式给每段内容堆多个一次性 class。主题 CSS 应先覆盖 `h1`、`h2`、`h3`、`p`、`ul`、`ol`、`blockquote`、`table`、`code`、`pre` 等稳定元素，再给真正复用的布局、组件或 slot 容器加 class。动态组件可以放到想出现的位置：

```html
<!-- pagekiln:post-list -->
<!-- pagekiln:pagination -->
<!-- pagekiln:archive-list -->
<!-- pagekiln:terms -->
<!-- pagekiln:search-panel -->
<!-- pagekiln:languages -->
```

例如首页可以在 `content/pages/home/index.zh-CN.md` 里写页面介绍，然后把 `<!-- pagekiln:post-list -->` 放在文章列表位置。归档页可以写自己的标题和说明，再放 `<!-- pagekiln:archive-list -->`。

Slot 语法是全局识别的，但上下文分两类：

- 基础上下文：`search-panel` 只需要当前 `locale`，可放在任意页面。
- 首页列表上下文：`post-list` 需要 `posts`；`pagination` 需要 `page`、`totalPages`、`pageUrl`。
- 归档页上下文：`archive-list` 需要 `groups`，只应放在 `content/pages/archive` 这类归档页。
- Term 索引上下文：`terms` 需要 `terms`，只应放在分类页或标签页。
- 翻译入口上下文：`languages` 需要 `translations`，用于有多语言对应关系的页面或文章。

如果把上下文依赖 slot 放到没有对应数据的页面，`pagekiln c` 会报告未解析 slot，避免构建结果静默缺组件。

开发 slot 时保持一个数据入口和一个输出口：页面 renderer 只把自己拥有的原始数据传给 `replaceSlots()`，例如 `posts`、`groups`、`terms`、`translations` 和分页状态；slot 的 HTML 只由 `src/lib/slots.mjs` 的 `slotRegistry` 渲染。不要把预渲染 HTML 或 renderer 函数再塞回 slot 上下文。

把 slot 当成完整组件，不要在下面补重复说明。反例：

```html
<!-- pagekiln:search-panel -->
<p>输入关键词开始搜索。</p>
```

搜索面板已经包含输入框、空状态、结果数和错误提示。页面说明应放在 header 中，slot 自己负责组件状态。

## 二次开发

二次开发用于改整体视觉、页面外壳、主题脚本、插件加载方式，或新增构建器能力。普通站点优先改 `config.yml`、`content/` 和 `themes/`；只有主题 API 表达不了需求时，才改 `src/`。

### 了解这个项目

目录结构：

```text
config.yml              # 站点级配置
content/posts/          # 文章 Markdown
content/pages/          # 普通页面 Markdown/HTML
content/assets/         # 站务图标、OG 图和派生站点资产
backend/                # 可选后端/云函数源代码，不直接混入静态前端源
src/bin/pagekiln.mjs    # CLI 入口
src/*.mjs               # 构建器 Node ESM 模块
src/scripts/*.mjs       # 构建器内部辅助命令
src/pages/*.js|*.astro  # Astro 路由与生成端点
themes/default/         # 默认主题
dist/                   # 构建产物
```

构建会按内容来源生成：

- 根入口、语言首页 fallback 和 404；即使 `content/pages/` 不存在也应构建成功
- `content/pages/*` 中存在的普通页面；`archive`、`categories`、`tags`、`search` 只是可选页面，不会被构建器自动发明
- 公开文章存在时的文章详情页、`feed.xml`、语言级 feed 和 Markdown mirror
- 首页内容使用 `post-list` / `pagination` slot 时的文章列表和分页
- `content/pages/categories` 或 `content/pages/tags` 存在，且公开文章提供 term 数据时的 term 详情页
- 页面使用 `search-panel` slot 时的搜索索引、OpenAPI 搜索路径和 post search discovery
- `sitemap.xml`
- `robots.txt`
- `llms.txt`、`llms-full.txt`
- `openapi.json`
- `.well-known/api-catalog`
- `.well-known/mcp/server-card.json`
- `_headers`
- `AGENTS.md`

不要手改 `dist/`。根目录 `AGENTS.md` 是给 Codex、Claude 或其他代码代理看的项目说明，`pagekiln g` 会把它复制到 `dist/AGENTS.md` 作为部署后的站点级 agent guide。

Pagekiln 以静态优先，但可以按前后端一体项目组织。需要 Cloudflare Pages Functions、Cloudflare Workers、Node 服务、传统服务器或其他运行时后端时，源代码必须统一放在 `/backend`，让后端成为独立边界，而不是混进 `content/`、`themes/` 或构建器 `src/`。

后端边界建议：

- `content/` 和 `themes/` 仍按静态前端源文件处理，`pagekiln g` 把 HTML、CSS、JS、图片、按 slot 牵引生成的搜索索引、按文章集合生成的 feed 和 discovery 文件输出到 `dist/`，以便获得高缓存命中率。
- `/backend` 是唯一应该接触 secret、数据库连接、私有 API token、签名密钥、管理权限和写入型业务逻辑的目录。Cloudflare Pages Functions、Workers、队列消费者、webhook、表单处理、登录、支付、评论写入和管理接口都按这个边界组织。
- `/backend` 是后端源代码的唯一真相。如果目标平台要求函数位于部署输出里，应由构建脚本或部署适配器从 `/backend` 编译、复制或映射到 `dist/` 中对应的运行时目录；不要手写或维护 `dist/` 里的后端文件。
- 前端文件像普通 Web 前端一样通过公开 endpoint 调用后端；endpoint 路径由项目开发者自行设计，不要求使用固定命名。
- `config.yml` 只适合声明站点级公开调用契约，例如 base URL、endpoint key、method、consent 分类、是否需要 CAPTCHA、缓存意图、是否进入 OpenAPI/API catalog/MCP discovery。不要把真实密钥写入 `config.yml`。
- Cloudflare Web Analytics token、Google Ads client id、Giscus repo id 这类浏览器端第三方服务要求公开暴露的客户端标识，应放在对应主题插件配置中，例如 `themes/<name>/theme.yml` 的 `plugins.analytics` 或 `plugins.advertising`。只有在已经开发并启用对应插件时才填写；它们不是后端 secret，但仍应避免把真实生产值写入可复用的默认模板。
- 管理接口、高权限接口和内部工具接口不应进入 public manifest、OpenAPI、API catalog、MCP server card 或前端 discovery。

### 如何开发主题

二次开发不要套固定步骤。先判断正在做的网站类型，再选择最小合适边界：

- 内容站、文档站、博客：优先整理 `config.yml`、`content/pages`、`content/posts` 和 slot 位置；默认主题能表达时不需要复制主题。
- 官网、产品页、作品集、活动页：通常复制 `themes/default` 到 `themes/<your-theme>`，更新 `theme.name`，再改模板、CSS、页面样式和少量浏览器脚本。
- 工具型页面、目录站、案例库、产品集合：优先用 `content/pages` 定义可编辑页面结构，用主题模板和 slot 接入动态区域；只有通用数据模型或页面类型无法表达时才进 `src/`。
- 带表单、登录、评论写入、支付、webhook 或管理操作的网站：静态前端仍放 `config.yml`、`content/`、`themes/`；所有运行时后端和云函数源代码放 `/backend`。
- Pagekiln 框架能力、通用 slot、站务输出、资产生成、检查规则：才修改 `src/`，并同步 README、AGENTS 和检查脚本。

主题目录：

```text
themes/default/theme.yml         # 主题配置
themes/default/theme.example.yml # 可复制示例
themes/default/i18n.yml          # 主题文案
themes/default/style.css         # 全局主题 CSS
themes/default/styles/*.css      # 页面/功能 CSS
themes/default/templates/*.html  # 页面模板
themes/default/scripts/*.js      # Consent 入口与功能脚本
```

新项目不建议长期沿用 `default` 作为主题名。复制默认主题后，把目录改成当前项目合适的名称，例如 `themes/company-docs/`、`themes/product-site/` 或 `themes/portfolio/`。

CSS 放置建议：

- 小而通用的主题样式放进 `themes/<name>/style.css`，避免为了几十行以内的页面差异额外加载多个阻塞 CSS 文件。
- 只有当某个页面样式明显较多、复用度低，或只服务少数页面的复杂布局、动画、组件状态时，才拆到 `themes/<name>/styles/*.css`，再通过 `theme.yml` 的 `pageStyles` 按页面加载。
- consent、search、comments、ads、gallery、docs toc 等功能边界清楚的组件样式，可以独立成 feature/page style，方便按功能或页面加载。
- 不要把正式 CSS 写进 Markdown/HTML。`content/pages` 负责内容结构和动态 slot 位置，主题 CSS 负责视觉系统。
- 写 CSS 时优先面向 Markdown 生成的语义元素和少量稳定容器，例如 `main h1`、`.page-content h2`、`pre code`、`blockquote`。不要把页面内容拆成大量 `class="title title-large title-primary"` 这类只服务单页文案的样式。
- CSS/JS 源文件应保持可读、可维护；发布或部署输出可以压缩成一行以减少传输体积。不要手改 `dist/`，需要压缩时由构建器、主题构建脚本或部署适配器生成。

插件是可选能力。简单站点可以完全不用插件；复杂站点可以按需启用搜索、评论、统计、RUM、广告、地图、表单、商务或自定义脚本。默认主题只有 `scripts/consent.js` 无条件加载。未保存隐私偏好前，评论、统计、广告和营销脚本不会加载；用户保存选择后，构建器按 `necessary`、`preferences`、`analytics`、`marketing` 等分类加载对应功能。

### 如何开发动态 slot

当页面需要“用户能在 Markdown/HTML 里决定位置，但内容由构建器生成”的区域时，才新增 `<!-- pagekiln:xxx -->`。

文章列表、分页、归档列表、标签集合、语言切换、相关文章、搜索面板适合做 slot；固定文案、静态链接、静态布局和 Markdown/HTML 已经能表示的一次性结构，直接写在 `content/pages` 里，不要新增 slot。

开发流程：

1. 使用小写连续命名：`<!-- pagekiln:relatedposts -->`，代码里对应 `relatedPosts`。不要为旧名称保留兼容别名。
2. 在 `src/lib/slots.mjs` 的 `slotRegistry` 中声明 marker、上下文类型、所需字段、组件 HTML 和缺失上下文行为。
3. 在相关页面渲染函数中只传页面拥有的原始上下文数据，例如 `posts`、`page`、`totalPages`、`pageUrl`、`groups`、`terms` 或 `translations`。
4. 不要向 slot 上下文传预渲染 HTML，也不要传 renderer 函数；数据来源入口是页面 renderer，输出口是 `slotRegistry.render()`。
5. 模板中保留 `{{{content}}}`，让 Markdown 和 slot 输出进入主题模板。
6. 组件文案放进 `themes/default/i18n.yml`，并同步 `src/i18n.mjs` 默认值。
7. 样式和脚本通过 `theme.yml` 的 `pageStyles`、`pageScripts`、`featureScripts` 或 `featureStyles` 挂载。
8. 更新 README 和 `AGENTS.md` 的 slot 列表。
9. 运行 `pagekiln g` 和 `pagekiln c`。新增上下文依赖 slot 时，确保检查脚本能发现未解析 slot。

slot 组件应自己输出完整、可访问、可运行的内部状态，不应要求用户在 slot 后面补“这里会显示结果”之类说明。

### 如何开发/src构建器

普通站点使用 npm 包内置的默认 `src/`，不需要复制或维护自己的构建器源码。只有在做 Pagekiln 框架级二次开发、维护 fork，或要新增通用构建能力时，才进入 `src/`。

开发 `src/` 时按这条数据流理解：

1. `src/bin/pagekiln.mjs` 接收 CLI 命令，并把 `g/s/c` 分发到 `src/prebuild.mjs`、Astro build、`src/scripts/serve-public.mjs` 或 `src/scripts/check-build.mjs`。
2. `src/lib/content.mjs` 读取 `config.yml`、主题配置和 `content/`，产出文章、页面、多语言、分类、标签、slot 牵引的搜索、discovery 和站务数据。
3. `src/assets.mjs` 在 `pagekiln g` 阶段生成静态资产，包括从 `content/assets/icon-source.png` 与 `content/assets/og-default-source.png` 生成站点图标和 OG 输出。
4. `src/templates.mjs` 与 `src/lib/theme-html.mjs` 把数据渲染成 HTML；主题模板能表达的页面结构优先放在 `themes/<name>/templates/`。
5. `src/pages/` 只做 Astro 输出端点，把构建器数据发布成 HTML、XML、JSON、Markdown、OpenAPI、llms 和 well-known discovery 文件。

`src/` 文件组成思路：

- `src/prebuild.mjs` 是 `pagekiln g` 进入 Astro build 前的准备步骤。它读取站点配置和文章数据，提前发现构建期内容问题。
- `src/assets.mjs` 负责构建期资产整理：复制主题静态资源、复制 `content/assets` 的站点身份资源、生成 favicon / app icon / `site.webmanifest` / 默认 OG 图，并写入 `dist/`。
- `src/og-images.mjs` 负责把文章封面裁切成 1200x630 的分享图，支持本地与远程封面，使用 manifest 缓存，避免每次构建重复处理同一张图。
- `src/i18n.mjs` 保存内置 locale、语言标签、日期格式化和默认 UI 字符串，并允许主题 `i18n.yml` 覆盖或补充文案。
- `src/templates.mjs` 是内置 fallback 渲染层，负责 HTML shell、SEO meta、Open Graph、JSON-LD、导航、页脚、WebMCP bootstrap、文章卡片、分页、搜索面板、分类/标签列表和默认页面渲染。
- `src/lib/content.mjs` 是构建器的数据层核心。它读取并合并 `config.yml` 与主题配置，规范化插件和 consent 设置，渲染 Markdown，复制内容图片，加载文章和 pages，生成多语言路由、分类、标签、slot 牵引的搜索索引、feed、sitemap、headers、robots、llms、OpenAPI、API catalog 和 MCP server card 所需数据。
- `src/lib/slots.mjs` 集中声明 `<!-- pagekiln:xxx -->` slot registry、上下文依赖校验、搜索面板和归档列表等构建器组件。
- `src/lib/theme-html.mjs` 是 HTML 主题适配层。它读取 `themes/<name>/templates/*.html`，执行 `{{ }}` / `{{{ }}}` 简单模板替换，并通过 `src/lib/slots.mjs` 替换文章列表、分页、归档、terms、搜索面板和语言切换等 slot。
- `src/scripts/check-build.mjs` 和 `src/scripts/serve-public.mjs` 是 `pagekiln c`、`pagekiln s` 调用的内部命令；`src/scripts/generate-neutral-assets.mjs` 是框架开发时可用的站务资产裁切辅助脚本。
- `src/pages/[...route].astro` 是 Astro catch-all 页面出口，接收 `buildHtmlPages()` 生成的静态 HTML 路由。
- `src/pages/404.astro` 输出 404 页面。
- `src/pages/[feed].xml.js` 与 `src/pages/[locale]/feed.xml.js` 在有公开文章时分别输出全站 feed 和语言级 feed。
- `src/pages/robots.txt.js`、`src/pages/llms.txt.js`、`src/pages/llms-full.txt.js`、`src/pages/openapi.json.js`、`src/pages/.well-known/api-catalog.js`、`src/pages/.well-known/mcp/server-card.json.js` 输出站务与 agent discovery 文件。
- `src/pages/assets/[file].json.js` 在页面使用 `search-panel` slot 时输出搜索索引等 JSON 资产。
- `src/pages/md/[locale]/posts/[slug].md.js` 在有公开文章时输出 Markdown mirror，方便 agent 或外部工具读取原文。

修改建议：

- 新增可复用页面类型、站务输出、slot、配置合并规则、资产生成规则或检查规则时，才改 `src/`。
- 单个站点的颜色、布局、交互、第三方脚本、页面文案和图片不要写进 `src/`；放在 `config.yml`、`content/`、`themes/` 或 `/backend`。
- 改 `src/` 后运行 `pagekiln g` 和 `pagekiln c`。如果新增了框架契约，同步更新 README、AGENTS 和 `src/scripts/check-build.mjs`。

### Agent 协作

根目录 `AGENTS.md` 是给 Codex、Claude 或其他代码代理看的项目说明。

只是写博客时，可以这样提示：

```text
请先阅读 README.md、AGENTS.md 和 config.yml。我只是使用 Pagekiln 写博客，请优先修改 config.yml 和 content/ 下的文章或页面；除非我明确要求客制化主题或构建器能力，不要改 themes/ 或 src/。
```

做二次开发时，可以这样提示：

```text
请先阅读 AGENTS.md 和 config.yml。把 config.yml 当作站点名、多语言、导航、插件、consent、页脚、robots、llms、OpenAPI、API catalog、MCP server card、headers 和其他站务配置的结构化来源。优先修改 config.yml、content/pages 和主题目录；只有主题 API 无法表达需求时才修改 src/。
```

如果网站包含 Cloudflare Pages Functions、Workers、表单处理、登录、webhook 或其他运行时后端，可以这样提示：

```text
请先阅读 AGENTS.md、README.md 和 config.yml。静态前端仍按 Pagekiln 规则放在 config.yml、content/ 和 themes/；所有云函数和运行时后端源代码必须放在 /backend。需要部署平台产物时，可以由构建脚本从 /backend 生成到 dist/，但不要手写 dist/。
```

如果已安装 [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) 或 [anthropics/skills](https://github.com/anthropics/skills/)，可以在提示里点名使用对应 skill。它们不是运行依赖，只是协作约束。

多语言页面同步时，以 `zh-CN` 为内容和结构源，除非某个语言版本明确需要差异化。

### 部署说明

Pagekiln 可以部署到 Cloudflare Pages，也可以部署到任何能托管 `dist/` 的静态托管服务。当前公开仓库不提交真实 Cloudflare credentials、account IDs、project names、zone IDs 或生产部署 secrets。

如果使用 Cloudflare Pages Git 集成，可以按自己的项目填写：

```text
Build command: npm install && pagekiln g
Build output directory: dist
Node.js version: 22.12 或更新
```

正式版本发布应同步三处：`package.json` 版本、npm 包、GitHub Release 更新说明。`1.1.0` 已发布到 npm，更新范围包括：内容驱动页面生成；`content/pages/` 和 `content/posts/` 可整体缺失且构建成功；公开文章存在时才生成文章详情、feed 和 Markdown mirror；搜索索引由 `search-panel` slot 牵引；slot 上下文统一检查；`pagekiln s` 启动期 404 修复；consent 面板关闭按钮移到常规右侧位置。发布前已通过 `pnpm run build`、`pnpm run check`、`git diff --check` 和预览根路径 200 检查。

Pagekiln 使用 [MIT 许可证](./LICENSE)，允许商业使用、私有修改、再分发与闭源部署。复制或分发软件及其主要部分时，须保留版权声明与 MIT 许可声明。

请保留出处标注：`Pagekiln by JSW Teams`，并附上原始仓库链接。
