---
title: 為什麼目前文件與產品筆記分開
description: 記錄 2026-08-08 將目前文件與產品歷史分開的決定。
date: 2026-08-08
cover: /assets/product-note-cover.webp
pattern: blog
tags: [content, collections]
---

# 為什麼目前文件與產品筆記分開

這篇筆記記錄 2026-08-08 將目前文件與產品時間線分開的決定。目前操作以[Guide](/zh-tw/guide/)和[二次開發](/zh-tw/development/)為準；這篇筆記保留決定背景，不是第二套使用手冊。

兩類內容回答不同問題：目前頁面告訴讀者 Pagekiln 現在如何運作，產品筆記保留 Pagekiln 如何變成目前這個版本。

<more>

## 這篇筆記記錄的決定

`pages` 保存網站目前有效的內容：首頁、About、Guide、Reference 和目錄頁都在這裡。實作改變後，直接更新相關頁面。`docs` Pattern 只改變 `pages` 內的文件呈現，不是獨立的 `docs` collection。

`posts` 保存已完成的決定、實作、發布、問題處理、部署和測量結果，而且每篇都有日期。必填日期讓產品筆記進入彙整和 Feed。原筆記保留當時的歷史背景；後續變化新增筆記，不把舊筆記悄悄改寫成目前 Guide。

## 為什麼時間線需要獨立集合

這個分工讓首頁和 Guide 直接回答目前問題，不必在每段說明裡夾帶變更記錄；彙整和 Feed 則回答時間順序問題，不會成為目前操作說明的替代來源。

`<more>` 之前的正文會成為彙整摘要。摘要邊界是可選的，產品筆記日期是必填的。`blog` Pattern 負責筆記的封面、日期、語言切換、目錄和相關筆記呈現。

目前操作方式發生變化時，請查看[目前 Guide](/zh-tw/guide/)和[二次開發](/zh-tw/development/)。這篇歷史記錄保留的是 2026-08-08 的內容決定。
