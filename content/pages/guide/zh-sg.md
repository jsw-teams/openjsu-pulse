---
title: 编写当前页面和有日期的产品笔记
description: 把当前 Pagekiln 用法放进 pages，把已经完成的产品变更放进有日期的 posts。
pattern: docs
---

# 编写当前页面和有日期的产品笔记

Pagekiln 有两个职责不同的内容集合。`pages` 保存站点当前有效的信息。`posts` 保存已经发生的变更记录，并按日期形成历史时间线。Pagekiln 行为改变时，更新对应页面；如果这次变化值得进入历史，再新增一篇产品笔记。

:::pipeline
### 编写当前页面
在 `content/pages/home/zh-sg.md` 写 Frontmatter 和普通 Markdown。首页、About、Guide、Reference 和目录页在描述站点现在怎样工作时，都属于 `pages`。

### 记录已经完成的变更
在 `content/posts/<id>/<locale>.md` 写产品笔记。`date` 字段必填。每篇笔记记录一个决定、实现、发布、问题处理、部署或测量结果；它不是当前 Guide 的替代品。

### 运行检查
`pagekiln check` 会检查字段、Pattern、Block、路由冲突和 Markdown 源位置。缺少必填字段时，错误会指出源文件、行和列。

### 本地预览
`pagekiln s` 在 `http://127.0.0.1:4173/` 提供预览。内容变化只刷新受影响的输出，浏览器继续接收静态 HTML。

### 生成站点
`pagekiln g --profile` 生成 `dist/`，同时记录构建阶段、改变的输出和图片缓存命中情况。
:::

## 内容放在哪里

```text
content/
├─ pages/<id>/<locale>.md       当前站点内容
├─ posts/<id>/<locale>.md       有日期的产品笔记
└─ assets/                      OG 图、封面和其他资源
```

`docs` 是 Pattern，不是 collection。例如 `content/pages/guide/zh-sg.md` 是 `pages` 条目，只使用 `pattern: docs`。

## 在 pages 和 posts 之间选择

| 内容 | 当前文档页面 | 产品笔记 |
| --- | --- | --- |
| 目的 | 描述 Pagekiln 现在怎样工作 | 记录某一天发生了什么变化 |
| collection | `pages` | `posts` |
| 时间关系 | 当前状态 | 按时间排列的历史 |
| 行为变化后 | 更新原有页面 | 保留旧笔记，为新变化新增笔记 |
| 日期 | 不是页面身份的一部分 | Frontmatter 必填字段 |
| Feed / archive | 不进入产品笔记时间线 | 自动进入归档和 Feed |
| Pattern | `document`、`docs` 或其他页面 Pattern | 默认 `blog` |

要写当前使用说明时，使用 `content/pages/`。要记录今天为什么修改 catalog 时，使用 `content/posts/` 并填写日期。

## 当前文档页面

这个示例回答当前构建做什么，不带历史事件日期：

```markdown
---
title: 本地搜索
description: 当前 Pagekiln 构建怎样建立本地搜索索引并标记命中位置。
pattern: docs
---

# 本地搜索

Pagekiln 当前会为每种语言建立静态搜索索引。浏览器会按照标题、描述、章节、正文和路径命中排序，标记命中位置，并高亮匹配文字。
```

行为改变后，直接更新这页，让它继续解释当前状态。

## 有日期的产品笔记

这个示例记录一次已经完成的变更，不承担当前功能说明：

```markdown
---
title: 搜索结果新增命中位置
description: 记录 2026-08-10 新增可见命中位置标签的变更。
date: 2026-08-10
pattern: blog
---

# 搜索结果新增命中位置

这篇笔记记录一次已经完成的变更：每条命中结果现在会显示标题、摘要、章节、正文或路径标签。

<more>

当前搜索行为以 Guide 为准。这篇笔记保留当时的决定和实现背景，进入有日期的归档。
```

`date` 必填。封面和 `<more>` 摘要边界是可选字段。

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

当前项目启用 `zh-sg`、`zh-tw`、`en`。同一个 id 下的三份文件形成一个翻译组：

```yaml
defaultLocale: en
activeLocales: [zh-sg, zh-tw, en]
```

产品笔记标题区只显示一次语言切换。语言名称显示为“简体中文”“繁體中文”和“English”，而不是内部代码。主题 UI 文案位于 `themes/<name>/i18n.yml`，不放进站务根配置；缺少文案时使用主题的 `fallbackLocale`，并保留正确的 `lang`、canonical 和 `hreflang`。

## 构建会生成什么

- `feed.xml`：产品笔记订阅清单，限制条数并按日期排序。
- `sitemap.xml`：站点地图，列出页面和翻译关系。
- `llms.txt`：给 Agent 先读的站点入口；`llms-full.txt` 是分片的页面摘要与全文入口。
- `pagekiln catalog`：基于源码的当前主题能力目录，列出 Pattern、Block、schema、插件和依赖，不需要完整构建。
- `pagekiln inspect block:<id>` / `pattern:<id>` / `collection:<id>` / `plugin:<id>`：结构化的局部能力查询；直接写 id 仍然查询内容。
- `.pagekiln/catalog.json`：正常构建时生成的发现层副本。
- `site.webmanifest`、OG 图、404 和部署文件：用于浏览器、分享和静态托管。

## Cookie 与无障碍

Cookie 选择器由主题的 `privacyConsent` 插件和站务根 `config.yml` 开关共同控制，必要类别固定开启，可选类别默认关闭；访客作出选择前不会插入可选脚本。人类访客可以从页脚重新打开设置，机器读取 `/.well-known/agent.json`，两种入口分开。站点同时提供跳过链接、可见焦点、语义标题、表格移动端标签；默认不使用动效，并保留减少动画时的滚动处理。

## 下一步

先运行 `pagekiln check`，再运行 `pagekiln s`。需要生成可发布的 `dist/` 时运行 `pagekiln g`；如果要改变页面结构，进入[二次开发](/zh-sg/development/)；如果要理解同类工具各自的官方写作入口，阅读[对比研究](/zh-sg/about/)。
