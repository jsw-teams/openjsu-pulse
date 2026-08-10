---
title: 實用比較：安裝、預覽、部署與擴充
description: 比較 Pagekiln、Astro、Eleventy、Hugo、VitePress 和 Docusaurus 的官方操作路徑。
pattern: docs
---

# 實用比較：安裝、預覽、部署與擴充

本頁比較開發者需要實際操作的命令和檔案，不把一次 benchmark 執行變成普遍排名。表中的命令來自各專案官方文件；Pagekiln 命令以本倉庫目前 CLI 為準。

## 最短可執行路徑

| 工具 | 安裝 / 啟動 | 本機預覽 | 生產建置 | 擴充入口 |
| --- | --- | --- | --- | --- |
| Pagekiln | `npm install`；`npm link`；`pagekiln init` | `pagekiln s` | `pagekiln g` → `dist/` | `themes/<name>/theme.ts`、`theme.yml`、`style.css`、外掛開關 |
| Astro | `npm create astro@latest` | `npm run dev` | `npm run build` → `dist/` | `.astro` 頁面、元件、integrations |
| Eleventy | `npm install @11ty/eleventy`；`npx @11ty/eleventy --serve` | `npx @11ty/eleventy --serve` | `npx @11ty/eleventy` → `_site/` | 範本、shortcodes、Data Cascade |
| Hugo | 安裝 Hugo；`hugo new site` | `hugo server` | `hugo` → `public/` | `layouts/`、shortcodes、modules、resources |
| VitePress | `npx vitepress init` | `npm run docs:dev` | `npm run docs:build` → `.vitepress/dist/` | Vue 主題、Markdown 中的 Vue 元件 |
| Docusaurus | `npm init docusaurus@latest my-website classic` | `npm run start` | `npm run build` → `build/` | React 主題、plugins、MDX |

輸出目錄是部署事實，不是外觀細節：託管平台必須發佈建置命令產生的目錄。Pagekiln 目前統一靜態目錄是 `dist/`，部署命令從 `config.yml` 讀取目的地。

## Pagekiln 任務配方

### 安裝新網站

```bash
npm install
npm link
pagekiln init
pagekiln check
```

Starter 是真實原始碼目錄。它的 `config.yml`、`content/` 和 `themes/` 展示 CLI 複製的契約。

### 預覽並編輯

```bash
pagekiln s
pagekiln s --port=4174
```

預覽服務監看 `config.yml`、`content/` 和 `themes/`。Markdown、CSS 或主題編輯會觸發重建和瀏覽器重新整理，診斷錯誤後程序仍保持執行。

### 部署

```yaml
deployment:
  targets: [cloudflare-pages, github-pages, vps]
  cloudflare:
    apiTokenEnv: CLOUDFLARE_API_TOKEN
    pages:
      project: example-site
      branch: production
  github:
    remote: origin
    branch: gh-pages
    tokenEnv: GITHUB_TOKEN
  vps:
    host: vps.example.com
    user: deploy
    port: 22
    remotePath: /var/www/example-site
    identityFile: ~/.ssh/id_ed25519
```

```bash
pagekiln d --dry-run
pagekiln d
```

支援的 connector 是 `cloudflare-pages`、`cloudflare-workers`、`github-pages`、`vps` 和可選的 `openai-sites` handoff。Token 放在環境變數中。VPS 使用本機 SSH agent 或既有私鑰認證，伺服器必須已授權對應公鑰。純靜態託管不需要動態 backend。

### 開發 Block

```text
content/pages/guide/zh-tw.md   目前說明
themes/default/theme.ts        Block 渲染器和 schema
themes/default/theme.yml       Block/資源註冊
themes/default/style.css       單一視覺來源
```

透過 `defineTheme` 實作 Block，在 `theme.yml` 註冊，用 Markdown 指令呼叫，再執行：

```bash
npm run compile-theme
pagekiln catalog
pagekiln inspect block:notice
pagekiln check
pagekiln g
```

完整範例和安全邊界見[二次開發](/zh-tw/development/)。

## 各工具需要維護什麼

### Pagekiln

內容身份明確：`content/pages/<id>/<locale>.md` 是目前網站內容，`content/posts/<id>/<locale>.md` 是帶必填 `date` 的產品筆記。`docs` 是 `pages` 內的 Pattern，不是並列 collection。`config.yml` 負責網站設定和部署目的地；複製的主題負責 Pattern、Block、CSS、瀏覽器 ESM 和外掛呈現。

### Astro

Astro[官方安裝文件](https://docs.astro.build/en/install-and-setup/)從 `npm create astro@latest` 開始；[開發與建置文件](https://docs.astro.build/en/develop-and-build/)使用 `npm run dev` 和 `npm run build`。`.astro` 頁面、元件、integrations 和 content collections 構成擴充面。需要元件和 integrations 作為主要開發方式時，使用這條路徑。

### Eleventy

Eleventy[官網](https://www.11ty.dev/)展示 Markdown、範本、`npx @11ty/eleventy --serve` 和 `_site/`；[Data Cascade](https://www.11ty.dev/docs/data-cascade/)與[Collections](https://www.11ty.dev/docs/collections/)是主要組織面。需要多種範本語言和資料組合時，使用這條路徑。

### Hugo

Hugo[快速開始](https://gohugo.io/getting-started/quick-start/)使用 `hugo new site`、`hugo server` 和 `hugo`，輸出為 `public/`；[內容組織](https://gohugo.io/content-management/organization/)和[shortcodes](https://gohugo.io/content-management/shortcodes/)把結構放進內容樹和版面。需要 sections、taxonomies、範本和原生二進位檔時，使用這條路徑。

### VitePress

VitePress[入門文件](https://vitepress.dev/guide/getting-started)使用 `npx vitepress init`、`npm run docs:dev` 和 `npm run docs:build`；[在 Markdown 中使用 Vue](https://vitepress.dev/guide/using-vue.html)讓 Vue 元件和用戶端行為成為文件創作的一部分。文件站本身就是 Vue 應用程式時，使用這條路徑。

### Docusaurus

Docusaurus[安裝文件](https://docusaurus.io/docs/installation)使用 React starter、`npm run start` 和 `npm run build`；[i18n 文件](https://docusaurus.io/docs/i18n/introduction)處理 locale 目錄以及主題和外掛翻譯。需要 docs sidebar、版本、MDX 和 React plugins 時，使用這條路徑。

## 按下一個具體任務選擇

- 需要 Markdown 優先的產品站，並且要明確區分目前頁面、有日期產品筆記、語言、搜尋、歸檔、sitemap 和靜態部署：使用 Pagekiln，從 Guide 開始。
- 需要 `.astro` 元件或 integrations 生態：使用 Astro starter。
- 需要範本語言選擇和 Data Cascade：使用 Eleventy starter。
- 需要 sections、taxonomies、shortcodes 和原生二進位檔：使用 Hugo 快速開始。
- 需要在文件中使用 Vue 元件：使用 VitePress。
- 需要帶 sidebar、版本和外掛翻譯的 React/MDX 文件：使用 Docusaurus。

選擇應跟隨下一個需要編寫的檔案。對 Pagekiln 來說，目前用法寫入 `content/pages/`，有日期的變化寫入 `content/posts/`，新 Block 寫入 `themes/<name>/theme.ts`。
