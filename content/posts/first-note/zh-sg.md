---
title: 为什么产品笔记单独成一个集合
description: 把持续更新的产品决定放在 posts，让通用页面保持稳定。
date: 2026-08-08
cover: /assets/product-note-cover.webp
pattern: blog
tags: [content, collections]
---

# 为什么产品笔记单独成一个集合

Pagekiln 的首页和指南解释长期不变的使用方式，产品笔记记录正在发生的决定。两类内容混在一起时，页面会同时承担介绍、更新和归档，读者很难判断一段话是不是仍然有效。

<more>

## 我保留的文件边界

通用页面放在 `content/pages/<id>/<locale>.md`。产品笔记放在 `content/posts/<id>/<locale>.md`，通过日期排序，并自动进入归档、Feed（订阅清单）和本地搜索。

## 摘要来自正文

摘要只取 `<more>` 之前的正文。没有摘要边界时，编译器会使用完整正文的可读片段；列表不再只显示一个标题。

## 主题负责呈现

笔记页的封面、日期、语言切换、目录、上下篇和相关文章由 `blog` Pattern 提供。我要改变这些结构时进入主题，而不是把 HTML 复制回每篇笔记。
