---
title: 開發 Block 與主題擴充
description: 以主題為起點新增 Block、註冊資源、測試擴充並部署結果的實際流程。
pattern: docs
---

# 開發 Block 與主題擴充

Pagekiln 的二次開發從複製主題開始。編譯器負責 Markdown、schema、路由、依賴、資源和輸出；主題負責 Pattern、Block、版面、CSS、瀏覽器 ESM、圖示和隱私呈現。本頁描述目前的擴充路徑。

## 1. 複製主題邊界

在新的主題目錄開始，讓原主題繼續作為可執行的參考：

```text
themes/<name>/
├─ theme.yml
├─ theme.ts
├─ style.css
├─ i18n.yml
└─ scripts/                 可選的原生瀏覽器 ESM
```

`theme.yml` 宣告 `theme.ts`、`style.css`、i18n 資源、Pattern、Block 和外掛資源。主題層級的 `plugins` 開關下放二級外掛名稱。主題 UI 文案放在 `themes/<name>/i18n.yml`，不放入站務根設定。

## 2. 在 `theme.ts` 新增 Block

使用小型主題 API，讓 Block schema 保持標量且明確：

```ts
import { defineTheme } from '../../src/theme-api.ts';

export default defineTheme({
  name: 'nebula',
  patterns: {
    document: { name: 'document', contexts: ['page'], render: content => content }
  },
  blocks: {
    notice: {
      name: 'notice',
      schema: { tone: 'string' },
      render: (node, context) => {
        const tone = context.escapeHtml(node.attributes.tone || 'info');
        return `<aside class="notice notice--${tone}">${context.renderNodes(node.children)}</aside>`;
      }
    }
  }
});
```

`context.renderNodes` 渲染 Markdown 子節點。文字和屬性使用 `context.escapeHtml`，連結使用 `context.safeUrl`。不要把未經審查的 Markdown、Frontmatter 或設定值送進 `unsafeHtml`。

在 `theme.yml` 註冊同一個 Block：

```yaml
name: nebula
module: theme.ts
style: style.css
blocks:
  - notice
patterns:
  - document
plugins:
  privacyConsent:
    enabled: true
```

程式碼中的 schema 和 `theme.yml` 的註冊共同構成一個契約。未註冊的 Block 應由 discovery 或 check 報錯，不要用編譯器條件隱藏它。

## 3. 在 Markdown 使用 Block

在 `content/pages/` 下的頁面加入指令：

```markdown
:::notice{tone="info"}
目前使用說明在 Guide 中。
:::
```

指令屬性保持短小且為標量。標題、段落、清單、表格、程式碼和連結繼續使用普通 Markdown。描述目前行為的 Block 放在 page；記錄有日期的實作決定則放在帶必填 `date` 的 Product Note。

## 4. 讓一個樣式檔擁有視覺行為

把 Block 規則加入主題的 `style.css`：

```css
.notice{border-inline-start:3px solid var(--accent);padding:1rem 1.2rem;background:var(--panel);color:var(--ink)}
```

編譯器會把 CSS 壓縮為單行並為檔名加指紋。響應式版面、焦點狀態、表格適配、圖示尺寸和 reduced-motion 行為都放在這個樣式檔或宣告的主題資源中。新規則取代舊規則時刪除重疊規則和無效相容檔案，不要依賴 cascade 順序同時維持兩套設計。

預設主題透過主題模組使用 Lucide 圖示套件。既有控件應重用已宣告的圖示庫，不要為同一組控件再增加圖示字型或另一套內嵌 SVG。

## 5. 發現並測試擴充

依照以下順序執行：

```bash
npm run compile-theme
npm run catalog
pagekiln inspect block:notice
pagekiln check
pagekiln g --profile
pagekiln s
```

`catalog` 確認目前主題的 Pattern、Block、外掛、schema 名稱和資源依賴。`inspect block:notice` 以結構化輸出回答單一能力問題。`check` 會以原始碼位置報告未知 Block、無效屬性、路由衝突和缺少必填欄位。`g` 確認 Block 進入靜態輸出；`s` 確認 Markdown 或主題編輯後瀏覽器會重新整理。

## 6. 新增可選瀏覽器行為

原生 ESM 放在 `themes/<name>/scripts/`，並在對應外掛下宣告。每個可選外掛都要有明確開關：

```yaml
plugins:
  privacyConsent:
    enabled: true
  search:
    enabled: true
```

可選分析或廣告腳本在訪客同意對應 Cookie 類別前保持不活動。必要的同意儲存由隱私契約啟用；footer 開啟與訪客之後重新開啟的同一個設定對話框。瀏覽器程式碼只載入一次，每個事件處理器只保留一個擁有者。舊腳本被取代時刪除它，不要讓兩個處理器互相競爭。

## 7. 分離站務設定與執行時程式碼

`config.yml` 儲存網站資訊、語言、collection、路由、schema、隱私設定和部署位置，不儲存 CSS 路徑、任意 HTML 或瀏覽器腳本正文。需要動態請求、密鑰、寫入和 webhook 時，程式碼只放在 `backend/handler.ts`；使用共享 Fetch router，並在部署前編譯 backend。

純靜態網站在 Pages 上關閉 backend，使用 CDN、Caddy 或 Nginx 提供 `dist/`。部署設定範例：

```yaml
deployment:
  targets: [cloudflare-pages]
  cloudflare:
    apiTokenEnv: CLOUDFLARE_API_TOKEN
    pages:
      project: example-site
      branch: production
```

```bash
pagekiln d --dry-run
pagekiln d
```

一次發佈需要多個目的地時使用 `targets: [cloudflare-pages, github-pages, vps]`。在 `config.yml` 填寫各供應商的專案、遠端倉庫、分支、SSH 主機、使用者、連接埠、遠端路徑和金鑰路徑；金鑰值留在環境變數或本機 SSH 設定中。

## 8. 測量修改

可選 fixture 會測量 100 個臨時頁面，並以 JSON 行報告 cold、no-change、edit、add、delete、theme 和 settings 變化：

```bash
npm run compile-runtime
npm run compile-theme
npm run compile-backend
npm run bench -- 100
```

`maxRssMiB` 是 Node 建置程序的峰值常駐記憶體，不是輸出目錄大小。fixture 執行後會移除，不構成產品效能承諾。

## 9. 擴充完成清單

```text
[ ] theme.ts 透過 defineTheme 匯出 Block
[ ] theme.yml 註冊 Block 和資源
[ ] style.css 負責響應式及焦點狀態
[ ] 刪除重複 CSS、JS 和相容層
[ ] 可選外掛有明確開關
[ ] i18n 留在 themes/<name>/i18n.yml
[ ] pagekiln catalog 和 inspect 能描述 Block
[ ] pagekiln check、build、test 和 preview 通過
[ ] 檢查產生的 dist/，不手動編輯
```
