---
title: 讓內容成為產品網站
description: 用可讀的 Markdown 撰寫頁面和產品筆記；主題負責結構，編譯器生成多語言靜態交付。
pattern: landing
---

:::hero{tone="brand" align="left"}
*Pagekiln 內容編譯器*

# 撰寫內容，不再複製頁面。

Pagekiln 把頁面、產品筆記和主題結構放在同一個專案裡。常見網站需求由核心直接處理，視覺和頁面結構從主題開始擴充。

[從一頁 Markdown 開始](/zh-tw/guide/) [查看主題邊界](/zh-tw/development/)
:::

:::compiler-board
### 寫入內容
把首頁、產品頁和使用說明放進 `content/pages/`。把帶日期的更新放進 `content/posts/`。檔名已經說明內容身份和語言。

### 組合結構
Pattern 決定頁面骨架，Block 提供可重用段落，Frontmatter 只保存頁面資料。正文繼續使用標題、段落、表格和連結。

### 生成交付物
一次建置生成三種語言路由、靜態 HTML、產品筆記彙整、訂閱清單、網站地圖和本地搜尋索引。瀏覽器不需要載入頁面框架。
:::

:::feature-grid{columns="3"}
### 通用頁面
首頁、產品介紹、指南和目錄頁屬於 `pages`。它們不被日期和文章列表綁住，適合長期維護的產品資訊。

### 產品筆記
版本變化、設計決定和問題復盤屬於 `posts`。日期、摘要、封面、翻譯、彙整和訂閱入口會隨集合一起更新。

### 主題開發
新增一段頁面結構先修改 `themes/<name>/`。集合、路由、多語言、圖片快取和部署輸出留在核心，內容作者不用重複處理。
:::

## 先看檔案邊界

| 需求 | 檔案入口 | 頁面結果 |
| --- | --- | --- |
| 撰寫首頁或產品介紹 | `content/pages/<id>/<locale>.md` | 通用頁面與本地化路由 |
| 更新產品決定或版本記錄 | `content/posts/<id>/<locale>.md` | 產品筆記、彙整、訂閱和搜尋 |
| 調整結構與視覺 | `themes/default/theme.ts`、`theme.yml`、`style.css` | 主題級 Pattern、Block 和樣式 |
| 修改網站資訊或能力開關 | `config.yml` | 網站元資料、語言、路由和功能設定 |
| 讓 Agent 找到功能 | `.pagekiln/catalog.json`、`AGENTS.md` | 結構化能力清單和檔案導覽 |

## 預設就能處理的事情

Markdown 表格、摘要邊界、三語言回退、文章封面、網站地圖、RSS 訂閱清單、靜態搜尋、404、OG 圖和部署檔案都屬於現成能力。需要客製時，先看主題目錄和能力目錄，再決定是否要寫程式。

:::post-list{limit="3"}
:::

:::cta{href="/zh-tw/guide/"}
## 先寫一頁真實內容

把一個產品介紹或一條產品決定寫進 Markdown，執行檢查，再讓主題決定它如何呈現。
:::
