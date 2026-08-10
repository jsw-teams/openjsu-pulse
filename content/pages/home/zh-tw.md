---
title: 把目前內容做成產品網站
description: 用 Markdown 撰寫目前網站頁面和有日期的產品筆記；主題負責結構，編譯器生成多語言靜態交付。
pattern: landing
---

:::hero{tone="brand" align="left"}
*Pagekiln 內容編譯器*

# 撰寫目前頁面，也保留變更歷史。

Pagekiln 把目前網站內容和帶日期的產品歷史放在同一個專案裡。`pages` 回答網站現在如何運作；`posts` 保留某一天發生了哪些變化。

[閱讀內容契約](/zh-tw/guide/) [查看主題邊界](/zh-tw/development/)
:::

:::compiler-board
### 目前頁面
把首頁、產品介紹、Guide、Reference 和目錄放進 `content/pages/`。這些檔案描述網站目前有效的資訊；Pagekiln 行為改變後，直接更新對應頁面。

### 有日期的產品筆記
把已完成的決定、實作、發布、問題處理和部署記錄放進 `content/posts/`。每篇產品筆記都必須有日期，並進入按日期排列的彙整和 Feed；它不是目前的使用手冊。

### 組合結構
Pattern 決定頁面骨架，Block 提供可重用段落，Frontmatter 保存 schema 資料。`docs` 是 pages 中的文件呈現 Pattern，不是第三個 collection。
:::

:::feature-grid{columns="3"}
### 目前頁面
`pages` 保存目前有效的網站內容：首頁、About、Guide 和 Reference 在所描述的實作改變後直接更新。

### 產品筆記
`posts` 保存已經發生的變更記錄。必填日期驅動彙整和 Feed；目前操作說明仍然放在 `pages`。

### Docs Pattern
`docs` 只控制文件呈現。例如 `content/pages/guide/zh-tw.md` 仍是 `pages` 條目，只使用 `pattern: docs`。
:::

## 先選擇內容邊界

| 需求 | 檔案入口 | 結果 |
| --- | --- | --- |
| 說明 Pagekiln 現在如何運作 | `content/pages/<id>/<locale>.md` | 目前狀態頁面與語言路由 |
| 記錄某一天為何發生變更 | `content/posts/<id>/<locale>.md` | 有日期的產品筆記、彙整、Feed 和搜尋條目 |
| 以文件形式呈現目前頁面 | `content/pages/<id>/<locale>.md` 並使用 `pattern: docs` | docs 形式的 `pages` 頁面，不新增 collection |
| 調整結構與視覺 | `themes/default/theme.ts`、`theme.yml`、`style.css` | 主題級 Pattern、Block 和樣式 |
| 修改網站資訊或能力開關 | `config.yml` | 網站元資料、語言、路由和功能設定 |

## 預設就能處理的事情

Markdown 表格、摘要邊界、三語言回退、文章封面、網站地圖、RSS 訂閱清單、靜態搜尋、404、OG 圖和部署檔案都屬於現成能力。需要客製時，先看主題目錄和能力目錄，再決定是否要寫程式。

:::post-list{limit="3"}
:::

:::cta{href="/zh-tw/guide/"}
## 先寫訪客現在需要的頁面

目前使用說明放進 `content/pages/`；要為已完成變更記錄原因和結果時，放進 `content/posts/`，執行檢查，再讓主題決定它如何呈現。
:::
