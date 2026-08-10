---
title: 从一页 Markdown 开始
description: 用 Markdown、主题合约和站务配置三个入口完成一次可检查的构建。
pattern: docs
---

# 从一页 Markdown 开始

Pagekiln 面向需要长期维护产品内容的人。先写内容，再让主题提供页面结构；站点信息和功能开关集中在 `config.yml`，不用在每个页面复制导航、语言和 SEO 代码。

:::pipeline
### 写一份页面
在 `content/pages/home/zh-sg.md` 写 Frontmatter 和普通 Markdown。首页、产品介绍和指南都属于通用页面。

### 运行检查
`pagekiln check` 会检查字段、Pattern、Block、路由冲突和 Markdown 源位置。错误会指向具体文件、行和列。

### 本地预览
`pagekiln s` 在 `http://127.0.0.1:4173/` 提供预览。内容变化只刷新受影响的输出，浏览器页面保持静态 HTML。

### 生成站点
`pagekiln g --profile` 生成 `dist/`，同时记录构建阶段、改变的输出和图片缓存命中情况。
:::

## 内容放在哪里

```text
content/
├─ pages/<id>/<locale>.md       通用页面
├─ posts/<id>/<locale>.md       产品笔记
└─ assets/                      OG 图、封面和其他资源
```

例如 `content/posts/search/zh-sg.md` 会成为 `posts` 集合中的 `search` 产品笔记。文件名中的 `zh-sg` 决定语言路由、日期格式、站点地图和搜索索引。

页面只需要 Frontmatter 和 Markdown：

```markdown
---
title: 搜索如何指出命中位置
description: 记录本地搜索的输入、排序和命中提示。
pattern: docs
---

# 搜索如何指出命中位置

搜索结果会标明命中发生在标题、摘要、章节、正文或路径，并高亮对应文字。
```

产品笔记可以增加日期、封面和摘要边界：

```markdown
---
title: 一次搜索体验调整
date: 2026-08-09
cover: /assets/product-note-cover.webp
pattern: blog
---

先写这段作为列表摘要。

<more>

再写完整的实现记录。
```

## 什么时候使用 Block

正文里的标题、列表、表格、代码和链接继续写 Markdown。只有需要稳定复用的页面段落才使用 Block Directive：

```markdown
:::feature-grid{columns="3"}
### 内容入口
页面文件有明确位置。

### 页面结构
Pattern 和 Block 由主题提供。

### 输出检查
构建后可以检查静态文件。
:::
```

Directive 属性只放短标量。未知 Block、属性拼写错误和缺少上下文会让构建失败，并给出源码位置和修改建议。

## 三种语言怎样协作

当前项目启用 `zh-sg`、`zh-tw`、`en`。同一个 id 下放三份文件即可形成翻译组：

```yaml
defaultLocale: en
activeLocales: [zh-sg, zh-tw, en]
```

产品笔记标题区只显示一次语言切换。语言名称显示为“简体中文”“繁體中文”和“English”，而不是内部代码。主题 UI 文案位于 `themes/<name>/i18n.yml`，不放进站务根配置；缺少文案时使用主题的 `fallbackLocale`，并保留正确的 `lang`、canonical 和 `hreflang`。

## 构建会生成什么

- `feed.xml`：产品笔记订阅清单，限制条数并按日期排序。
- `sitemap.xml`：站点地图，列出页面和翻译关系。
- `llms.txt`：给 Agent 先读的站点入口；`llms-full.txt` 是分片的页面摘要与全文入口。
- `.pagekiln/catalog.json`：能力目录，列出当前主题的 Pattern、Block、schema、插件资源和依赖。
- `site.webmanifest`、OG 图、404 和部署文件：用于浏览器、分享和静态托管。

## Cookie 与无障碍

Cookie 选择器由主题的 `privacyConsent` 插件和站务根 `config.yml` 开关共同控制，必要类别固定开启，可选类别默认关闭；访客作出选择前不会插入可选脚本。人类访客可以从页脚重新打开设置，机器读取 `/.well-known/agent.json`，两种入口分开。站点同时提供跳过链接、可见焦点、语义标题、表格移动端标签；默认不使用动效，并保留减少动画时的滚动处理。

## 下一步

先运行 `pagekiln check`，再运行 `pagekiln s`。需要生成可发布的 `dist/` 时运行 `pagekiln g`；如果要改变页面结构，进入[二次开发](/zh-sg/development/)；如果要理解同类工具各自的官方写作入口，阅读[对比研究](/zh-sg/about/)。
