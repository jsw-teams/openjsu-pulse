# Pagekiln

[English README](README.en.md)

<p align="center">
  <img src="content/assets/icon-192.png" alt="Pagekiln project icon" width="160">
</p>

Pagekiln 是一个偏 Hexo 思路的静态网站/博客构建器。站点信息放在 `config.yml`，文章和页面放在 `content/`，主题放在 `themes/<name>/`，构建输出到 `dist/`。

它的目标很直接：如果你只是写博客，就像普通 Markdown 博客一样改内容；如果你要客制化站点，再进入主题、配置和构建器扩展。默认主题已经包含多语言、归档、分类、标签、搜索、feed、sitemap、robots、llms、Agent discovery、Consent 偏好和可选第三方脚本加载。

## 直接使用

只写博客或维护普通内容站时，不需要先理解主题开发。按这个路径走：

1. 用仓库里的 `node bin/pagekiln.mjs init my-site` 创建站点；npm 发布后可改用 `npx pagekiln@latest init my-site`。
2. 改 `config.yml`：站点名、描述、作者、语言、导航、页脚、robots、llms、feed、插件开关和 discovery 信息都放这里。
3. 改 `content/posts/`：新增或编辑文章。
4. 改 `content/pages/`：调整首页、关于页、归档页、分类页、标签页、搜索页或其他普通页面。
5. 运行 `npm run server` 本地实时预览。
6. 发布前运行 `npm run generate` 和 `npm run check`。

常用命令对应 Hexo 用户习惯：

```bash
git clone https://github.com/jsw-teams/pagekiln.git
cd pagekiln
npm install
node bin/pagekiln.mjs init my-site
cd my-site
npm install
npm run server
npm run generate
npm run check
```

`pagekiln init` 使用仓库/包内的中立根项目模板。模板不包含生产/预览环境 secrets；站点名、`siteUrl`、analytics、robots、部署目标和环境配置都应由 fork 或二次开发者自行填写。

- `pagekiln generate` 类似 `hexo generate` / `hexo g`。
- `pagekiln server` 类似 `hexo server` / `hexo s`。
- `pagekiln check` 检查 `dist/`、主题资源、sitemap、feed、Agent discovery 和 WebMCP bootstrap。

`pagekiln init` 会在新项目的 `package.json` 中写入这些脚本；如果你在框架仓库或调试环境中直接调用 CLI，也可以使用 `node bin/pagekiln.mjs generate/server/check`。npm 包发布后，等价命令是 `npx pagekiln generate/server/check`。

本地预览默认地址：

```text
http://127.0.0.1:4173/
```

`npm run server` 每 10 秒监听 `content/`、`themes/`、`static/` 和 `config.yml`。检测到变更才重新生成。构建出错时预览进程不会退出，浏览器会显示错误；修好后会继续重建。`content/pages/<slug>/index.<locale>.md` 的变更会优先只重建对应页面。

## 内容与页面

文章路径：

```text
content/posts/<slug>/index.<locale>.md
```

页面路径：

```text
content/pages/<slug>/index.<locale>.md
```

默认特殊页也走同一套 pages 规则：

```text
content/pages/home/index.<locale>.md        # /<locale>/
content/pages/archive/index.<locale>.md     # /<locale>/archive/
content/pages/categories/index.<locale>.md  # /<locale>/categories/
content/pages/tags/index.<locale>.md        # /<locale>/tags/
content/pages/search/index.<locale>.md      # /<locale>/search/
```

`content/pages` 里的 Markdown 可以直接写 HTML。你可以在页面里写 `<header>`、`<section>`、`<img>`、少量页面脚本，也可以把动态组件放到想出现的位置：

```html
<!-- pagekiln:post-list -->
<!-- pagekiln:pagination -->
<!-- pagekiln:archive-list -->
<!-- pagekiln:terms -->
<!-- pagekiln:search-panel -->
<!-- pagekiln:languages -->
```

例如首页可以在 `content/pages/home/index.zh-CN.md` 里写页面介绍，然后把 `<!-- pagekiln:post-list -->` 放在文章列表位置。归档页可以写自己的标题和说明，再放 `<!-- pagekiln:archive-list -->`。这比“为了挪组件去改主题模板”更低成本。

把 slot 当成完整组件，不要在下面补重复说明。反例：

```html
<!-- pagekiln:search-panel -->
<p>输入关键词开始搜索。</p>
```

搜索面板已经包含输入框、空状态、结果数和错误提示。页面说明应放在 header 中，slot 自己负责组件状态。

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

## 目录结构

```text
config.yml              # 站点级配置
content/posts/          # 文章 Markdown
content/pages/          # 普通页面 Markdown/HTML
content/assets/         # 站务图标、OG 图和派生站点资产
bin/pagekiln.mjs        # CLI 入口
src/*.mjs               # 构建器 Node ESM 模块
src/pages/*.js|*.astro  # Astro 路由与生成端点
static/                 # 只放无法从配置生成的静态文件
themes/default/         # 默认主题
dist/                   # 构建产物
```

主题目录：

```text
themes/default/theme.yml         # 主题配置
themes/default/theme.example.yml # 可复制示例
themes/default/i18n.yml          # 主题文案
themes/default/style.css         # 全局主题 CSS
themes/default/styles/*.css      # 页面/功能 CSS
themes/default/templates/*.html  # 页面模板
themes/default/scripts/*.js      # Consent 入口与功能脚本
themes/default/source-assets/    # 主题自带插图和界面图片
```

JavaScript / MJS 分工：

- `bin/pagekiln.mjs` 是 CLI 入口，负责 `init`、`generate`、`server`、`check` 等命令分发。
- `src/*.mjs` 是构建器代码，运行在 Node.js/Astro 构建阶段。它们负责读取和合并配置、生成资产、渲染模板、处理 i18n、内容索引、OG 图片、Agent discovery、feed、sitemap、headers 等框架能力。
- `src/pages/*.js` 和 `src/pages/**/*.js` 是 Astro 端点，用来输出 `robots.txt`、`llms.txt`、`openapi.json`、feed、Markdown API 等生成文件。
- `themes/<name>/scripts/*.js` 是浏览器端主题脚本。它们只负责页面行为和 consent-aware 功能加载，例如搜索、媒体增强、lightbox、评论加载和 WebMCP 客户端辅助逻辑。
- 修改站点视觉、交互或第三方功能时，优先改 `themes/<name>/theme.yml`、CSS、模板和主题 `scripts/*.js`。只有新增构建期能力、输出文件或通用主题 API 时，才改 `src/*.mjs`。

站务资产约定：

- `content/assets/icon-source.png` 是站点图标源图。
- `content/assets/og-default-source.png` 是默认 Open Graph 源图。
- `scripts/generate-neutral-assets.mjs` 只负责裁切和导出派生文件：`favicon.ico`、`favicon-32x32.png`、`apple-touch-icon.png`、`icon-192.png`、`icon-512.png`、`og-default.png` 和 `og-default.jpg`。它不负责设计图标或重新绘制 OG 图。
- 图标、PWA 颜色、OG 默认图这类站点身份信息属于 `config.yml` 和 `content/assets/`；主题 `source-assets/` 只放主题自己的插图或界面图片。
- 其他主题插图或状态图应直接作为主题源资产维护，不要塞进站务裁切脚本。

## 站点配置

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

- `siteName`、`description`、`author`：生成标题、SEO 摘要、JSON-LD、feed 和默认页面文案。
- `defaultLocale`、`activeLocales`：决定多语言路由、语言切换和 hreflang。
- `nav.links`、`nav.utilityLinks`：生成主导航、搜索入口、归档入口和站点级链接。
- `footer`、`head`、`pwa`、`icons`：生成页脚、头部元信息、PWA 和图标资源。
- `plugins`、`features`、`featureScripts`、`featureCategories`：控制搜索、评论、统计、广告、WebMCP 和 consent 加载策略。
- `robots`、`llms`、`feed`、`discovery`：生成 `robots.txt`、`llms.txt`、`llms-full.txt`、`feed.xml`、`openapi.json`、`.well-known/api-catalog`、`.well-known/mcp/server-card.json` 和 `_headers`。

如果某个站务文件能从 `config.yml` 推导出来，就不要在 `static/` 里维护另一份手写版本。需要改 robots、llms、OpenAPI、API catalog、MCP server card 或 `_headers` 时，优先改配置或补动态生成逻辑。

## 客制化与二次开发

只写博客时停留在 `config.yml` 和 `content/` 即可。需要改整体视觉、页面外壳、主题脚本、插件加载方式，或新增构建器能力时，再进入二次开发。

推荐顺序：

1. 先读 `config.yml`，把站点名、语言、导航、页脚、插件、consent、robots、llms 和 discovery 信息整理成结构化配置。
2. 在 `content/pages` 里调整页面文案、静态 HTML 结构和动态 slot 位置。
3. 复制 `themes/default` 到 `themes/<your-theme>`，把 `config.yml` 里的 `theme.name` 改成新主题名。
4. 改 `themes/<name>/theme.yml` 管理主题资源、页面样式、功能脚本、consent 分类和插件默认值。
5. 改 `themes/<name>/templates/`、`style.css`、`styles/` 和 `scripts/`。
6. 只有主题 API 表达不了时，才改 `src/`。

新项目不建议长期沿用 `default` 作为主题名。复制默认主题后，把目录改成当前项目合适的名称，例如 `themes/company-docs/`、`themes/product-site/` 或 `themes/portfolio/`。

CSS 放置建议：

- 小而通用的主题样式放进 `themes/<name>/style.css`，避免为了几十行以内的页面差异额外加载多个阻塞 CSS 文件。
- 只有当某个页面样式明显较多、复用度低，或只服务少数页面的复杂布局、动画、组件状态时，才拆到 `themes/<name>/styles/*.css`，再通过 `theme.yml` 的 `pageStyles` 按页面加载。
- consent、search、comments、ads、gallery、docs toc 等功能边界清楚的组件样式，可以独立成 feature/page style，方便按功能或页面加载。
- 不要把正式 CSS 写进 Markdown/HTML。`content/pages` 负责内容结构和动态 slot 位置，主题 CSS 负责视觉系统。

## 开发动态 Slot

当页面需要“用户能在 Markdown/HTML 里决定位置，但内容由构建器生成”的区域时，才新增 `<!-- pagekiln:xxx -->`。文章列表、分页、归档列表、标签集合、语言切换、相关文章、搜索面板适合做 slot；固定文案、静态链接或一次性 HTML 直接写在 `content/pages` 里。

slot 不是“插入静态 HTML 的另一种语法”。如果内容可以直接写成 Markdown/HTML，就不要新增 slot；只有构建器需要注入动态数据、交互状态、跨语言 UI 字符串或运行时组件时，才使用 slot。

开发流程：

1. 使用短横线小写命名：`<!-- pagekiln:related-posts -->`，代码里对应 `relatedPosts`。
2. 在 `src/lib/theme-html.mjs` 的页面渲染函数中生成组件 HTML，并传给 `replaceSlots(pageContent.html, { relatedPosts })`。
3. 如果 `src/templates.mjs` 有 fallback 渲染路径，同步加入同名 slot。
4. 模板中保留 `{{{content}}}`，让 Markdown 和 slot 输出进入主题模板。
5. 组件文案放进 `themes/default/i18n.yml`，并同步 `src/i18n.mjs` 默认值。
6. 样式和脚本通过 `theme.yml` 的 `pageStyles`、`pageScripts`、`featureScripts` 或 `featureStyles` 挂载。
7. 更新 README、`AGENTS.md` 和 `static/AGENTS.md` 的 slot 列表。
8. 运行 `npm run generate` 和 `npm run check`。如果是新的框架契约，也补检查脚本。

slot 组件应自己输出完整、可访问、可运行的内部状态，不应要求用户在 slot 后面补“这里会显示结果”之类说明。

## 插件与 Consent

插件是可选能力。简单站点可以完全不用插件；复杂站点可以按需启用搜索、评论、统计、RUM、广告、地图、表单、商务或自定义脚本。

默认主题只有 `scripts/consent.js` 无条件加载。未保存隐私偏好前，评论、统计、广告和营销脚本不会加载；用户保存选择后，构建器按 `necessary`、`preferences`、`analytics`、`marketing` 等分类加载对应功能。WebMCP 发现脚本由构建器内联，用于让浏览器代理在页面加载时发现站点工具。

评论只应启用一个 provider。统计、RUM、广告等第三方脚本应放在主题配置的 `plugins` 下，并标明 consent 分类。

## 生成内容

构建会生成：

- 首页与分页
- 文章页
- 归档页
- 分类页与分类详情页
- 标签页与标签详情页
- 普通 pages 页
- 搜索页与搜索索引
- `feed.xml`
- `sitemap.xml`
- `robots.txt`
- `llms.txt`、`llms-full.txt`
- `openapi.json`
- `.well-known/api-catalog`
- `.well-known/mcp/server-card.json`
- `_headers`

不要手改 `dist/`。

## Agent 协作

根目录 `AGENTS.md` 是给 Codex、Claude 或其他代码代理看的项目说明。

只是写博客时，可以这样提示：

```text
请先阅读 README.md、AGENTS.md 和 config.yml。我只是使用 Pagekiln 写博客，请优先修改 config.yml 和 content/ 下的文章或页面；除非我明确要求客制化主题或构建器能力，不要改 themes/ 或 src/。
```

做二次开发时，可以这样提示：

```text
请先阅读 AGENTS.md 和 config.yml。把 config.yml 当作站点名、多语言、导航、插件、consent、页脚、robots、llms、OpenAPI、API catalog、MCP server card、headers 和其他站务配置的结构化来源。优先修改 config.yml、content/pages 和主题目录；只有主题 API 无法表达需求时才修改 src/。
```

如果已安装 [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) 或 [anthropics/skills](https://github.com/anthropics/skills/)，可以在提示里点名使用对应 skill。它们不是运行依赖，只是协作约束。

多语言页面同步时，以 `zh-CN` 为内容和结构源，除非某个语言版本明确需要差异化。

## 部署说明

Pagekiln 可以部署到 Cloudflare Pages，也可以部署到任何能托管 `dist/` 的静态托管服务。当前公开仓库不提交真实 Cloudflare credentials、account IDs、project names、zone IDs 或生产部署 secrets。

如果使用 Cloudflare Pages Git 集成，可以按自己的项目填写：

```text
Build command: npm install && npm run generate
Build output directory: dist
Node.js version: 22.12 或更新
```

## 开源协议

Pagekiln 使用 `AGPL-3.0-or-later`。基于 Pagekiln 修改、分发、公开部署或二次开发的版本，应按 AGPL 要求继续开源对应源码。

请保留原作者标注：`Pagekiln by JSW Teams`，并保留或等效展示仓库中的 `NOTICE` 信息与原始仓库链接。
