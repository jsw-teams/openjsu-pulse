---
title: Why product notes are their own collection
description: Keep changing product decisions in posts so general pages can stay stable.
date: 2026-08-08
cover: /assets/product-note-cover.webp
pattern: blog
tags: [content, collections]
---

# Why product notes are their own collection

Pagekiln's home and guide explain stable usage. Product notes record decisions that are still moving. When both kinds of content share one list, a page has to act as product introduction, update log, and archive at once, so readers cannot tell which statement is current.

<more>

## The file boundary I keep

General pages live in `content/pages/<id>/<locale>.md`. Product notes live in `content/posts/<id>/<locale>.md`; dates order them and the collection connects the archive, Feed, and local search.

## The excerpt comes from the body

The list excerpt ends at `<more>`. Without that boundary, the compiler takes a readable excerpt from the body, so the archive does not collapse into title-only rows.

## The theme owns presentation

The `blog` Pattern provides the cover, date, language switcher, outline, previous and next notes, and related notes. When I change that structure, I work in the theme instead of copying HTML into every note.
