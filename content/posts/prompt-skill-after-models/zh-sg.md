---
title: 模型越来越强之后，我们还需要学提示词和 Skill 吗？
description: 从 2026 年的模型、Coding Agent、Skill 与 Pagekiln 2.0 重构出发，重新讨论提示词、上下文、重复工作流，以及 AI 写代码之后更棘手的技术债问题。
date: 2026-08-11
pattern: blog
tags: [ai, agent, prompt, skill, pagekiln]
---

# 模型越来越强之后，我们还需要学提示词和 Skill 吗？

大模型刚开始进入日常工作时，学习提示词几乎是一件顺理成章的事。同一个问题换一种说法，回答质量可能相差很大，于是“你是一名资深工程师”“请逐步分析”“严格按照以下格式”“检查是否遗漏”逐渐变成常见写法。后来，这些一次性的提示又向外扩展成 System Prompt、Custom Instructions、项目说明文件和 Agent Skill。人不仅告诉模型要完成什么，还要提前替模型安排完成任务的路线。

到了 2026 年，这种分工正在变化。

现在的 Coding Agent 已经能自己查看目录、搜索代码、阅读配置、运行命令、检查测试失败，再根据结果继续修改。OpenAI 在 GPT-5.6 的使用指导里也直接把“意图理解”列为变化之一：用户通常不再需要规定每一步，但领域背景、硬约束、授权边界和成功标准仍然需要明确提供。

**原文：**

> “GPT-5.6 can better infer the user’s underlying goal and intended level of work from context, so you often do not need to prescribe every step.”

**译文：**

> “GPT-5.6 能够更好地从上下文推断用户的真实目标和预期工作深度，因此你通常不需要规定每一个步骤。”

这已经足以改变学习顺序。普通用户没有必要先学一套 Prompt Engineering 才开始使用模型，个人开发者也没有必要给每一个项目先写一套大型 Skill。更重要的能力已经变成把目标、已有材料、限制和完成标准说清楚，再检查模型是不是真的完成了任务。

<more>

## 提示词没有消失，正在贬值的是“提示词咒语”

模型能够自己寻找执行路径，不代表模糊输入突然变得可靠。

2026 年关于 Prompt sensitivity 的一项研究比较了信息不足的 Prompt 和提供具体指令的 Prompt，结果发现前者表现出更高的性能方差。

**原文：**

> “We find that underspecified prompts exhibit higher performance variance and lower logit values for relevant tokens, while instruction-prompts suffer less from such problems.”

**译文：**

> “我们发现，描述不足的提示词表现出更高的性能方差，并且相关 token 的 logit 值更低，而提供具体指令的提示词较少受到这些问题影响。”

所以，“不用专门学提示词技巧”和“随便说一句模型都能猜对”是两回事。

“帮我把网站做得现代一点”仍然是一个信息不足的任务。“重新设计首页，保留现有三语言和 URL，不增加前端框架，移动端导航不能退化，修改后运行现有测试”没有复杂的 Prompt 技巧，却已经把任务中真正重要的信息交代清楚。

现在更值得学的是这种任务表达能力。

模型越来越擅长决定怎么做，人就更应该明确做到什么程度才算完成。Prompt 仍然是任务入口，但它不需要继续承担整个工作流，也没有必要把某些固定句式包装成激活模型能力的秘诀。

## 当 AGENTS.md 从说明书变回目录

OpenAI 在 2026 年 2 月公开的 Codex 工程实验提供了一个很具体的案例。一个小型团队让 Codex 编写应用代码、测试、CI、文档、可观测性和内部工具，项目在五个月后达到约百万行代码，并累计合并约 1,500 个 Pull Request。

这项实验真正与 Prompt 和 Skill 问题相关的部分，却不是百万行代码本身，而是他们怎样处理项目知识。

团队尝试过把大量规则放进一个巨大的 `AGENTS.md`，最后发现上下文本身已经变成稀缺资源。

**原文：**

> “Context is a scarce resource.”

**译文：**

> “上下文是一种稀缺资源。”

他们后来把结构化仓库文档作为事实来源，让较短的 `AGENTS.md` 负责告诉 Agent 应该去哪里寻找信息。OpenAI 对这个变化的概括很形象：

> “So instead of treating `AGENTS.md` as the encyclopedia, we treat it as the table of contents.”

这两句来自同一来源，合计引用长度控制在原文许可范围内。

**译文：**

> “因此，我们不再把 `AGENTS.md` 当成百科全书，而把它当成目录。”

这个变化与“Prompt 越短越好”没有直接关系。真正减少的是无论当前任务需不需要，都提前塞给模型的信息。

一个 Agent 只是修改导航，没有必要同时把部署、数据库、benchmark、全部主题 Block 和几十条历史兼容规则重新读一遍。仓库能够把相关信息放在可发现的位置，Agent 才能按任务获取上下文。

## Skill 也从“能力包”走向“重复工作流”

Skill 并没有因为模型增强而消失。

OpenAI 目前直接把 Skill 定义为可复用、可共享的工作流，用来让特定任务执行得更加一致。

**原文：**

> “Skills are reusable, shareable workflows that tell ChatGPT how to do a specific task so ChatGPT can do that task more consistently.”

**译文：**

> “Skill 是可复用、可共享的工作流，用来告诉 ChatGPT 如何执行特定任务，从而让这项任务执行得更加一致。”

这个定义已经很接近 Skill 在今天最实际的用途。

第一次让 Agent 检查一个网站的无障碍问题，没有必要先写一个 `SKILL.md`。当团队每次发布都需要按照同样的顺序检查键盘导航、ARIA、移动端表格、减少动画设置和指定测试，再输出固定格式的结果，这套重复工作才值得被保存下来。

Skill 应该来自已经形成的重复工作，而不是为了使用 Skill，先人为制造一套复杂工作流。

GitHub 在 2026 年进一步把 Agent Skills 做成可以发现、安装、更新、固定版本和跨 Agent Host 使用的资源，目前列出的支持环境包括 GitHub Copilot、Claude Code、Cursor、Codex 和 Gemini CLI。Skill 因此越来越接近一种可管理的工程资源，里面甚至可以包含脚本，而不只是几段高级 Prompt。

这也带来了新的风险。GitHub 明确提醒安装者检查 Skill 内容，因为其中可能存在 Prompt Injection、隐藏指令或者恶意脚本。当 Skill 能够改变 Agent 行为并执行代码之后，管理它的方式自然应该更接近管理依赖，而不是随手复制一段网上的“万能提示词”。

## Agent 开始自己寻找需要的能力

把所有工具和 Skill 一次性塞进上下文也正在失去吸引力。

GitHub 在 2026 年 6 月上线 Agent Finder 时，直接把“手动把 MCP Server、Skill、Agent 和工具全部接进去，并因此填满上下文窗口”列为要解决的问题。Agent Finder 根据自然语言任务查询资源目录，返回当前任务真正需要的能力，再按需加载。

**原文：**

> “Agent finder finds the right tool at the right time. It doesn’t silently connect anything.”

**译文：**

> “Agent Finder 会在正确的时间找到合适的工具，同时不会在没有明确操作的情况下自行连接任何东西。”

这和传统的“大 Prompt + 大 Skill + 全工具预加载”正好形成另一种工作方式：模型先理解任务，再寻找完成任务需要的信息。

真正需要优化的因此不是提示词字数，而是**信息获取成本**。

完全不给 Agent 项目说明，它可能每次重新列目录、搜索配置、扫描主题、猜测入口，再从构建错误中反推项目结构。这照样消耗大量上下文。更合理的项目会让 Agent 快速发现事实，并且只读取眼前真正需要的那部分。

## Prompt 写得很好，也救不了一个信息环境很差的 Agent

Agent 的工作质量也越来越难只归因于模型和 Prompt。

Anthropic 在 2026 年 2 月测试 Terminal-Bench 2.0 时，只改变运行 Agent 的基础设施资源配置，最宽松和最严格环境之间就产生了 6 个百分点的成功率差距，而且模型、Harness 和任务集保持不变。

**原文：**

> “Infrastructure configuration can swing agentic coding benchmarks by several percentage points—sometimes more than the leaderboard gap between top models.”

**译文：**

> “基础设施配置可以让 Agent 编程基准成绩波动数个百分点，有时甚至超过排行榜上顶尖模型之间的差距。”

项目结构同样属于 Agent 的工作环境。

没有测试，模型就缺少判断修改是否正确的反馈；错误信息只有“Build failed”，模型只能继续猜；同一个事实同时写在代码、README、Skill 和 Agent Instructions 里，模型又要判断哪一份已经过期。

这些问题都很难靠“请仔细阅读项目，认真思考，不要遗漏任何细节”解决。

而我在实际使用 Coding Agent 的过程中，又碰到了另一个更麻烦的问题。

## “认真修复”很容易变成“再加一层”

一个功能已经存在旧实现，我让 Agent 修问题时，它经常选择最保守的路线：保住原来的代码，再增加一个判断、一个 helper、一个 wrapper、一个 fallback，或者再建一套兼容入口。

第一次修改通常可以工作。

下一次 Agent 再进入项目，上一轮补丁已经成了“现有代码”。模型继续模仿这个结构，再往旁边加一层。重复几次以后，一个简单功能可能同时留下旧函数、新函数、兼容入口、fallback，以及专门处理前几轮补丁留下问题的逻辑。

每一个局部改动都能解释。

整个系统却越来越难解释。

用程序员常见的调侃来说，再修几轮，Bug 已经快能凭资历转正成 Feature 了。

2026 年的 SlopCodeBench 正好把这种长期问题从一次性代码生成中拆了出来。它让 Agent 在不断变化的需求下反复扩展自己上一轮生成的代码，而不是每轮重新得到一份整理干净的起点。研究中的 11 个 Agent 没有任何一个完整解决整条长期任务轨迹；在 80% 的轨迹中结构侵蚀增加，在 89.8% 的轨迹中冗余度增加，Agent 代码与 48 个真实 Python 开源仓库相比平均达到 2.2 倍的 verbosity。

更关键的是，单独加强 Prompt 没有阻止这种退化。

**原文：**

> “A prompt-intervention study shows that initial quality can be improved, but it does not halt degradation.”

**译文：**

> “Prompt 干预能够改善最初的代码质量，但无法阻止后续退化。”

这和我的实际感受很接近。

“仔细检查”“尽量保持兼容”“不要破坏原有功能”“优先最小修改”单独看都合理。它们组合在长期维护中，却很容易让 Agent 形成一种安全策略：已有代码尽量不动，新的问题继续往旁边补。

测试通过了。

技术债也留下来了。

## Agent 已经越来越会执行重构，却还不太会主动发现该删什么

CodeTaste 在 2026 年进一步测试了另一个区别：明确告诉 Agent 要怎样重构，与只告诉它“这里需要改善”，结果差得非常大。

在详细规定重构方向的情况下，模型最高达到 69.6% alignment；只提供一个模糊改善区域，让 Agent 自己找到人类开发者实际采用的重构方案时，最佳直接结果只有 7.9%。

CodeTaste 项目给出的概括很直接：

> “While models reliably execute well-specified instructions, they fail to autonomously identify human-aligned refactorings when given only a vague focus area.”

**译文：**

> “模型能够可靠执行定义清楚的重构指令，但只给出模糊改善范围时，它们难以自主找到与人类开发者一致的重构方案。”

这解释了“会写代码”和“知道什么代码已经不该存在”之间的差距。

新增一个 wrapper 很容易验证：新测试通过就行。

删除一个旧 wrapper 需要知道有没有其他调用者、新实现是否已经完整覆盖、有没有隐藏兼容行为、文档和配置是否仍然引用它。删除依赖的是系统级判断。

2026 年另一项针对 Agentic Coding 的研究甚至直接研究了哪些 AI 新增方法会在 Pull Request review 中被删除，并训练模型预测这些最终不需要的方法，得到 87.1% 的 AUC。“生成更多代码”已经不再天然等于“完成更多工作”。

## 更快生成，也会更快积累技术债

这个现象并不限于某一个 benchmark。

2026 年发表在 ACM TOSEM 的一项多声部文献综述分析了 104 份正式研究和灰色文献，并把 LLM 辅助开发带来的问题放进传统技术债框架中。研究认为，LLM 经常放大代码债、设计债和文档债，同时还产生快速集成等新的债务形式。

**原文：**

> “We find that LLMs often amplify traditional forms of technical debt, particularly code, design, and documentation debts, while also introducing new LLM-specific debts.”

**译文：**

> “我们发现，大语言模型经常放大传统形式的技术债，尤其是代码债、设计债和文档债，同时还会产生新的 LLM 特有债务。”

生成代码越来越便宜以后，“把代码写出来”正在失去它过去在软件工程中的稀缺性。

架构一致性、删除旧实现、测试、验证和长期维护开始占据更大的比重。

OpenAI 自己的 Codex 实验也碰到了同样的问题。Agent 会复制仓库里已经存在的模式，包括那些并不理想的模式；团队一度把每周五、约占一周 20% 的工程时间用来清理所谓的 “AI slop”，后来才把架构原则和定期重构任务编码进系统。

**原文：**

> “Codex replicates patterns that already exist in the repository—even uneven or suboptimal ones.”

**译文：**

> “Codex 会复制仓库里已经存在的模式，包括那些不一致或者并不理想的模式。”

这句话也说明了为什么一次坏补丁会持续产生影响。

Agent 下一轮看到的“最佳实践”，很可能就是上一轮 Agent 自己留下来的东西。

## Pagekiln 2.0 为什么开始删东西

Pagekiln 2.0 最近这次重构，正好经历了同样的问题。

之前项目根目录的 `AGENTS.md` 大约有 10 KB，目录职责、Pattern、Block、构建、部署、测试和 Agent 工作方式都放在里面。当前版本已经缩到约 2.7 KB，只留下项目边界、发现入口、修改原则和验证方式。

与此同时，项目把能力发现放进真正能够执行的接口。现在 `pagekiln catalog` 直接根据源码生成当前主题和扩展能力，不需要为了查看能力先完整构建 `dist/`；`pagekiln inspect` 可以按 `page:`、`block:`、`pattern:`、`collection:` 和 `plugin:` 查询局部事实。

`pagekiln init` 也不再在 CLI 文件中硬编码另一套 Starter，而是直接复制仓库里的 `starter/`。

这些改动表面上增加了几个 CLI 能力，真正发生的事情却是**删除重复事实源**。

有了真实 `starter/`，CLI 里另一套 Starter 就没有继续存在的必要。

有了 `catalog` 和 `inspect`，`AGENTS.md` 就不需要再复制完整 Pattern、Block 和 Schema 清单。

项目已经能通过 `check` 报告契约错误以后，也没有必要继续依赖一段越来越长的提示告诉 Agent “千万不要弄错”。

Pagekiln 仍然保留 Agent Instructions，但它不再承担 Pagekiln 百科全书的职责。

这比继续制作一个更大的 Pagekiln Skill 更符合我现在对 Agent 的使用方式。

## 现在更需要告诉 Agent：新增以后，什么应该消失

我的 Coding Agent 提示也因此开始变化。过去更容易写：

```text
实现这个功能。
保持现有功能兼容。
尽量不要破坏原来的结构。
完成以后运行测试。
```

现在我更在意另一部分：

```text
先确认现有实现和职责。
实现目标功能。
检查新实现是否取代了旧路径。
删除已经失去职责的代码、重复 helper 和兼容层。
不要为了保留旧实现再增加第二套实现。
完成后重新运行完整测试，并确认删除没有留下引用。
```

这仍然是一段 Prompt，但它解决的已经不是“怎样让模型变聪明”。

它定义的是工程完成标准。

Skill 也可以保存这套流程，但前提是它已经成为反复出现的工作方式。对于一次性的修改，让 Agent 直接读取代码、执行任务和验证结果更简单；对于持续重复的团队流程，再把“检查—修改—验证—删除—再次验证”固化成 Skill。

模型越来越强以后，真正值得学习的东西因此发生了迁移。

Prompt 的重点从措辞技巧移向任务定义。

Skill 的重点从能力扩展移向重复工作流。

Coding Agent 的重点从“能不能生成代码”进一步移向“连续迭代之后还能不能留下一个容易理解的项目”。

而在实际维护中，我越来越重视一个过去很少写进 Prompt 的问题：

**这次修改完成以后，哪些东西已经没有继续存在的理由？**

代码生成越来越廉价之后，删除、整理和验证反而变得更贵，也更重要。

# 引用与线上资料

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

10. CodeTaste 官方项目页
    https://codetaste.logicstar.ai/

11. Watanabe et al. — *What to Cut? Predicting Unnecessary Methods in Agentic Code Generation*
    https://arxiv.org/abs/2602.17091

12. Ehsani et al. — *Faster Code, Deeper Debt? A Multivocal Literature Review on Technical Debt and Its Early Signs in LLM-Assisted Software Development*
    https://doi.org/10.1145/3820165

13. Pagekiln
    https://github.com/jsw-teams/pagekiln

14. Pagekiln — *Fix Pages deployment and discovery contracts*
    https://github.com/jsw-teams/pagekiln/commit/752f669c7edb7ee84e9459679b339bc0dd814da6
