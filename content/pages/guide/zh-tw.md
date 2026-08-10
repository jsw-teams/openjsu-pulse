---
title: 撰寫目前頁面和有日期的產品筆記
description: 把目前 Pagekiln 用法放進 pages，把已完成的產品變更放進有日期的 posts。
pattern: docs
---

# 撰寫目前頁面和有日期的產品筆記

Pagekiln 有兩個職責不同的內容集合。`pages` 保存網站目前有效的資訊。`posts` 保存已經發生的變更記錄，並按日期形成歷史時間線。Pagekiln 行為改變時，更新對應頁面；如果這次變化值得進入歷史，再新增一篇產品筆記。

:::pipeline
### 撰寫目前頁面
在 `content/pages/home/zh-tw.md` 撰寫 Frontmatter 和普通 Markdown。首頁、About、Guide、Reference 和目錄頁在描述網站現在如何運作時，都屬於 `pages`。

### 記錄已完成的變更
在 `content/posts/<id>/<locale>.md` 撰寫產品筆記。`date` 欄位必填。每篇筆記記錄一個決定、實作、發布、問題處理、部署或測量結果；它不是目前 Guide 的替代品。

### 執行檢查
`pagekiln check` 會檢查欄位、Pattern、Block、路由衝突和 Markdown 原始位置。缺少必填欄位時，錯誤會指出原始檔案、行和欄。

### 本地預覽
`pagekiln s` 在 `http://127.0.0.1:4173/` 提供預覽。內容變化只刷新受影響的輸出，瀏覽器繼續接收靜態 HTML。

### 生成網站
`pagekiln g --profile` 生成 `dist/`，同時記錄建置階段、改變的輸出和圖片快取命中情況。
:::

## 內容放在哪裡

```text
content/
├─ pages/<id>/<locale>.md       目前網站內容
├─ posts/<id>/<locale>.md       有日期的產品筆記
└─ assets/                      OG 圖、封面和其他資源
```

`docs` 是 Pattern，不是 collection。例如 `content/pages/guide/zh-tw.md` 是 `pages` 條目，只使用 `pattern: docs`。

## 在 pages 和 posts 之間選擇

| 內容 | 目前文件頁面 | 產品筆記 |
| --- | --- | --- |
| 目的 | 描述 Pagekiln 現在如何運作 | 記錄某一天發生了什麼變化 |
| collection | `pages` | `posts` |
| 時間關係 | 目前狀態 | 按時間排列的歷史 |
| 行為改變後 | 更新原有頁面 | 保留舊筆記，為新變化新增筆記 |
| 日期 | 不是頁面身份的一部分 | Frontmatter 必填欄位 |
| Feed / archive | 不進入產品筆記時間線 | 自動進入彙整和 Feed |
| Pattern | `document`、`docs` 或其他頁面 Pattern | 預設 `blog` |

要撰寫目前使用說明時，使用 `content/pages/`。要記錄今天為何修改 catalog 時，使用 `content/posts/` 並填寫日期。

## 目前文件頁面

這個示例回答目前建置做什麼，不帶歷史事件日期：

```markdown
---
title: 本地搜尋
description: 目前 Pagekiln 建置如何建立本地搜尋索引並標記命中位置。
pattern: docs
---

# 本地搜尋

Pagekiln 目前會為每種語言建立靜態搜尋索引。瀏覽器會依照標題、描述、章節、正文和路徑命中排序，標記命中位置，並標示匹配文字。
```

行為改變後，直接更新這頁，讓它繼續解釋目前狀態。

## 有日期的產品筆記

這個示例記錄一次已完成的變更，不承擔目前功能說明：

```markdown
---
title: 搜尋結果新增命中位置
description: 記錄 2026-08-10 新增可見命中位置標籤的變更。
date: 2026-08-10
pattern: blog
---

# 搜尋結果新增命中位置

這篇筆記記錄一次已完成的變更：每筆命中結果現在會顯示標題、摘要、章節、正文或路徑標籤。

<more>

目前搜尋行為以 Guide 為準。這篇筆記保留當時的決定和實作背景，進入有日期的彙整。
```

`date` 必填。封面和 `<more>` 摘要邊界是可選欄位。

## 什麼時候使用 Block

正文裡的標題、列表、表格、程式碼和連結繼續寫 Markdown。只有需要穩定重用的頁面段落才使用 Block Directive：

```markdown
:::feature-grid{columns="3"}
### 內容入口
頁面檔案有明確位置。

### 頁面結構
Pattern 和 Block 由主題提供。

### 輸出檢查
建置後可以檢查靜態檔案。
:::
```

Directive 屬性只放短標量。未知 Block、屬性拼寫錯誤和缺少上下文會讓建置失敗，並給出原始位置和修改建議。

## 三種語言怎樣協作

目前專案啟用 `zh-sg`、`zh-tw`、`en`。同一個 id 下的三份檔案形成一個翻譯組：

```yaml
defaultLocale: en
activeLocales: [zh-sg, zh-tw, en]
```

產品筆記標題區只顯示一次語言切換。語言名稱顯示為「簡體中文」「繁體中文」和「English」，而不是內部代碼。主題 UI 文案位於 `themes/<name>/i18n.yml`，不放進站務根設定；缺少文案時使用主題的 `fallbackLocale`，並保留正確的 `lang`、canonical 和 `hreflang`。

## 建置會生成什麼

- `feed.xml`：產品筆記訂閱清單，限制數量並按日期排序。
- `sitemap.xml`：網站地圖，列出頁面和翻譯關係。
- `llms.txt`：給 Agent 先讀的網站入口；`llms-full.txt` 是分片的頁面摘要與全文入口。
- `pagekiln catalog`：基於原始碼的目前主題能力目錄，列出 Pattern、Block、schema、插件和依賴，不需要完整建置。
- `pagekiln inspect block:<id>` / `pattern:<id>` / `collection:<id>` / `plugin:<id>`：結構化的局部能力查詢；直接寫 id 仍然查詢內容。
- `.pagekiln/catalog.json`：正常建置時產生的發現層副本。
- `site.webmanifest`、OG 圖、404 和部署檔案：用於瀏覽器、分享和靜態託管。

## Cookie 與無障礙

Cookie 選擇器由主題的 `privacyConsent` 插件和站務根 `config.yml` 開關共同控制，必要類別固定啟用，可選類別預設關閉；訪客作出選擇前不會插入可選腳本。人類訪客可以從頁尾重新開啟設定，機器讀取 `/.well-known/agent.json`，兩種入口分開。網站同時提供跳過連結、可見焦點、語意標題、表格行動版標籤；預設不使用動效，並保留減少動畫時的捲動處理。

## 下一步

先執行 `pagekiln check`，再執行 `pagekiln s`。需要生成可發布的 `dist/` 時執行 `pagekiln g`；如果要改變頁面結構，進入[二次開發](/zh-tw/development/)；如果要理解同類工具各自的官方寫作入口，閱讀[對比研究](/zh-tw/about/)。
