---
title: Do we still need to learn prompts and Skills as models get stronger?
description: A 2026 view of models, Coding Agents, Skills, Pagekiln 2.0, and the technical debt that appears after code generation becomes cheap.
date: 2026-08-11
pattern: blog
tags: [ai, agent, prompt, skill, pagekiln]
---

# Do we still need to learn prompts and Skills as models get stronger?

When large models entered everyday work, learning prompt techniques seemed unavoidable. A small change in wording could change the answer, so phrases such as “act as a senior engineer”, “reason step by step”, and “check for omissions” became common. Those one-off prompts then expanded into system prompts, custom instructions, project files, and Agent Skills. People began telling the model not only what to do, but also how to walk through the task.

That division is changing in 2026.

Coding Agents can now inspect a directory, search code, read configuration, run commands, inspect failed tests, and continue from the result. OpenAI’s GPT-5.6 guidance describes a related change: users often do not need to prescribe every step, but still need to provide domain context, hard constraints, authorization boundaries, and a definition of done.

**Source:**

> “GPT-5.6 can better infer the user’s underlying goal and intended level of work from context, so you often do not need to prescribe every step.”

That changes the learning order. A normal user does not need to master Prompt Engineering before using a model, and an individual developer does not need to write a large Skill for every project. The more important ability is to state the goal, available material, constraints, and completion criteria, then verify that the task was actually completed.

<more>

## Prompts are not gone; prompt incantations are losing value

A model finding its own execution path does not make an underspecified request reliable.

A 2026 study of prompt sensitivity compared insufficient information with specific instructions and found higher performance variance in the underspecified prompts. “Do something modern with this website” is still missing information. “Redesign the home page, keep the three locales and URLs, add no front-end framework, preserve mobile navigation, and run the existing tests” is not a complicated prompt, but it states the important work boundary.

That task-definition ability is more valuable to learn now. Prompts remain the task entrance, but they do not need to carry an entire workflow or hide a secret activation phrase.

## When AGENTS.md becomes a table of contents again

OpenAI’s February 2026 Codex engineering experiment provides a concrete example. A small team used Codex for application code, tests, CI, documentation, observability, and internal tools; after five months the project reached roughly one million lines and about 1,500 merged pull requests.

The relevant lesson is how the team managed project knowledge. They tried putting many rules into a huge `AGENTS.md` and found that context itself had become scarce.

**Source:**

> “Context is a scarce resource.”

They later treated structured repository documentation as the factual source and kept `AGENTS.md` as a guide to where facts live. Their summary was:

> “So instead of treating `AGENTS.md` as the encyclopedia, we treat it as the table of contents.”

This is not an argument that every prompt should be short. It removes information that is unrelated to the current task. An Agent changing navigation does not need to reread deployment, database, benchmark, every theme Block, and every historical compatibility rule. A discoverable repository lets the Agent fetch the relevant context when it is needed.

## Skills move from capability packs to repeated workflows

Skills have not disappeared. OpenAI describes a Skill as a reusable, shareable workflow that makes a specific task more consistent.

That definition matches the practical use. The first time an Agent checks a website for accessibility, there is no need to create a `SKILL.md` first. When a team repeatedly checks keyboard navigation, ARIA, mobile tables, reduced-motion behavior, and a fixed test set before every release, the repeated workflow is worth saving.

A Skill should come from work that already repeats, not from manufacturing a complicated workflow just to have a Skill. GitHub’s Agent Skills work also makes Skills more like managed engineering resources: they may be discovered, installed, updated, pinned, shared across hosts, and may contain scripts. That creates a security boundary. GitHub warns users to inspect Skill contents for prompt injection, hidden instructions, and malicious scripts. A Skill that can change Agent behavior and execute code should be managed more like a dependency than a copied “universal prompt”.

## Agents start finding the capability they need

Loading every tool and Skill into context at once is also losing appeal. GitHub’s Agent Finder work describes the problem of manually wiring every MCP server, Skill, Agent, and tool until the context window is full. The alternative is to query a capability directory for the natural-language task and load only what is needed.

This is the opposite of “large prompt + large Skill + every tool preloaded”: understand the task first, then find the information required to complete it. The optimization target is therefore information-acquisition cost, not prompt length.

A project with no discoverable facts forces an Agent to list directories, search configuration, scan themes, guess entry points, and infer structure from build errors. That still spends context. A better project exposes its facts and lets the Agent read only the relevant part.

## A good prompt cannot repair a bad information environment

Agent quality is increasingly difficult to attribute only to the model and prompt. Anthropic’s February 2026 Terminal-Bench 2.0 analysis reported a several-point success-rate difference when the infrastructure resources changed while the model, harness, and task set stayed the same.

The repository is part of that environment. Without tests, the model has little feedback about correctness. If every error says only “Build failed”, it has to guess. If the same fact appears in code, README, Skill, and Agent Instructions, it must guess which copy is current.

These problems are not solved by adding “read carefully and do not miss anything” to the prompt.

## “Fix carefully” can become “add another layer”

When an old implementation already exists, an Agent often takes the most conservative route: keep the old code and add a condition, helper, wrapper, fallback, or compatibility entry. The first patch can work. On the next visit, that patch is now “existing code”, so the model copies the structure and adds another layer.

Each local change is explainable. The system becomes harder to explain.

SlopCodeBench studies this long-horizon problem by repeatedly extending code under changing requirements. The reported trajectories showed increasing structural erosion and redundancy, and stronger prompt instructions improved initial quality without stopping later degradation.

“Keep compatibility” and “make the smallest change” are individually sensible. Over many iterations they can become a safety strategy in which old code is never removed and new behavior is always added beside it.

## Agents can execute a refactor better than they can discover one

CodeTaste compared explicit refactoring instructions with a vague request to improve an area. Detailed directions aligned far more often with the refactoring humans chose; a vague focus area produced much lower direct alignment.

That is the difference between writing code and knowing which code should no longer exist. Adding a wrapper is easy to validate with a new test. Removing one requires checking callers, coverage by the replacement, hidden compatibility behavior, and documentation or configuration references.

“Generate more code” is no longer equivalent to “finish more work”.

## Cheaper generation can accumulate debt faster

A 2026 multivocal review in ACM TOSEM describes LLM-assisted development as amplifying code, design, and documentation debt while introducing LLM-specific debt. OpenAI’s Codex engineering report also describes Agents copying uneven or suboptimal patterns already present in the repository and the need for recurring cleanup and encoded architecture principles.

Once code generation is cheap, architecture consistency, deletion, tests, verification, and maintenance occupy a larger share of the work. The next Agent may treat the previous Agent’s patch as the best practice simply because it is there.

## Why Pagekiln 2.0 started deleting things

Pagekiln 2.0 faced the same problem. The old root `AGENTS.md` carried directory responsibilities, Patterns, Blocks, builds, deployments, tests, and Agent workflows. The current file keeps boundaries, discovery entry points, change principles, and verification instead of duplicating the whole project reference.

The project also moved capability discovery into executable interfaces. `pagekiln catalog` reads the current theme and extension capabilities from source without requiring a complete `dist/` build. `pagekiln inspect` queries `page:`, `block:`, `pattern:`, `collection:`, and `plugin:` facts. `pagekiln init` copies the repository’s real `starter/` instead of maintaining another Starter inside the CLI.

The visible result is a few more CLI capabilities. The important result is the deletion of duplicate sources of truth. Pagekiln still keeps Agent Instructions, but they are not an encyclopedia, and a larger Pagekiln Skill is not a prerequisite for using the project.

## Tell the Agent what should disappear after an addition

My Coding Agent instructions are changing from:

```text
Implement the feature.
Keep existing behavior compatible.
Avoid breaking the old structure.
Run the tests when finished.
```

to:

```text
Confirm the existing implementation and its responsibility.
Implement the target behavior.
Check whether the new path replaces an old path.
Delete code, duplicate helpers, and compatibility layers that have lost their responsibility.
Do not create a second implementation to preserve the old one.
Run the complete tests and confirm that deletion left no references.
```

That is still a prompt, but it defines an engineering completion standard rather than trying to make the model smarter. A Skill can preserve the workflow after it becomes repetitive; for a one-off task, direct inspection, execution, and verification remain simpler.

The useful learning has moved: prompts toward task definition, Skills toward repeated workflows, and Coding Agents toward leaving an understandable project after continuous iteration.

The question I now ask after a change is:

**What no longer has a reason to exist?**

As code generation gets cheaper, deletion, cleanup, and verification become more expensive—and more important.

## Sources

1. OpenAI — *Model guidance / GPT-5.6*
   https://developers.openai.com/api/docs/guides/latest-model
2. Pecher et al. — *Revisiting Prompt Sensitivity in Large Language Models for Text Classification*
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
8. Orlanski et al. — *SlopCodeBench*
   https://arxiv.org/abs/2603.24755
9. Thillen et al. — *CodeTaste*
   https://arxiv.org/abs/2603.04177
10. CodeTaste project
    https://codetaste.logicstar.ai/
11. Watanabe et al. — *What to Cut?*
    https://arxiv.org/abs/2602.17091
12. Ehsani et al. — *Faster Code, Deeper Debt?*
    https://doi.org/10.1145/3820165
13. Pagekiln
    https://github.com/jsw-teams/pagekiln
