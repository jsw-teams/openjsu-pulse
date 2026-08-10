---
title: 让 Pagekiln 自己说明自己
description: 记录把 Pagekiln 能力发现移入 CLI、catalog、inspect 和真实 Starter 文件的变更。
date: 2026-08-10
cover: /assets/product-note-cover.webp
pattern: blog
tags: [agent, discovery, cli]
---

# 让 Pagekiln 自己说明自己

这篇笔记记录 2026-08-10 完成的发现契约变更。这是一篇关于已完成架构决定的产品笔记；当前命令和内容规则以[Guide](/zh-sg/guide/)和[二次开发](/zh-sg/development/)为准。

在这次变更之前，Agent 需要从较长的 `AGENTS.md` 了解许多也存在于源码中的项目事实。重复事实可能与 CLI 和实际 Starter 产生漂移，使操作约束文件承担了超出边界的权威。

<more>

## 能力移入产品本身

Pagekiln 现在通过公开 CLI 和生成的发现文件提供基于源码的能力信息：

- `pagekiln catalog` 读取当前配置、内容、主题 Pattern、Block、schema、插件和资源依赖，不要求完整构建。
- `pagekiln inspect` 支持内容查询，以及明确的 `page:`、`block:`、`pattern:`、`collection:` 和 `plugin:` 命名空间；找不到对象时返回稳定的结构化错误。
- `starter/` 是 `pagekiln init` 实际复制的文件模板；CLI 不再维护另一套硬编码 Starter。
- `AGENTS.md` 保留操作边界和验证规则，不再重复整套实现说明。

源码文件仍然是事实来源：`config.yml`、`content/` 和 `themes/` 描述项目；`catalog` 和 `.well-known/agent.json` 是从这些源码生成的发现视图。这样把源码事实与生成发现分开，不需要增加另一套内容系统。

## 没有专用 Skill 时 Agent 仍能完成什么

现代 Coding Agent 可以先运行 `catalog` 发现项目，再 inspect 相关页面、Block、Pattern、collection 或 plugin，修改源码，运行 `check`，最后运行 `build`。Pagekiln 不要求专用 Pagekiln Skill 才能正确执行这套操作。

Skill 仍然可以压缩已知工作流、提供提醒或协调较大的任务。它是可选的工作流辅助，不是使用 Pagekiln 的前提。

## 结果

这次变更让 CLI 和它操作的文件说明同一组能力。未来行为变化时，应同步更新源码契约和当前文档；新增发现视图时，应从源码生成，而不是复制到另一份说明书。
