---
title: 模型越來越強之後，我們還需要學提示詞和 Skill 嗎？
description: 從 2026 年的模型、Coding Agent、Skill 與 Pagekiln 2.0 重構出發，重新討論提示詞、上下文、重複工作流，以及 AI 寫程式後更棘手的技術債問題。
date: 2026-08-11
cover: /assets/product-note-cover.webp
pattern: blog
tags: [ai, agent, prompt, skill, pagekiln]
---

# 模型越來越強之後，我們還需要學提示詞和 Skill 嗎？

大型語言模型剛開始進入日常工作時，學習提示詞幾乎是順理成章的事。同一個問題換一種說法，回答品質可能相差很大，於是「你是一名資深工程師」「請逐步分析」「嚴格按照以下格式」「檢查是否遺漏」逐漸成為常見寫法。後來，這些一次性的提示又向外延伸成 System Prompt、Custom Instructions、專案說明檔案和 Agent Skill。人不只告訴模型要完成什麼，還要事先替模型安排完成任務的路線。

到了 2026 年，這種分工正在改變。

現在的 Coding Agent 已經能自己查看目錄、搜尋程式碼、閱讀設定、執行命令、檢查測試失敗，再根據結果繼續修改。OpenAI 在 GPT-5.6 的使用指南裡也直接把「理解意圖」列為變化之一：使用者通常不再需要規定每一步，但領域背景、硬性限制、授權邊界和成功標準仍然需要明確提供。

**原文：**

> “GPT-5.6 can better infer the user’s underlying goal and intended level of work from context, so you often do not need to prescribe every step.”

**譯文：**

> 「GPT-5.6 能更好地從上下文推斷使用者的真正目標和預期工作深度，因此通常不需要規定每一個步驟。」

這已經足以改變學習順序。一般使用者沒有必要先學一套 Prompt Engineering 才開始使用模型，個人開發者也沒有必要為每一個專案先寫一套大型 Skill。更重要的能力，是把目標、既有材料、限制和完成標準說清楚，再檢查模型是否真的完成任務。

<more>

## 提示詞沒有消失，正在貶值的是「提示詞咒語」

模型能夠自己尋找執行路徑，不代表模糊輸入突然變得可靠。

2026 年一項關於 Prompt sensitivity 的研究比較了資訊不足的 Prompt 和提供具體指令的 Prompt，結果發現前者表現出更高的性能方差。

**原文：**

> “We find that underspecified prompts exhibit higher performance variance and lower logit values for relevant tokens, while instruction-prompts suffer less from such problems.”

**譯文：**

> 「我們發現，描述不足的提示詞表現出更高的性能方差，相關 token 的 logit 值也更低，而提供具體指令的提示詞較少受到這些問題影響。」

所以，「不用專門學提示詞技巧」和「隨便說一句模型都能猜對」是兩回事。

「幫我把網站做得現代一點」仍然是一個資訊不足的任務。「重新設計首頁，保留現有三種語言和 URL，不增加前端框架，行動版導覽不能退化，修改後執行現有測試」沒有複雜的 Prompt 技巧，卻已經把任務中真正重要的資訊交代清楚。

現在更值得學的是這種任務表達能力。

模型越來越擅長決定怎麼做，人就更應該明確做到什麼程度才算完成。Prompt 仍然是任務入口，但不需要繼續承擔整個工作流，也沒有必要把某些固定句式包裝成啟動模型能力的祕訣。

## 當 AGENTS.md 從說明書變回目錄

OpenAI 在 2026 年 2 月公開的 Codex 工程實驗提供了一個具體案例。一個小型團隊讓 Codex 編寫應用程式碼、測試、CI、文件、可觀測性和內部工具，專案在五個月後達到約百萬行程式碼，並累計合併約 1,500 個 Pull Request。

這項實驗真正與 Prompt 和 Skill 問題相關的部分，不是百萬行程式碼本身，而是他們如何處理專案知識。

團隊曾嘗試把大量規則放進一個巨大的 `AGENTS.md`，最後發現上下文本身已經成為稀缺資源。

**原文：**

> “Context is a scarce resource.”

**譯文：**

> 「上下文是一種稀缺資源。」

他們後來把結構化的倉庫文件作為事實來源，讓較短的 `AGENTS.md` 負責告訴 Agent 應該去哪裡尋找資訊。OpenAI 對這個變化的概括很形象：

> “So instead of treating `AGENTS.md` as the encyclopedia, we treat it as the table of contents.”

這兩句來自同一來源，合計引用長度控制在原文許可範圍內。

**譯文：**

> 「因此，我們不再把 `AGENTS.md` 當成百科全書，而把它當成目錄。」

這個變化與「Prompt 越短越好」沒有直接關係。真正減少的是不論當前任務是否需要，都事先塞給模型的資訊。

Agent 只是修改導覽時，沒有必要同時重新閱讀部署、資料庫、benchmark、全部主題 Block 和幾十條歷史相容規則。倉庫能把相關資訊放在可發現的位置，Agent 才能按照任務取得上下文。

## Skill 也從「能力包」走向「重複工作流」

Skill 並沒有因為模型增強而消失。

OpenAI 目前直接把 Skill 定義為可重複使用、可分享的工作流，用來讓特定任務執行得更加一致。

**原文：**

> “Skills are reusable, shareable workflows that tell ChatGPT how to do a specific task so ChatGPT can do that task more consistently.”

**譯文：**

> 「Skill 是可重複使用、可分享的工作流，用來告訴 ChatGPT 如何執行特定任務，讓這項任務執行得更加一致。」

這個定義已經很接近 Skill 今天最實際的用途。

第一次讓 Agent 檢查一個網站的無障礙問題，沒有必要先寫一個 `SKILL.md`。當團隊每次發布都需要按照相同順序檢查鍵盤導覽、ARIA、行動版表格、減少動畫設定和指定測試，再輸出固定格式的結果，這套重複工作才值得被保存下來。

Skill 應該來自已經形成的重複工作，而不是為了使用 Skill，先人為製造一套複雜工作流。

GitHub 在 2026 年進一步把 Agent Skills 做成可以發現、安裝、更新、固定版本和跨 Agent Host 使用的資源，目前列出的支援環境包括 GitHub Copilot、Claude Code、Cursor、Codex 和 Gemini CLI。Skill 因此越來越接近一種可管理的工程資源，裡面甚至可以包含腳本，而不只是幾段高階 Prompt。

這也帶來新的風險。GitHub 明確提醒安裝者檢查 Skill 內容，因為其中可能存在 Prompt Injection、隱藏指令或惡意腳本。當 Skill 能夠改變 Agent 行為並執行程式碼後，管理它的方式自然應該更接近管理依賴，而不是隨手複製一段網路上的「萬能提示詞」。

## Agent 開始自己尋找需要的能力

把所有工具和 Skill 一次塞進上下文，也正在失去吸引力。

GitHub 在 2026 年 6 月推出 Agent Finder 時，直接把「手動把 MCP Server、Skill、Agent 和工具全部接入，並因此填滿上下文視窗」列為要解決的問題。Agent Finder 根據自然語言任務查詢資源目錄，返回當前任務真正需要的能力，再按需載入。

**原文：**

> “Agent finder finds the right tool at the right time. It doesn’t silently connect anything.”

**譯文：**

> 「Agent Finder 會在正確的時間找到合適的工具，同時不會在沒有明確操作的情況下自行連接任何東西。」

這和傳統的「大 Prompt + 大 Skill + 全工具預載入」正好形成另一種工作方式：模型先理解任務，再尋找完成任務需要的資訊。

真正需要最佳化的因此不是提示詞字數，而是**資訊取得成本**。

完全不給 Agent 專案說明，它可能每次重新列目錄、搜尋設定、掃描主題、猜測入口，再從建置錯誤中反推專案結構。這同樣會消耗大量上下文。更合理的專案會讓 Agent 快速發現事實，並且只讀取眼前真正需要的部分。

## Prompt 寫得很好，也救不了資訊環境很差的 Agent

Agent 的工作品質也越來越難只歸因於模型和 Prompt。

Anthropic 在 2026 年 2 月測試 Terminal-Bench 2.0 時，只改變執行 Agent 的基礎設施資源設定，最寬鬆和最嚴格環境之間就產生 6 個百分點的成功率差距，而且模型、Harness 和任務集保持不變。

**原文：**

> “Infrastructure configuration can swing agentic coding benchmarks by several percentage points—sometimes more than the leaderboard gap between top models.”

**譯文：**

> 「基礎設施設定可以讓 Agent 編程基準成績波動數個百分點，有時甚至超過排行榜上頂尖模型之間的差距。」

專案結構同樣屬於 Agent 的工作環境。

沒有測試，模型就缺少判斷修改是否正確的回饋；錯誤訊息只有「Build failed」，模型只能繼續猜；同一個事實同時寫在程式碼、README、Skill 和 Agent Instructions 裡，模型又要判斷哪一份已經過期。

這些問題都很難靠「請仔細閱讀專案，認真思考，不要遺漏任何細節」解決。

而我在實際使用 Coding Agent 的過程中，又遇到另一個更麻煩的問題。

## 「認真修復」很容易變成「再加一層」

一個功能已經存在舊實作，我讓 Agent 修問題時，它經常選擇最保守的路線：保住原本的程式碼，再增加一個判斷、一個 helper、一個 wrapper、一個 fallback，或者再建立一套相容入口。

第一次修改通常可以運作。

下一次 Agent 再進入專案，上一次的補丁已經成了「現有程式碼」。模型繼續模仿這個結構，再往旁邊加一層。重複幾次以後，一個簡單功能可能同時留下舊函式、新函式、相容入口、fallback，以及專門處理前幾輪補丁留下問題的邏輯。

每一個局部改動都能解釋。

整個系統卻越來越難解釋。

用程式設計師常見的調侃來說，再修幾輪，Bug 已經快能憑資歷轉正成 Feature 了。

2026 年的 SlopCodeBench 正好把這種長期問題從一次性程式碼生成中拆出來。它讓 Agent 在不斷變化的需求下反覆擴充自己上一輪生成的程式碼，而不是每輪重新得到一份整理乾淨的起點。研究中的 11 個 Agent 沒有任何一個完整解決整條長期任務軌跡；在 80% 的軌跡中結構侵蝕增加，在 89.8% 的軌跡中冗餘度增加，Agent 程式碼與 48 個真實 Python 開源倉庫相比平均達到 2.2 倍的 verbosity。

更關鍵的是，單獨加強 Prompt 沒有阻止這種退化。

**原文：**

> “A prompt-intervention study shows that initial quality can be improved, but it does not halt degradation.”

**譯文：**

> 「Prompt 干預能改善最初的程式碼品質，但無法阻止後續退化。」

這和我的實際感受很接近。

「仔細檢查」「盡量保持相容」「不要破壞原有功能」「優先最小修改」單獨看都合理。它們組合在長期維護中，卻很容易讓 Agent 形成一種安全策略：已有程式碼盡量不動，新的問題繼續往旁邊補。

測試通過了。

技術債也留下來了。

## Agent 越來越會執行重構，卻還不太會主動發現該刪什麼

CodeTaste 在 2026 年進一步測試了另一個區別：明確告訴 Agent 要怎樣重構，與只告訴它「這裡需要改善」，結果差得非常大。

在詳細規定重構方向的情況下，模型最高達到 69.6% alignment；只提供一個模糊改善區域，讓 Agent 自己找出人類開發者實際採用的重構方案時，最佳直接結果只有 7.9%。

CodeTaste 專案給出的概括很直接：

> “While models reliably execute well-specified instructions, they fail to autonomously identify human-aligned refactorings when given only a vague focus area.”

**譯文：**

> 「模型能可靠執行定義清楚的重構指令，但只給出模糊改善範圍時，難以自主找到與人類開發者一致的重構方案。」

這解釋了「會寫程式碼」和「知道什麼程式碼已經不該存在」之間的差距。

新增一個 wrapper 很容易驗證：新測試通過就可以。

刪除一個舊 wrapper 則需要知道有沒有其他呼叫者、新實作是否已完整覆蓋、是否存在隱藏相容行為、文件和設定是否仍然引用它。刪除依賴的是系統級判斷。

2026 年另一項針對 Agentic Coding 的研究甚至直接研究哪些 AI 新增方法會在 Pull Request review 中被刪除，並訓練模型預測這些最終不需要的方法，得到 87.1% 的 AUC。「生成更多程式碼」已經不再天然等於「完成更多工作」。

## 更快生成，也會更快累積技術債

這個現象不限於某一個 benchmark。

2026 年發表在 ACM TOSEM 的一項多聲部文獻回顧分析了 104 份正式研究和灰色文獻，並把 LLM 輔助開發帶來的問題放進傳統技術債框架中。研究認為，LLM 經常放大程式碼債、設計債和文件債，同時還產生快速整合等新的債務形式。

**原文：**

> “We find that LLMs often amplify traditional forms of technical debt, particularly code, design, and documentation debts, while also introducing new LLM-specific debts.”

**譯文：**

> 「我們發現，大型語言模型經常放大傳統形式的技術債，尤其是程式碼債、設計債和文件債，同時也會產生新的 LLM 特有債務。」

生成程式碼越來越便宜之後，「把程式碼寫出來」正在失去它過去在軟體工程中的稀缺性。

架構一致性、刪除舊實作、測試、驗證和長期維護開始佔據更大的比重。

OpenAI 自己的 Codex 實驗也遇到同樣的問題。Agent 會複製倉庫裡已經存在的模式，包括那些並不理想的模式；團隊一度把每週五、約佔一週 20% 的工程時間用來清理所謂的「AI slop」，後來才把架構原則和定期重構任務編碼進系統。

**原文：**

> “Codex replicates patterns that already exist in the repository—even uneven or suboptimal ones.”

**譯文：**

> 「Codex 會複製倉庫裡已經存在的模式，包括那些不一致或並不理想的模式。」

這句話也說明了為什麼一次壞補丁會持續產生影響。

Agent 下一輪看到的「最佳實踐」，很可能就是上一輪 Agent 自己留下來的東西。

## Pagekiln 2.0 為什麼開始刪東西

Pagekiln 2.0 最近這次重構，正好經歷了同樣的問題。

之前專案根目錄的 `AGENTS.md` 大約有 10 KB，目錄職責、Pattern、Block、建置、部署、測試和 Agent 工作方式都放在裡面。當前版本已經縮到約 2.7 KB，只留下專案邊界、發現入口、修改原則和驗證方式。

同時，專案把能力發現放進真正能夠執行的介面。現在 `pagekiln catalog` 直接根據原始碼產生當前主題和擴充能力，不需要為了查看能力先完整建置 `dist/`；`pagekiln inspect` 可以按照 `page:`、`block:`、`pattern:`、`collection:` 和 `plugin:` 查詢局部事實。

`pagekiln init` 也不再在 CLI 檔案中硬編碼另一套 Starter，而是直接複製倉庫裡的 `starter/`。

這些改動表面上增加了幾個 CLI 能力，真正發生的事情卻是**刪除重複事實來源**。

有了真實的 `starter/`，CLI 裡另一套 Starter 就沒有繼續存在的必要。

有了 `catalog` 和 `inspect`，`AGENTS.md` 就不需要再複製完整 Pattern、Block 和 Schema 清單。

專案已經能透過 `check` 報告契約錯誤後，也沒有必要繼續依賴一段越來越長的提示，告訴 Agent「千萬不要弄錯」。

Pagekiln 仍然保留 Agent Instructions，但不再承擔 Pagekiln 百科全書的職責。

這比繼續製作一個更大的 Pagekiln Skill 更符合我現在使用 Agent 的方式。

## 現在更需要告訴 Agent：新增以後，什麼應該消失

我的 Coding Agent 提示也因此開始改變。過去更容易寫：

```text
實作這個功能。
保持現有功能相容。
盡量不要破壞原本的結構。
完成以後執行測試。
```

現在我更在意另一部分：

```text
先確認現有實作和職責。
實作目標功能。
檢查新實作是否取代了舊路徑。
刪除已失去職責的程式碼、重複 helper 和相容層。
不要為了保留舊實作再增加第二套實作。
完成後重新執行完整測試，並確認刪除沒有留下引用。
```

這仍然是一段 Prompt，但它解決的已經不是「怎樣讓模型變聰明」。

它定義的是工程完成標準。

Skill 也可以保存這套流程，但前提是它已經成為反覆出現的工作方式。對於一次性的修改，讓 Agent 直接讀取程式碼、執行任務和驗證結果更簡單；對於持續重複的團隊流程，再把「檢查—修改—驗證—刪除—再次驗證」固化成 Skill。

模型越來越強之後，真正值得學的東西因此發生了遷移。

Prompt 的重點從措辭技巧移向任務定義。

Skill 的重點從能力擴充移向重複工作流。

Coding Agent 的重點從「能不能生成程式碼」進一步移向「連續迭代之後還能不能留下容易理解的專案」。

而在實際維護中，我越來越重視一個過去很少寫進 Prompt 的問題：

**這次修改完成以後，哪些東西已經沒有繼續存在的理由？**

程式碼生成越來越廉價之後，刪除、整理和驗證反而變得更昂貴，也更重要。

# 引用與線上資料

1. OpenAI — *Model guidance / GPT-5.6*
   https://developers.openai.com/api/docs/guides/latest-model

2. Pecher et al. — *Revisiting Prompt Sensitivity in Large Language Models for Text Classification: The Role of Prompt Underspecification*
   https://arxiv.org/abs/2602.04297

3. OpenAI — *Harness engineering: leveraging Codex in an agent-first world*
   https://openai.com/index/harness-engineering/

4. OpenAI — *Skills in ChatGPT*
   https://help.openai.com/en/articles/20001066

5. GitHub — *Manage agent skills with GitHub CLI*
   https://github.blog/changelog/2026-04-16-manage-agent-skills-with-github-cli/

6. GitHub — *Agent finder for GitHub Copilot now available*
   https://github.blog/changelog/2026-06-17-agent-finder-for-github-copilot-now-available/

7. Anthropic — *Quantifying infrastructure noise in agentic coding evals*
   https://www.anthropic.com/engineering/infrastructure-noise

8. Orlanski et al. — *SlopCodeBench: Benchmarking How Coding Agents Degrade Over Long-Horizon Iterative Tasks*
   https://arxiv.org/abs/2603.24755

9. Thillen et al. — *CodeTaste: Can LLMs Generate Human-Level Code Refactorings?*
   https://arxiv.org/abs/2603.04177

10. CodeTaste 官方專案頁
    https://codetaste.logicstar.ai/

11. Watanabe et al. — *What to Cut? Predicting Unnecessary Methods in Agentic Code Generation*
    https://arxiv.org/abs/2602.17091

12. Ehsani et al. — *Faster Code, Deeper Debt? A Multivocal Literature Review on Technical Debt and Its Early Signs in LLM-Assisted Software Development*
    https://doi.org/10.1145/3820165

13. Pagekiln
    https://github.com/jsw-teams/pagekiln

14. Pagekiln — *Fix Pages deployment and discovery contracts*
    https://github.com/jsw-teams/pagekiln/commit/752f669c7edb7ee84e9459679b339bc0dd814da6
