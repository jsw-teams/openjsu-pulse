---
title: 让内容成为产品网站
description: 用可读的 Markdown 写页面和产品笔记；主题负责结构，编译器生成多语言静态交付。
pattern: landing
---

:::hero{tone="brand" align="left"}
*Pagekiln 内容编译器*

# 写内容，不再复制页面。

Pagekiln 把页面、产品笔记和主题结构放在同一个项目里。常见网站需求由核心直接处理，视觉和页面结构从主题开始扩展。

[从一页 Markdown 开始](/zh-sg/guide/) [查看主题边界](/zh-sg/development/)
:::

:::compiler-board
### 写入内容
把首页、产品页和使用说明放进 `content/pages/`。把带日期的更新放进 `content/posts/`。文件名已经说明内容身份和语言。

### 组合结构
Pattern 决定页面骨架，Block 提供可复用段落，Frontmatter 只保存页面数据。正文继续使用标题、段落、表格和链接。

### 生成交付物
一次构建生成三种语言路由、静态 HTML、产品笔记归档、订阅清单、站点地图和本地搜索索引。浏览器不需要加载页面框架。
:::

:::feature-grid{columns="3"}
### 通用页面
首页、产品介绍、指南和目录页属于 `pages`。它们不被日期和文章列表绑住，适合长期维护的产品信息。

### 产品笔记
版本变化、设计决定和问题复盘属于 `posts`。日期、摘要、封面、翻译、归档和订阅入口会随集合一起更新。

### 主题开发
新增一段页面结构先修改 `themes/<name>/`。集合、路由、多语言、图片缓存和部署输出保持在核心，内容作者不用重复处理。
:::

## 先看文件边界

| 需求 | 文件入口 | 页面结果 |
| --- | --- | --- |
| 写首页或产品介绍 | `content/pages/<id>/<locale>.md` | 通用页面与本地化路由 |
| 更新产品决定或版本记录 | `content/posts/<id>/<locale>.md` | 产品笔记、归档、订阅和搜索 |
| 调整结构与视觉 | `themes/default/theme.ts`、`theme.yml`、`style.css` | 主题级 Pattern、Block 和样式 |
| 改站点信息或能力开关 | `config.yml` | 站点元数据、语言、路由和功能配置 |
| 让 Agent 找到功能 | `pagekiln catalog`、`pagekiln inspect block:<id>` | 基于源码的能力清单和文件导航 |

## 默认就能处理的事情

Markdown 表格、摘要边界、三语言回退、文章封面、站点地图、RSS 订阅清单、静态搜索、404、OG 图和部署文件都属于现成能力。需要定制时，先看主题目录和能力目录，再决定是否要写代码。

:::post-list{limit="3"}
:::

:::cta{href="/zh-sg/guide/"}
## 先写一页真实内容

把一个产品介绍或一条产品决定写进 Markdown，运行检查，再让主题决定它如何呈现。
:::
