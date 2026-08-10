---
title: OpenAI Sites 部署適配記錄
description: 記錄 2026-08-10 的 OpenAI Sites 交接實驗；目前部署以 Guide 和 CLI help 為準。
date: 2026-08-10
cover: /assets/product-note-cover.webp
pattern: blog
tags: [deployment, openai-sites]
---

# OpenAI Sites 部署適配記錄

這篇筆記記錄 2026-08-10 完成的 OpenAI Sites 交接實驗。Pagekiln 目前預設設定不繫結 OpenAI Sites；deploy 程式碼仍保留 `openai-sites` 作為可選連接器交接，並要求已有的 Sites 中繼資料。目前操作請查看[二次開發中的部署說明](/zh-tw/development/)和 CLI help；這篇筆記是部署歷史，不是目前部署教學。

這次實驗把 `dist/` 作為唯一靜態根目錄，驗證如何把已檢查的建置交給已有 Sites 專案，同時不在命令列臨時填寫專案 ID 或權杖。

<more>

## 實驗時使用的設定

下面的設定描述這次實驗，不是目前預設設定。目前專案在網站所有者於 `config.yml` 選擇目標前保持 `deployment.targets` 為空：

```yaml
deployment:
  targets: [openai-sites]
  openaiSites:
    metadata: .openai/hosting.json
    staticDirectory: dist
```

`.openai/hosting.json` 表示一個已存在的 `project_id`。Sites 提供短時間的連接器憑據；憑據不能放進設定、遠端 URL 或提交記錄。

## 這次實驗改變了什麼

交接流程檢查 `dist/server/index.js` 和 `dist/index.html`，再把原始碼狀態和建置產物交給 Sites 連接器。測試順序是引用準確的原始碼提交、保存一個版本、部署該版本並輪詢生產狀態。傳輸失敗時必須重試同一個保存上下文；提交過期時要依據遠端真實分支 HEAD 重新建置。

實驗也確認了靜態邊界：生成的輸出仍是應該被託管的交付物；選定目標支援動態請求時，動態請求使用共用的 Web Standard Fetch handler。

## 邊界和結果

OpenAI Sites 負責存取方式、公開 URL 和自訂網域驗證。Pagekiln 負責原始碼、設定、建置輸出和部署入口。平台回報部署成功，只能證明平台完成發布，不保證每個地區、電信商或企業網路都能連接。DNS 傳播、區域路由、防火牆、平台可用性和自訂網域狀態，都可能讓部分訪客無法存取。需要覆蓋目標地區時，應從實際地區測試，並準備 Cloudflare、GitHub Pages 或 VPS 等備用出口。

實驗結束後移除了本機 Sites 繫結。可選適配仍面向已有 Sites 專案；目前部署選擇以[目前二次開發部署說明](/zh-tw/development/)和 `config.yml` 為準。
