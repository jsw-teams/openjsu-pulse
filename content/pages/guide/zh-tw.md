---
title: 從一頁 Markdown 開始
description: 用 Markdown、主題合約和站務設定三個入口完成一次可檢查的建置。
pattern: docs
---

# 從一頁 Markdown 開始

Pagekiln 面向需要長期維護產品內容的人。先寫內容，再讓主題提供頁面結構；網站資訊和功能開關集中在 `config.yml`，不用在每個頁面複製導覽、語言和 SEO 程式碼。

:::pipeline
### 寫一份頁面
在 `content/pages/home/zh-tw.md` 寫 Frontmatter 和普通 Markdown。首頁、產品介紹和指南都屬於通用頁面。

### 執行檢查
`pagekiln check` 會檢查欄位、Pattern、Block、路由衝突和 Markdown 原始位置。錯誤會指向具體檔案、行和欄。

### 本地預覽
`pagekiln s` 在 `http://127.0.0.1:4173/` 提供預覽。內容變化只刷新受影響的輸出，瀏覽器頁面保持靜態 HTML。

### 生成網站
`pagekiln g --profile` 生成 `dist/`，同時記錄建置階段、改變的輸出和圖片快取命中情況。
:::

## 內容放在哪裡

```text
content/
├─ pages/<id>/<locale>.md       通用頁面
├─ posts/<id>/<locale>.md       產品筆記
└─ assets/                      OG 圖、封面和其他資源
```

例如 `content/posts/search/zh-tw.md` 會成為 `posts` 集合中的 `search` 產品筆記。檔名中的 `zh-tw` 決定語言路由、日期格式、網站地圖和搜尋索引。

頁面只需要 Frontmatter 和 Markdown：

```markdown
---
title: 搜尋如何指出命中位置
description: 記錄本地搜尋的輸入、排序和命中提示。
pattern: docs
---

# 搜尋如何指出命中位置

搜尋結果會標明命中發生在標題、摘要、章節、正文或路徑，並標示對應文字。
```

產品筆記可以增加日期、封面和摘要邊界：

```markdown
---
title: 一次搜尋體驗調整
date: 2026-08-09
cover: /assets/product-note-cover.webp
pattern: blog
---

先寫這段作為列表摘要。

<more>

再寫完整的實作記錄。
```

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

目前專案啟用 `zh-sg`、`zh-tw`、`en`。同一個 id 下放三份檔案即可形成翻譯組：

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
