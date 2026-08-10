---
title: 二次開發從主題開始
description: 先改主題裡的 Pattern、Block 和統一樣式，再用插件開關控制可選瀏覽器行為，把執行時需求放進 backend。
pattern: docs
---

# 二次開發從主題開始

我把 Pagekiln 的擴充邊界放在主題。內容、集合、路由、語言、搜尋、圖片快取和部署輸出由核心負責；新頁面結構和視覺語言先進入 `themes/<name>/`。

## 內容邊界保持明確

`content/pages/` 是首頁、About、Guide、Reference 和目錄頁的目前狀態來源；所描述的行為改變後，直接更新對應頁面。`content/posts/` 是已完成的決定、實作、發布、問題處理、部署和測量的有日期歷史；每篇產品筆記都必須有 `date`，並進入彙整和 Feed。`docs` 是 `pages` 條目使用的 Pattern，不是 collection。目前操作說明放在 pages，已完成變更的記錄放在 posts。

## 目錄就是功能地圖

```text
themes/default/
├─ theme.yml                 Pattern、Block、資源和插件宣告
├─ theme.ts                  頁面殼、Pattern、Block renderer
├─ style.css                 全域布局、響應式和無障礙樣式
├─ i18n.yml                  主題 UI 本地化文案
└─ scripts/                  需要同意後或頁面需要的原生 ESM
```

`src/` 是編譯器和 Fetch router。`backend/` 只放請求、秘密、寫入和 webhook。`config.yml` 只管理網站資訊、內容集合、路由、能力開關和部署選項，不接受 CSS、HTML 或腳本注入。

## 主題合約

主題模組匯出 `defineTheme`：

```ts
import { defineTheme } from '../../src/theme-api.ts';

export default defineTheme({
  name: 'default',
  patterns: {
    document: { name: 'document', contexts: ['page'], render: content => content }
  },
  blocks: {
    notice: {
      name: 'notice',
      schema: { tone: 'string' },
      render: (node, context) => `<aside class="notice">${context.renderNodes(node.children)}</aside>`
    }
  }
});
```

Block 的屬性先在 schema 中宣告。渲染器使用 `context.escapeHtml`、`context.safeUrl` 和 `context.renderNodes`，不要把未審查的輸入拼成原始 HTML。真正可信的原始片段才進入 `unsafeHtml`，而且只在編譯器邊界審查。

## 從主題目錄新增頁面結構

1. 在 `theme.ts` 增加 Pattern 或 Block，並寫出適用的 context。
2. 在 `theme.yml` 註冊名稱、短屬性、schema 範例和實際資源依賴。
3. 在 `style.css` 或主題資源中完成桌面、窄屏和焦點狀態；預設視覺系統不加入無意義動效。
4. 執行 `npm run catalog`，再用 `pagekiln inspect block:<id>` 或 `pattern:<id>` 檢查局部能力。
5. 用一份真實 Markdown 執行 `pagekiln check` 與 `pagekiln g --profile`。

普通需求優先重用既有 Block。頁面目錄、產品筆記、語言切換、摘要、封面、Feed（產品筆記訂閱清單）、網站地圖和本地搜尋都已經屬於核心能力，不需要為每個網站複製一套頁面程式碼。

## 搜尋怎樣指出命中點

編譯器為每個語言生成靜態索引。預設主題在瀏覽器端按標題、摘要、章節、正文和路徑加權；結果顯示命中層級，截取命中附近的文字，並用 `<mark>` 標示實際匹配部分。單個英文字母會提示繼續輸入，避免輸入 `n` 時返回一堆雜訊；中文字仍可搜尋。

搜尋腳本使用原生 Fetch 和 DOM API，不載入框架。索引超過分片門檻時，入口 JSON 只列出分片地址。

## 行動版和動畫邊界

預設主題使用單欄閱讀流、右側可展開目錄、帶 `data-label` 的響應式表格和不依賴橫向捲軸的窄屏布局。樣式表刻意不使用 transition 或 keyframe 動畫，互動透過顏色、邊框、焦點和展開狀態表達；`prefers-reduced-motion: reduce` 保留明確的捲動處理。新增元件要先檢查 320px 寬度、長中文標題、長路徑和鍵盤操作。

## Cookie、資源與快取

Cookie 類別、保存期限、文案和 provider 整合由 `config.yml` 的 `privacy.cookieConsent` 管理；`privacyConsent` 主題插件宣告腳本並帶有 `enabled` 開關。可選腳本在選擇前只以 `<template>` 出現，保存同意後才插入腳本節點。人類訪客從頁尾開啟設定；機器讀取 `/.well-known/agent.json`。

CSS 輸出會壓縮成單行，CSS 和瀏覽器 ESM 檔名帶主題指紋，例如 `style.<fingerprint>.css`，資源連結不使用查詢字串。圖片快取鍵包含來源、參數和 Sharp 版本；未變化圖片不會再次處理。

## 建置圖和可重現測量

一次 BuildContext 負責發現、載入、解析、校驗、路由、渲染和寫入。普通改稿透過 mtime 與 size 快速判斷，變化後才計算 hash；受影響的頁面和輸出才會重新寫入。`.pagekiln/manifest.json`、依賴圖和輸出 hash 可恢復，不需要資料庫。

需要測量時使用暫時夾具：

```bash
npm run compile-runtime
npm run compile-theme
npm run compile-backend
npm run bench -- 100
```

夾具只用於本地測量，不讀取示例網站內容，也不寫入生產 `dist/`。完整 JSON 保留每個場景、階段和機器資訊。`maxRssMiB` 是 Node 建置進程的峰值常駐記憶體，1 MiB 等於 1,024² 位元組，它不是 `dist/` 大小，也不是單頁占用。

## 部署邊界

- CDN、Caddy 和 Nginx 直接提供 `dist/`。
- Cloudflare Workers 使用靜態資源 binding 和標準 module worker，靜態請求先交給資源層。
- Cloudflare Pages 在關閉 backend 時只部署靜態檔案，啟用 backend 時生成 Advanced Mode `_worker.js`。
- VPS 的動態入口使用 `Deno.serve`，靜態檔案仍由 Caddy 或 Nginx 提供。

三種動態目標都匯入同一個 Fetch handler。秘密只從執行時 binding 或環境變數讀取。

`pagekiln d` 會先建置再發布。直接使用本原始碼儲存庫時執行 `npm run d`；執行 `npm link` 或安裝 CLI 後才使用裸命令。`config.yml` 可以填寫一個或多個目標及各自的發布位置，命令只接受用於檢查的 `--dry-run`，多個目標依列表順序執行。Cloudflare 目標呼叫 Wrangler，GitHub 使用 `git subtree`，`vps` 使用 OpenSSH SCP，`openai-sites` 需要已存在的 `.openai/hosting.json` 才能交給 Sites 連接器。

```yaml
deployment:
  targets: [vps]
  cloudflare:
    accountId: CF_ACCOUNT_ID
    apiTokenEnv: CLOUDFLARE_API_TOKEN
    pages:
      project: site-name
      branch: production
    workers:
      name: site-worker
      compatibilityDate: '2026-08-10'
  github:
    remote: origin
    branch: gh-pages
    tokenEnv: GITHUB_TOKEN
  vps:
    host: vps.example.com
    user: deploy
    port: 22
    remotePath: /var/www/site
    identityFile: ~/.ssh/id_ed25519
    publicKeyFile: ~/.ssh/id_ed25519.pub
```

`cloudflare.pages.project` 是 Pages 專案名稱；`cloudflare.workers.name` 和 `compatibilityDate` 用於產生 `dist/wrangler.toml`。設定 `cloudflare.apiTokenEnv` 時，部署從該環境變數讀取 token；不設定時使用 Wrangler 本機登入狀態。`github.remote` 和 `branch` 必須是本機已有的遠端儲存庫與目標分支；HTTPS remote 可以透過 `github.tokenEnv` 使用環境 token，SSH remote 使用本機 SSH agent/config。VPS 必須填寫 SSH 主機、使用者、連接埠和已存在的遠端目錄；`identityFile` 是私鑰，`publicKeyFile` 可選且公鑰必須預先寫入伺服器 `authorized_keys`。憑證不寫入此檔案。

OpenAI Sites 仍是可選適配，但本專案已移除 Sites 繫結。即使託管平台回報部署成功，也不能推導出所有地區都能存取；DNS、電信商路由、企業網路策略、平台區域可用性和自訂網域狀態都可能造成部分地區失敗。需要廣泛可達性時，應從目標地區實測並保留 Cloudflare、GitHub Pages 或 VPS 的替代出口。

```bash
pagekiln d --dry-run
pagekiln d
```

## 完成修改後的檢查

```bash
npm run compile-runtime
npm run compile-theme
npm run compile-backend
npm test
pagekiln check
npm run catalog
npm run inspect -- home
pagekiln g --profile
```

最後檢查生成的 HTML、404、Feed、網站地圖、搜尋索引、`llms.txt`、部署檔案和主題指紋檔案是否都存在。`dist/` 是生成物，不要手動編輯。
