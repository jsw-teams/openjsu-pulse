---
title: Why current pages and Product Notes are separate
description: A dated record of the 2026-08-08 decision to separate current documentation from product history.
date: 2026-08-08
cover: /assets/product-note-cover.webp
pattern: blog
tags: [content, collections]
---

# Why current pages and Product Notes are separate

This note records the 2026-08-08 decision to separate current documentation from the product timeline. Current operation belongs in the [Guide](/en/guide/) and [Development](/en/development/); this note preserves the decision context and is not a second usage manual.

The two content types answer different questions: current pages tell readers how Pagekiln works now, while Product Notes preserve how Pagekiln became this version.

<more>

## The decision recorded here

`pages` stores the site's current effective content: the home page, About, Guide, Reference, and directories. When the implementation changes, the relevant page changes with it. A `docs` Pattern changes presentation inside `pages`; it is not a separate `docs` collection.

`posts` stores dated records of completed decisions, implementations, releases, incidents, deployments, and measured results. The required date places each Product Note in the archive and Feed. The original note keeps its historical context; a later change gets a new note rather than silently rewriting the old one into a current guide.

## Why the timeline has its own collection

The separation lets the home page and Guide answer the current question without carrying a changelog in every paragraph. The archive and Feed answer the chronological question without becoming an alternative source for current instructions.

The body before `<more>` supplies the archive excerpt. The boundary is optional, while the Product Note date is required. The `blog` Pattern owns the note's cover, date, language switcher, outline, and related-note presentation.

When the current operation changes, follow the [current Guide](/en/guide/) and [Secondary development](/en/development/). This historical record remains evidence of the 2026-08-08 content decision.
