---
title: 為什麼產品筆記獨立成一個集合
description: 把持續更新的產品決定放在 posts，讓通用頁面保持穩定。
date: 2026-08-08
cover: /assets/product-note-cover.webp
pattern: blog
tags: [content, collections]
---

# 為什麼產品筆記獨立成一個集合

Pagekiln 的首頁和指南解釋長期不變的使用方式，產品筆記記錄正在發生的決定。兩類內容混在一起時，頁面會同時承擔介紹、更新和彙整，讀者很難判斷一段話是否仍然有效。

<more>

## 我保留的檔案邊界

通用頁面放在 `content/pages/<id>/<locale>.md`。產品筆記放在 `content/posts/<id>/<locale>.md`，透過日期排序，並自動進入彙整、Feed（訂閱清單）和本地搜尋。

## 摘要來自正文

摘要只取 `<more>` 之前的正文。沒有摘要邊界時，編譯器會使用完整正文的可讀片段；列表不再只顯示一個標題。

## 主題負責呈現

筆記頁的封面、日期、語言切換、目錄、上下篇和相關筆記由 `blog` Pattern 提供。我要改變這些結構時進入主題，而不是把 HTML 複製回每篇筆記。
