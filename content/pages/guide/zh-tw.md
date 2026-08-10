---
title: 安裝、預覽、建置與部署 Pagekiln
description: 從新建 Pagekiln 網站到檢查、預覽並部署 dist 目錄的實際操作路徑。
pattern: docs
---

# 安裝、預覽、建置與部署 Pagekiln

這是一份目前的使用文件。`pages` 描述網站現在如何運作；`posts` 保存有日期的產品變化。如果編譯器或主題行為發生變化，應更新本頁和其他目前頁面。需要新增 Block 或修改主題時，請閱讀[二次開發](/zh-tw/development/)。

## 1. 安裝

Pagekiln 要求 Node.js `>=22.12.0` 和 npm。在本倉庫中操作：

```bash
git clone https://github.com/jsw-teams/pagekiln.git
cd pagekiln
npm install
```

使用原始碼 CLI 前，先編譯 runtime、主題和 backend：

```bash
npm run compile-runtime
npm run compile-theme
npm run compile-backend
```

要在其他目錄建立中性的網站，可以連結本機 CLI，讓它複製真實的 `starter/` 範本：

```bash
npm link
mkdir my-site
cd my-site
pagekiln init
```

`pagekiln init` 不會在 CLI 裡再產生一套隱藏範本，而是複製 `starter/`，包括 `config.yml`、內容和主題資源。

## 2. 寫入第一批內容

原始碼目錄有兩個 collection：

```text
content/
├─ pages/<id>/<locale>.md       目前網站資訊
├─ posts/<id>/<locale>.md       有日期的產品筆記
└─ assets/                      圖片及其他網站資源
```

目前頁面寫在 `content/pages/`。當首頁、About、Guide、Reference 和目錄頁回答「網站現在如何運作」時，它們都屬於 `pages`。`docs` 是 `pages` 中的 Pattern，不是第三個 collection。

```markdown
---
title: 本機搜尋
description: 目前建置如何建立索引並標記結果位置。
pattern: docs
---

# 本機搜尋

Pagekiln 目前為每種語言建立靜態索引，並按照命中的標題、章節、內文或路徑標記結果位置。
```

只有在記錄一次有日期的決定、實作、發佈、事件、部署或測量時，才在 `content/posts/<id>/<locale>.md` 寫產品筆記。`date` 欄位必填。

```markdown
---
title: 搜尋結果新增命中位置
description: 記錄 2026-08-10 新增可見命中位置標籤的變更。
date: 2026-08-10
pattern: blog
---

# 搜尋結果新增命中位置

這篇筆記記錄當天改了什麼以及為什麼這樣改。目前搜尋用法仍然寫在 Guide 中。
```

目前行為變化時，更新原來的頁面。舊產品筆記保留為歷史；新的有日期變化新增一篇筆記。這樣 `pages` 表示目前狀態，`posts` 表示時間線歷史。

## 3. 檢查原始碼

預覽或部署前先執行：

```bash
pagekiln check
```

檢查會驗證 YAML Frontmatter、必填 schema 欄位、collection 路由、翻譯組、Pattern 和 Block 名稱、指令屬性以及路由衝突。產品筆記缺少 `date` 會檢查失敗；目前頁面不需要日期。

需要確認目前主題實際提供了什麼能力時，使用原始碼發現命令：

```bash
pagekiln catalog
pagekiln inspect collection:pages
pagekiln inspect collection:posts
pagekiln inspect block:notice
```

`catalog` 讀取原始碼能力，不要求先完整建置網站。`inspect` 為內容 id 或明確 namespace 返回結構化事實。

## 4. 本機預覽

啟動增量預覽服務：

```bash
pagekiln s
```

開啟[http://127.0.0.1:4173/](http://127.0.0.1:4173/)。預設埠被占用時：

```bash
pagekiln s --port=4174
```

服務啟動時先建置一次，然後監看 `config.yml`、`content/` 和 `themes/`。受影響的輸出重建後瀏覽器會重新整理，因此 Markdown、Frontmatter、CSS 或主題修改不需要重啟程序即可看到。建置診斷錯誤會列印出來，但預覽程序會繼續執行，方便修正後再次建置。

在倉庫原始碼中，等價的 npm 別名是 `npm run s` 和 `npm run s -- --port=4174`。

## 5. 建置 `dist/`

產生可發佈的靜態輸出：

```bash
pagekiln g
pagekiln g --profile
```

短命令和 `pagekiln build` 執行相同操作。它寫入 `dist/`，包括 HTML、單行壓縮並帶指紋的 CSS、瀏覽器 ESM 資源、Feed、sitemap、搜尋資料、`llms.txt`、自訂 404 頁面和目標平台部署檔案。建置 profile 位於 `dist/.pagekiln/build-profile.json`。

在原始碼倉庫中可以執行 `npm run g -- --profile`。不要手動編輯 `dist/`，應修改原始碼後重新產生。

## 6. 從 `config.yml` 部署

部署寫在網站設定檔中，不把供應商憑證放到命令列。可以選擇一個或多個 target：

```yaml
deployment:
  targets: [cloudflare-pages, vps]
  cloudflare:
    apiTokenEnv: CLOUDFLARE_API_TOKEN
    pages:
      project: example-site
      branch: production
  vps:
    host: vps.example.com
    user: deploy
    port: 22
    remotePath: /var/www/example-site
    identityFile: ~/.ssh/id_ed25519
    publicKeyFile: ~/.ssh/id_ed25519.pub
```

支援的 target 是 `cloudflare-pages`、`cloudflare-workers`、`github-pages`、`vps`，以及可選的 `openai-sites` connector handoff。憑證放在環境變數、本機 SSH agent 或 SSH 金鑰檔案中，不要把 token 或私鑰內容寫進 `config.yml`。

上傳前先查看解析後的操作：

```bash
pagekiln d --dry-run
```

確認後上傳：

```bash
pagekiln d
```

`pagekiln d` 會先建置。Cloudflare Pages 使用 Wrangler 發佈 `dist/`；Cloudflare Workers 使用產生的標準 module Worker；GitHub Pages 把 `dist/` 推送到設定的遠端分支；VPS 使用 SCP 複製到設定的路徑。VPS 必須已有 SSH 存取權限、遠端目錄，並在使用金鑰認證時把公鑰放進伺服器的 `authorized_keys`。

`deployment.backend: false` 時 Cloudflare Pages 是純靜態部署；開啟 backend 後會進入 Advanced Mode 輸出邊界。CDN、Caddy 或 Nginx 都可以直接提供靜態 `dist/`。OpenAI Sites 不是本專案的預設綁定，部分地區可能無法存取；需要廣泛可達性時，應從目標地區測試最終網域。

## 7. 修改主題或新增 Block

將主題複製到 `themes/<name>/`，在 `theme.ts` 實作 Block，在 `theme.yml` 註冊，把樣式放入統一的 `style.css`，然後依序執行 `catalog`、`inspect`、`check`、`build` 和 `serve`。完整範例見[二次開發](/zh-tw/development/)。

不要為了保留舊實作而增加第二份 CSS、瀏覽器腳本或相容 wrapper。重新設計取代舊規則或處理器時，刪除重複項並檢查產生結果。

## 8. 發佈前檢查

```bash
npm test
pagekiln check
pagekiln g --profile
pagekiln inspect collection:posts
pagekiln d --dry-run
```

檢查三種語言連結、自訂 404、`feed.xml`、`sitemap.xml`、`llms.txt`、可選 Cookie 腳本、鍵盤焦點、窄螢幕表格和產生的部署檔案。產品筆記必須按日期倒序出現在 archive/feed；目前頁面不應被強制要求填寫日期。
