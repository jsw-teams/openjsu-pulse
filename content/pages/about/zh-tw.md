---
title: "對比研究：每個工具怎樣組織內容"
description: 對照官方入口，說明 Pagekiln 目前的主題與站務設定邊界。
pattern: docs
---

# 對比研究：每個工具怎樣組織內容

這頁不製作「誰更強」的總分。它回答一個更實際的問題：同類工具要求我維護什麼，頁面結構從哪裡開始，什麼時候需要進入主題或元件程式碼。速度資料另行透過固定版本、固定夾具和完整命令測量，不在這裡用估算填空。

## 一張邊界表

| 工具 | 官方內容入口 | 官方擴充入口 | 維護重點 |
| --- | --- | --- | --- |
| Astro | `src/pages/`、Markdown、Content Collections | `.astro` 頁面、布局和整合 | 頁面元件、內容集合 schema、整合設定 |
| Eleventy | Markdown 和模板檔案 | Liquid、Nunjucks、shortcode、Data Cascade | 模板語言、資料級聯、集合和資源流程 |
| Hugo | `content/`、Front Matter、Markdown | `layouts/`、shortcodes、資源處理 | 內容樹、section、模板查找、多語言設定 |
| VitePress | `docs/` Markdown | Vue 主題和 Markdown 內 Vue 元件 | Vue 主題、文件導覽和客戶端行為 |
| Docusaurus | `docs/` Markdown/MDX、`src/pages/` | React 主題、插件、MDX | docs/sidebar/version/i18n 結構和 React 元件 |
| Pagekiln | `content/pages/`、`content/posts/`、Frontmatter、GFM | `themes/<name>/` 的 Pattern、Block、`theme.ts`、`style.css` 和二級插件 | Markdown 檔案、主題目錄和網站設定 |

Pagekiln 的差異不是「把所有工具都做一遍」，而是把常見產品內容需求預先放進核心：集合路由、三語言、摘要、封面、彙整、Feed（產品筆記訂閱清單）、網站地圖、本地搜尋、404、OG 圖和靜態部署檔案。需要新增頁面形狀時，先改主題。

## Astro：頁面檔案和內容集合

Astro 的[官方 Pages 文件](https://docs.astro.build/en/basics/astro-pages/)說明，`src/pages/` 檔案負責路由，並支援 `.astro`、Markdown、MDX、HTML 和 endpoint 檔案；頁面通常透過布局重用完整文件結構。[Content Collections](https://docs.astro.build/en/guides/content-collections/)說明本地 Markdown/MDX 集合、loader、entry data 和 schema；[國際化指南](https://docs.astro.build/en/recipes/i18n/)說明可用集合和動態路由組織翻譯。

這條官方路徑適合需要元件和整合的網站。選擇 Pagekiln 時，維護重點換成 `content/<collection>/<id>/<locale>.md` 和主題合約；正文不進入 JSX/MDX，普通頁面也不帶 hydration。

## Eleventy：模板、資料和集合

[Eleventy 官方首頁](https://www.11ty.dev/)以 Markdown 檔案和模板語言為起點，並展示集合列表。[Data Cascade 文件](https://www.11ty.dev/docs/data-cascade/)說明模板、目錄、內容和全域資料如何合併；[Collections 文件](https://www.11ty.dev/docs/collections/)說明如何把內容分組供列表使用。

這條官方路徑把自由度交給模板語言和資料級聯。選擇 Pagekiln 時，不需要為每個專案重新決定頁面身份、翻譯組、產品筆記彙整和搜尋索引；需要不同視覺再換主題。

## Hugo：內容樹、section 和多語言

Hugo 的[內容格式文件](https://gohugo.io/content-management/formats/)說明 Markdown 是預設內容格式，也支援其他格式和 Front Matter。[Sections 文件](https://gohugo.io/content-management/sections/)說明頂層內容目錄和 `_index.md` 如何形成 section、列表頁和模板選擇。[多語言文件](https://gohugo.io/content-management/multilingual/)說明檔名語言後綴、翻譯關係、語言資源和回退行為。

這條官方路徑適合內容樹、section 和資源能力都很重要的網站。選擇 Pagekiln 時，集合和路由寫進 `config.yml`，檔名直接形成 locale 和 id；主題只處理呈現。

## VitePress：Markdown 作為 Vue 元件

VitePress 的[入門文件](https://vitepress.dev/guide/getting-started)以 `docs/` Markdown 和 VuePress 風格主題開始，並提供 Markdown、部署、主題和國際化入口。[Using Vue in Markdown](https://vitepress.dev/guide/using-vue.html)明確說明 Markdown 會先編譯成 HTML，再作為 Vue Single-File Component 處理；頁面可以匯入 Vue 元件並加入腳本。

這條官方路徑適合以 Vue 為主題擴充邊界的文件站點。選擇 Pagekiln 時，頁面正文保持 CommonMark/GFM；互動只在明確需要的主題腳本中出現，靜態頁面預設不 hydration。

## Docusaurus：docs、sidebar、版本和 React

Docusaurus 的[安裝文件](https://docusaurus.io/docs/installation)展示 `docs/`、`blog/`、`src/pages/` 和靜態目錄。[Create a doc](https://docusaurus.io/docs/create-doc)說明在 `docs/` 放 Markdown，Front Matter 和目錄結構共同影響 id、URL 和 sidebar。[國際化介紹](https://docusaurus.io/docs/i18n/introduction)說明 locale 目錄、主題翻譯、插件翻譯和 hreflang 目標。

這條官方路徑適合需要 docs sidebar、版本和 React/MDX 生態的文件入口。選擇 Pagekiln 時，產品頁面和產品筆記使用兩個明確 collection；內容型需求留在核心，主題開發不需要修改編譯器。

## Pagekiln 實際維護什麼

```text
content/       人類可讀的頁面、產品筆記和資源
themes/        頁面結構、Block、i18n.yml、style.css 和原生 ESM
config.yml     網站資訊、集合、路由、語言和能力開關
backend/       需要請求、秘密、寫入或 webhook 的動態邏輯
```

每次修改後的最短檢查路徑是：

```bash
pagekiln check
pagekiln g --profile
npm run catalog
```

`catalog` 是基於原始碼的能力目錄，不是內容頁面；它讀取目前設定、內容和主題，不渲染整站，也不依賴既有 `dist/`。`inspect` 保留按內容 id 查詢，並以結構化 JSON 提供 `block:<id>`、`pattern:<id>`、`collection:<id>` 和 `plugin:<id>` 等局部命名空間。

## 怎樣理解性能比較

Hugo、Eleventy 和 Pagekiln 的速度數字必須來自同一台機器、同一份輸入、同一版本和同一輸出契約。只比較 CLI 的冷啟動會遺漏網站地圖、搜尋、404、Feed 和部署檔案；把這些檔案補回去又會改變測量範圍。儲存庫保留 `scripts/benchmark.mjs` 和 `scripts/benchmark-compare.mjs` 作為本地工具，不把某次結果寫成產品承諾，也不把暫時 JSON 發布到 `dist/`。

## 選擇建議

- 需要 `.astro`、Vue 或 React 元件生態時，選擇對應工具的官方主題路徑。
- 需要深度內容樹、section、taxonomy 或資源處理時，優先研究 Hugo 官方能力。
- 需要自由模板語言和 Data Cascade 時，研究 Eleventy 的模板路徑。
- 需要把產品內容交給 Markdown，並希望集合、語言、搜尋、彙整和靜態交付已有邊界時，選擇 Pagekiln 的主題優先路徑。
