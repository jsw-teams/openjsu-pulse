---
title: 为什么当前文档与产品笔记分开
description: 记录 2026-08-08 将当前文档与产品历史分开的决定。
date: 2026-08-08
cover: /assets/product-note-cover.webp
pattern: blog
tags: [content, collections]
---

# 为什么当前文档与产品笔记分开

这篇笔记记录 2026-08-08 将当前文档与产品时间线分开的决定。当前操作以[Guide](/zh-sg/guide/)和[二次开发](/zh-sg/development/)为准；这篇笔记保留决定背景，不是第二套使用手册。

两类内容回答不同问题：当前页面告诉读者 Pagekiln 现在怎样工作，产品笔记保留 Pagekiln 怎样变成现在这个版本。

<more>

## 这篇笔记记录的决定

`pages` 保存站点当前有效的内容：首页、About、Guide、Reference 和目录页都在这里。实现变化后，直接更新相关页面。`docs` Pattern 只改变 `pages` 内的文档呈现，不是独立的 `docs` collection。

`posts` 保存已经完成的决定、实现、发布、问题处理、部署和测量结果，并且每篇都有日期。必填日期让产品笔记进入归档和 Feed。原笔记保留当时的历史背景；后续变化新增笔记，不把旧笔记悄悄改写成当前 Guide。

## 为什么时间线需要独立集合

这个分工让首页和 Guide 直接回答当前问题，不必在每段说明里夹带变更日志；归档和 Feed 则回答时间顺序问题，不会变成当前操作说明的替代来源。

`<more>` 之前的正文会成为归档摘要。摘要边界是可选的，产品笔记日期是必填的。`blog` Pattern 负责笔记的封面、日期、语言切换、目录和相关文章呈现。

当前操作方式发生变化时，请查看[当前 Guide](/zh-sg/guide/)和[二次开发](/zh-sg/development/)。这篇历史记录保留的是 2026-08-08 的内容决定。
