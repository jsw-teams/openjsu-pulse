---
title: Turn content into a product site
description: Write readable Markdown for pages and product notes; the theme supplies structure while the compiler generates localized static delivery.
pattern: landing
---

:::hero{tone="brand" align="left"}
*PAGEKILN CONTENT COMPILER*

# Write content. Stop copying pages.

Pagekiln keeps pages, product notes, and theme structure in one project. Common site needs come from the core; visual language and page structure start in the theme.

[Start with one Markdown page](/en/guide/) [See the theme boundary](/en/development/)
:::

:::compiler-board
### Write content
Put the home page, product pages, and guides in `content/pages/`. Put dated updates in `content/posts/`. The path already describes the content identity and locale.

### Compose structure
Patterns decide the page frame, Blocks provide reusable sections, and Frontmatter holds page data. The body stays headings, prose, tables, and links.

### Produce delivery files
One build creates three locale routes, static HTML, a product-note archive, a Feed, a sitemap, and a local-search index. Pages do not need a browser framework to load.
:::

:::feature-grid{columns="3"}
### General pages
The `pages` collection covers the home page, product information, guides, and directories. It is for durable information rather than dated entries.

### Product notes
Release changes, design decisions, and investigations live in `posts`. Dates, excerpts, covers, translations, the archive, and the Feed follow the collection.

### Theme development
Start a new page section in `themes/<name>/`. Collections, routes, localization, image caching, and deployment output stay in the core, so authors do not repeat them.
:::

## Read the file boundaries first

| Need | File entry | Result |
| --- | --- | --- |
| Write the home or a product page | `content/pages/<id>/<locale>.md` | General page and locale route |
| Record a product decision or update | `content/posts/<id>/<locale>.md` | Note, archive, Feed, and search |
| Change structure or visual language | `themes/default/theme.ts`, `theme.yml`, `style.css` | Theme-owned Patterns, Blocks, and styles |
| Change site metadata or capability switches | `config.yml` | Site metadata, locales, routes, and feature settings |
| Help an Agent locate a capability | `.pagekiln/catalog.json`, `AGENTS.md` | Structured capability and file navigation |

## What is already part of the project

Markdown tables, excerpt boundaries, locale fallback, note covers, a sitemap, an RSS Feed, local search, 404, OG images, and deployment files are built-in outputs. When a site needs a new visual, read the theme catalog before adding code.

:::post-list{limit="3"}
:::

:::cta{href="/en/guide/"}
## Write one real page first

Put a product explanation or decision in Markdown, run the check, and let the theme decide how the content should look.
:::
