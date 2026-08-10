---
title: Making Pagekiln self-describing
description: A dated record of moving Pagekiln capability discovery into the CLI, catalog, inspect, and real Starter files.
date: 2026-08-10
cover: /assets/product-note-cover.webp
pattern: blog
tags: [agent, discovery, cli]
---

# Making Pagekiln self-describing

This note records the 2026-08-10 discovery-contract change. It is a Product Note about a completed architecture decision; current commands and content rules belong in the [Guide](/en/guide/) and [Development](/en/development/).

Before this change, an Agent had to read a long `AGENTS.md` for project facts that were also present in code. Repeated facts could drift from the CLI and from the actual starter project, so the instruction file was carrying more authority than an operational boundary should carry.

<more>

## What moved into the product

Pagekiln now exposes its source-backed capabilities through the public CLI and the generated discovery files:

- `pagekiln catalog` reads the active configuration, content, theme Patterns, Blocks, schemas, plugins, and resource dependencies without requiring a complete build.
- `pagekiln inspect` supports content lookup and explicit `page:`, `block:`, `pattern:`, `collection:`, and `plugin:` namespaces, with a stable structured not-found error.
- `starter/` is the actual file template copied by `pagekiln init`; the CLI does not maintain a second hard-coded starter.
- `AGENTS.md` keeps operational boundaries and verification rules instead of duplicating the whole implementation description.

The source files remain the authority: `config.yml`, `content/`, and `themes/` describe the project. `catalog` and `.well-known/agent.json` are discovery views generated from that source. This separates source truth from generated discovery without adding another content system.

## What an Agent can do without a dedicated Skill

A modern Coding Agent can discover the project with `catalog`, inspect the relevant page, Block, Pattern, collection, or plugin, edit the source files, run `check`, and then run `build`. Pagekiln does not require a Pagekiln-specific Skill for that operation to be correct.

A Skill can still compress a known workflow, provide reminders, or coordinate a larger task. It remains optional workflow support, not a prerequisite for using Pagekiln.

## Result

The change makes the CLI and the files it operates on explain the same capabilities. A future behavior change should update the source contract and its current documentation; a new discovery view should be generated from that source instead of copied into a second instruction manual.
