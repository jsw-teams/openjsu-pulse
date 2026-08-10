---
title: 把当前内容做成产品网站
description: 用 Markdown 编写当前站点页面和有日期的产品笔记；主题负责结构，编译器生成多语言静态交付。
pattern: landing
---

:::hero{tone="brand" align="left"}
*Pagekiln 内容编译器*

# 写当前页面，也保留变更历史。

Pagekiln 把当前站点内容和带日期的产品历史放在同一个项目里。`pages` 回答网站现在怎样工作；`posts` 保留某一天发生了什么变化。

[阅读内容契约](/zh-sg/guide/) [查看主题边界](/zh-sg/development/)
:::

:::compiler-board
### 当前页面
把首页、产品介绍、Guide、Reference 和目录放进 `content/pages/`。这些文件描述站点当前有效的信息；Pagekiln 行为变化后，直接更新对应页面。

### 有日期的产品笔记
把已经完成的决定、实现、发布、问题处理和部署记录放进 `content/posts/`。每篇产品笔记都必须有日期，并进入按日期排列的归档和 Feed；它不是当前使用手册。

### 组合结构
Pattern 决定页面骨架，Block 提供可复用段落，Frontmatter 保存 schema 数据。`docs` 是 pages 中的文档呈现 Pattern，不是第三个 collection。
:::

:::feature-grid{columns="3"}
### 当前页面
`pages` 保存当前有效的站点内容：首页、About、Guide 和 Reference 在所描述的实现变化后直接更新。

### 产品笔记
`posts` 保存已经发生的变更记录。必填日期驱动归档和 Feed；当前操作说明仍然放在 `pages`。

### Docs Pattern
`docs` 只控制文档呈现。例如 `content/pages/guide/zh-sg.md` 仍是 `pages` 条目，只使用 `pattern: docs`。
:::

## 先选择内容边界

| 需求 | 文件入口 | 结果 |
| --- | --- | --- |
| 说明 Pagekiln 现在怎样工作 | `content/pages/<id>/<locale>.md` | 当前状态页面与语言路由 |
| 记录某一天为什么发生了变更 | `content/posts/<id>/<locale>.md` | 有日期的产品笔记、归档、Feed 和搜索条目 |
| 以文档形式呈现当前页面 | `content/pages/<id>/<locale>.md` 并使用 `pattern: docs` | docs 形式的 `pages` 页面，不新增 collection |
| 调整结构与视觉 | `themes/default/theme.ts`、`theme.yml`、`style.css` | 主题级 Pattern、Block 和样式 |
| 改站点信息或能力开关 | `config.yml` | 站点元数据、语言、路由和功能配置 |

## 默认就能处理的事情

Markdown 表格、摘要边界、三语言回退、文章封面、站点地图、RSS 订阅清单、静态搜索、404、OG 图和部署文件都属于现成能力。需要定制时，先看主题目录和能力目录，再决定是否要写代码。

:::post-list{limit="3"}
:::

:::cta{href="/zh-sg/guide/"}
## 先写访客现在需要的页面

当前使用说明放进 `content/pages/`；对已完成变更的原因和结果做有日期的记录时，放进 `content/posts/`，运行检查，再让主题决定它如何呈现。
:::
