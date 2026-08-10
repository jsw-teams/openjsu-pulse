---
title: "对比研究：每个工具怎样组织内容"
description: 对照官方入口，说明 Pagekiln 当前的主题与站务配置边界。
pattern: docs
---

# 对比研究：每个工具怎样组织内容

这页不制作“谁更强”的总分。它回答一个更实际的问题：同类工具要求我维护什么，页面结构从哪里开始，什么时候需要进入主题或组件代码。速度数据另行通过固定版本、固定夹具和完整命令测量，不在这里用估算填空。

## 一张边界表

| 工具 | 官方内容入口 | 官方扩展入口 | 维护重点 |
| --- | --- | --- | --- |
| Astro | `src/pages/`、Markdown、Content Collections | `.astro` 页面、布局和集成 | 页面组件、内容集合 schema、集成配置 |
| Eleventy | Markdown 和模板文件 | Liquid、Nunjucks、短代码、Data Cascade | 模板语言、数据级联、集合和资源流程 |
| Hugo | `content/`、Front Matter、Markdown | `layouts/`、shortcodes、资源处理 | 内容树、section、模板查找、多语言配置 |
| VitePress | `docs/` Markdown | Vue 主题和 Markdown 内 Vue 组件 | Vue 主题、文档导航和客户端行为 |
| Docusaurus | `docs/` Markdown/MDX、`src/pages/` | React 主题、插件、MDX | docs/sidebar/version/i18n 结构和 React 组件 |
| Pagekiln | `content/pages/`、`content/posts/`、Frontmatter、GFM | `themes/<name>/` 的 Pattern、Block、`theme.ts`、`style.css` 和二级插件 | Markdown 文件、主题目录和站点配置 |

Pagekiln 的区别不是“把所有工具都做一遍”，而是把常见产品内容需求预先放进核心：集合路由、三语言、摘要、封面、归档、Feed（产品笔记订阅清单）、站点地图、本地搜索、404、OG 图和静态部署文件。需要新增页面形状时，先改主题。

## Astro：页面文件和内容集合

Astro 的[官方 Pages 文档](https://docs.astro.build/en/basics/astro-pages/)说明，`src/pages/` 文件负责路由，并支持 `.astro`、Markdown、MDX、HTML 和端点文件；页面通常通过布局复用完整文档结构。[Content Collections](https://docs.astro.build/en/guides/content-collections/)说明了本地 Markdown/MDX 集合、loader、entry data 和 schema；[国际化指南](https://docs.astro.build/en/recipes/i18n/)说明可以用集合和动态路由组织翻译。

这条官方路径适合需要组件和集成的站点。选择 Pagekiln 时，维护重点换成 `content/<collection>/<id>/<locale>.md` 和主题合约；正文不进入 JSX/MDX，普通页面也不带 hydration。

## Eleventy：模板、数据和集合

[Eleventy 官方首页](https://www.11ty.dev/)以 Markdown 文件和模板语言为起点，并展示集合列表。[Data Cascade 文档](https://www.11ty.dev/docs/data-cascade/)说明模板、目录、内容和全局数据如何合并；[Collections 文档](https://www.11ty.dev/docs/collections/)说明如何把内容分组供列表使用。

这条官方路径把自由度交给模板语言和数据级联。选择 Pagekiln 时，不需要为每个项目重新决定页面身份、翻译组、产品笔记归档和搜索索引；需要不同视觉再换主题。

## Hugo：内容树、section 和多语言

Hugo 的[内容格式文档](https://gohugo.io/content-management/formats/)说明 Markdown 是默认内容格式，也支持其他格式和 Front Matter。[Sections 文档](https://gohugo.io/content-management/sections/)说明顶层内容目录和 `_index.md` 如何形成 section、列表页和模板选择。[多语言文档](https://gohugo.io/content-management/multilingual/)说明文件名语言后缀、翻译关系、语言资源和回退行为。

这条官方路径适合内容树、section 和资源能力都很重要的站点。选择 Pagekiln 时，集合和路由写进 `config.yml`，文件名直接形成 locale 和 id；主题只处理呈现。

## VitePress：Markdown 作为 Vue 组件

VitePress 的[入门文档](https://vitepress.dev/guide/getting-started)以 `docs/` Markdown 和 VuePress 风格主题开始，并提供 Markdown、部署、主题和国际化入口。[Using Vue in Markdown](https://vitepress.dev/guide/using-vue.html)明确说明 Markdown 会先编译成 HTML，再作为 Vue Single-File Component 处理；页面可以导入 Vue 组件并加入脚本。

这条官方路径适合以 Vue 为主题扩展边界的文档站点。选择 Pagekiln 时，页面正文保持 CommonMark/GFM；交互只在明确需要的主题脚本中出现，静态页面默认不 hydration。

## Docusaurus：docs、sidebar、版本和 React

Docusaurus 的[安装文档](https://docusaurus.io/docs/installation)展示 `docs/`、`blog/`、`src/pages/` 和静态目录。[Create a doc](https://docusaurus.io/docs/create-doc)说明在 `docs/` 放 Markdown，Front Matter 和目录结构共同影响 id、URL 和 sidebar。[国际化介绍](https://docusaurus.io/docs/i18n/introduction)说明 locale 目录、主题翻译、插件翻译和 hreflang 目标。

这条官方路径适合需要 docs sidebar、版本和 React/MDX 生态的文档门户。选择 Pagekiln 时，产品页面和产品笔记使用两个明确 collection；内容型需求留在核心，主题开发不需要修改编译器。

## Pagekiln 实际维护什么

```text
content/       人类可读的页面、产品笔记和资源
themes/        页面结构、Block、i18n.yml、style.css 和原生 ESM
config.yml     站点信息、集合、路由、语言和能力开关
backend/       需要请求、秘密、写入或 webhook 的动态逻辑
```

每次修改后的最短检查路径是：

```bash
pagekiln check
pagekiln g --profile
npm run catalog
```

`catalog` 是能力目录，不是内容页面；它让人或 Agent 先看到当前主题可以使用的 Pattern、Block、schema、context 和资源依赖。`inspect` 再定位单篇 Markdown 的路由和指令位置。

## 怎样理解性能比较

Hugo、Eleventy 和 Pagekiln 的速度数字必须来自同一台机器、同一份输入、同一版本和同一输出契约。只比较 CLI 的冷启动会遗漏站点地图、搜索、404、Feed 和部署文件；把这些文件补回去又会改变测量范围。仓库保留 `scripts/benchmark.mjs` 和 `scripts/benchmark-compare.mjs` 作为本地工具，不把某次结果写成产品承诺，也不把临时 JSON 发布到 `dist/`。

## 选择建议

- 需要 `.astro`、Vue 或 React 组件生态时，选择对应工具的官方主题路径。
- 需要深度内容树、section、taxonomy 或资源处理时，优先研究 Hugo 官方能力。
- 需要自由模板语言和 Data Cascade 时，研究 Eleventy 的模板路径。
- 需要把产品内容交给 Markdown，并希望集合、语言、搜索、归档和静态交付已有边界时，选择 Pagekiln 的主题优先路径。
