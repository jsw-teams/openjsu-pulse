---
title: 讓 Pagekiln 自己說明自己
description: 記錄把 Pagekiln 能力發現移入 CLI、catalog、inspect 和真實 Starter 檔案的變更。
date: 2026-08-10
cover: /assets/product-note-cover.webp
pattern: blog
tags: [agent, discovery, cli]
---

# 讓 Pagekiln 自己說明自己

這篇筆記記錄 2026-08-10 完成的發現契約變更。這是一篇關於已完成架構決定的產品筆記；目前命令和內容規則以[Guide](/zh-tw/guide/)和[二次開發](/zh-tw/development/)為準。

在這次變更之前，Agent 需要從較長的 `AGENTS.md` 了解許多也存在於原始碼中的專案事實。重複事實可能與 CLI 和實際 Starter 產生漂移，使操作約束檔案承擔了超出邊界的權威。

<more>

## 能力移入產品本身

Pagekiln 現在透過公開 CLI 和生成的發現檔案提供基於原始碼的能力資訊：

- `pagekiln catalog` 讀取目前設定、內容、主題 Pattern、Block、schema、插件和資源依賴，不要求完整建置。
- `pagekiln inspect` 支援內容查詢，以及明確的 `page:`、`block:`、`pattern:`、`collection:` 和 `plugin:` 命名空間；找不到物件時返回穩定的結構化錯誤。
- `starter/` 是 `pagekiln init` 實際複製的檔案模板；CLI 不再維護另一套硬編碼 Starter。
- `AGENTS.md` 保留操作邊界和驗證規則，不再重複整套實作說明。

原始碼檔案仍然是事實來源：`config.yml`、`content/` 和 `themes/` 描述專案；`catalog` 和 `.well-known/agent.json` 是從這些原始碼生成的發現視圖。這樣把原始碼事實與生成發現分開，不需要增加另一套內容系統。

## 沒有專用 Skill 時 Agent 仍能完成什麼

現代 Coding Agent 可以先執行 `catalog` 發現專案，再 inspect 相關頁面、Block、Pattern、collection 或 plugin，修改原始碼，執行 `check`，最後執行 `build`。Pagekiln 不要求專用 Pagekiln Skill 才能正確執行這套操作。

Skill 仍然可以壓縮已知工作流、提供提醒或協調較大的任務。它是可選的工作流輔助，不是使用 Pagekiln 的前提。

## 結果

這次變更讓 CLI 和它操作的檔案說明同一組能力。未來行為改變時，應同步更新原始碼契約和目前文件；新增發現視圖時，應從原始碼生成，而不是複製到另一份說明書。
