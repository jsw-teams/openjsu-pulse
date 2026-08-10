---
title: Turn current content into a product site
description: Write current site pages and dated product notes; the theme supplies structure while the compiler generates localized static delivery.
pattern: landing
---

:::hero{tone="brand" align="left"}
*PAGEKILN CONTENT COMPILER*

# Write the current page. Keep the history.

Pagekiln keeps current site content and dated product history in one project. `pages` answers how the site works now; `posts` preserves what changed on a date.

[Read the content contract](/en/guide/) [See the theme boundary](/en/development/)
:::

:::compiler-board
### Current pages
Put the home page, product information, Guide, Reference, and directories in `content/pages/`. These files describe the site's current effective information. When Pagekiln behavior changes, update the corresponding page.

### Dated product notes
Put completed decisions, implementations, releases, incidents, and deployment records in `content/posts/`. Every Product Note has a required date and enters the dated archive and Feed; it is not the current usage manual.

### Compose structure
Patterns decide the page frame, Blocks provide reusable sections, and Frontmatter holds schema data. `docs` is a presentation Pattern for a page in `pages`, not a third collection.
:::

:::feature-grid{columns="3"}
### Current pages
`pages` stores the current effective site content. Home, About, Guide, and Reference pages are updated when the implementation they describe changes.

### Product notes
`posts` stores dated records of changes that already happened. The required date drives the archive and Feed, while the current instructions remain in `pages`.

### Docs Pattern
`docs` only controls document presentation. For example, `content/pages/guide/en.md` remains a `pages` entry with `pattern: docs`.
:::

## Choose the content boundary

| Need | File entry | Result |
| --- | --- | --- |
| Explain how Pagekiln works now | `content/pages/<id>/<locale>.md` | Current page in the locale route |
| Record why a change happened on a date | `content/posts/<id>/<locale>.md` | Dated Product Note, archive, Feed, and search entry |
| Present a current page as documentation | `content/pages/<id>/<locale>.md` with `pattern: docs` | A docs-shaped `pages` page, not a new collection |
| Change structure or visual language | `themes/default/theme.ts`, `theme.yml`, `style.css` | Theme-owned Patterns, Blocks, and styles |
| Change site metadata or capability switches | `config.yml` | Site metadata, locales, routes, and feature settings |

## What is already part of the project

Markdown tables, excerpt boundaries, locale fallback, note covers, a sitemap, an RSS Feed, local search, 404, OG images, and deployment files are built-in outputs. When a site needs a new visual, read the theme catalog before adding code.

:::post-list{limit="3"}
:::

:::cta{href="/en/guide/"}
## Start with the page your visitor needs now

Put current usage in `content/pages/`. Put a dated explanation of a completed change in `content/posts/`, run the check, and let the theme decide how the content should look.
:::
