---
title: 透過 OpenAI Sites 發佈 dist
description: 記錄 Pagekiln 將已驗證的 dist 交給 OpenAI Sites 發佈的完整邊界。
date: 2026-08-10
cover: /assets/product-note-cover.webp
pattern: blog
tags: [deployment, openai-sites]
---

# 透過 OpenAI Sites 發佈 dist

這次部署把靜態根統一設定為 `dist`。Pagekiln 先產生頁面和 Sites 所需的 `server/index.js`，再把同一份已驗證的原始碼與建置產物交給 OpenAI Sites；網站不依賴命令列臨時填寫專案 ID 或權杖。

<more>

## 設定只表達站點事實

站點根目錄的設定保留專案繫結和靜態根：

```yaml
deployment:
  targets: [openai-sites]
  openaiSites:
    metadata: .openai/hosting.json
    staticDirectory: dist
```

`.openai/hosting.json` 只保存已存在的 `project_id`。原始碼憑據由 Sites 連接器短時間提供，不可寫入設定、遠端 URL 或提交記錄。

## 發佈順序

先執行 `pagekiln g` 和 `pagekiln check`，再執行 `pagekiln d --dry-run` 檢查目標。部署腳本會確認 `dist/server/index.js` 和 `dist/index.html` 都存在，然後把動作交給 Sites 連接器：推送目前原始碼分支的準確 HEAD、保存引用該提交的版本、部署已保存版本，並輪詢生產狀態。

封存同時包含 `dist/`、Sites 中繼資料和必要的動態入口。頁面請求由同一份 Web Standard Fetch handler 處理；靜態檔案使用 `dist` 作為根，入口旁的靜態資源回退用於處理平台未注入靜態繫結的情況。

## 失敗時保持同一發佈上下文

`Transport send error` 是連接器傳輸層的暫時故障，只能在短暫等待後重試同一個保存動作；不可重新建立網站或產生另一套專案 ID。若 Sites 回傳 `stale_commit_sha`，先讀取遠端分支的真實 HEAD，重新建置與該提交一致的封存，再保存版本。只有保存成功並返回版本後才允許部署。

## 這次決定的邊界

OpenAI Sites 的存取權限、公開 URL 和自訂網域屬於 Sites 管理面；網域驗證仍需在網域服務商加入平台提供的 DNS 記錄。Pagekiln 只負責原始碼、設定、建置輸出和可驗證的部署入口，不把平台憑據寫進網站檔案。

## 部署成功不等於所有地區都能存取

OpenAI Sites 可以接受建置並回報部署成功，但這只代表平台完成發布，不代表每個地區、電信商或企業網路都能建立到網站的連線。DNS 傳播、跨境或區域路由、企業防火牆、平台區域可用性以及自訂網域狀態，都可能讓部分訪客無法開啟或存取不穩定。需要廣泛可達性時，應從目標地區實測，並準備 Cloudflare、GitHub Pages 或 VPS 作為替代出口。

本專案已移除本機 OpenAI Sites 繫結，因此不會繼續預設發布到該網站；本筆記保留作為可選 Sites 適配的部署邊界說明。
