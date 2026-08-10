---
title: Start with one Markdown page
description: Use Markdown, the theme contract, and site settings as three clear entry points for a checked build.
pattern: docs
---

# Start with one Markdown page

Pagekiln is for people who maintain product content over time. Write the content first and let the theme provide the page structure; keep site information and capability switches in `config.yml` instead of copying navigation, language, and SEO code into every page.

:::pipeline
### Write one page
Put Frontmatter and ordinary Markdown in `content/pages/home/en.md`. The home page, product information, and guides are general pages.

### Run the check
`pagekiln check` validates fields, Patterns, Blocks, route collisions, and Markdown source positions. Errors point to a file, line, and column.

### Preview locally
`pagekiln s` serves `http://127.0.0.1:4173/`. A content change refreshes affected outputs while the browser still receives static HTML.

### Generate the site
`pagekiln g --profile` writes `dist/` and records build phases, changed outputs, and image-cache hits.
:::

## Where content lives

```text
content/
├─ pages/<id>/<locale>.md       general pages
├─ posts/<id>/<locale>.md       product notes
└─ assets/                      OG images, covers, and other resources
```

For example, `content/posts/search/en.md` becomes the `search` product note in the `posts` collection. The `en` part of the name drives the locale route, date format, sitemap entry, and search index.

A page only needs Frontmatter and Markdown:

```markdown
---
title: How search points to a match
description: Record the input, ranking, and visible hit location.
pattern: docs
---

# How search points to a match

Search results label the match as a title, summary, section, content, or path hit and highlight the matching text.
```

A product note can add a date, cover, and excerpt boundary:

```markdown
---
title: A search interaction decision
date: 2026-08-09
cover: /assets/product-note-cover.webp
pattern: blog
---

This paragraph becomes the list excerpt.

<more>

The rest records the implementation.
```

## When to use a Block

Keep headings, lists, tables, code, and links in Markdown. Use a Block Directive only for a page section that needs stable reuse:

```markdown
:::feature-grid{columns="3"}
### Content entry
Every page file has a clear location.

### Page structure
Patterns and Blocks come from the theme.

### Output check
The generated files can be inspected.
:::
```

Directive attributes stay short and scalar. An unknown Block, invalid attribute, or missing context fails the build with a source position and a suggestion.

## How the three locales work together

The project enables `zh-sg`, `zh-tw`, and `en`. Three files with the same id form a translation group:

```yaml
defaultLocale: en
activeLocales: [zh-sg, zh-tw, en]
```

The product-note title area contains the single language switcher. It displays “简体中文”, “繁體中文”, and “English”, rather than internal codes. Theme UI messages live in `themes/<name>/i18n.yml`, outside the site-operations config; missing messages use the theme's `fallbackLocale` while preserving `lang`, canonical, and `hreflang` metadata.

## What the build writes

- `feed.xml`: a bounded product-note subscription list ordered by date.
- `sitemap.xml`: the sitemap, including translated-page relationships.
- `llms.txt`: the first site entry point for an Agent; `llms-full.txt` provides sharded page summaries and full-content links.
- `pagekiln catalog`: the source-backed capability catalog for the active theme, including Patterns, Blocks, schemas, plugins, and dependencies; it does not require a full build.
- `pagekiln inspect block:<id>` / `pattern:<id>` / `collection:<id>` / `plugin:<id>`: structured local capability queries; a bare id still queries content.
- `.pagekiln/catalog.json`: the generated discovery copy emitted during a normal build.
- `site.webmanifest`, OG images, 404, and deployment files for browsers, sharing, and static hosting.

## Cookie and accessibility behavior

The `privacyConsent` theme plugin and the site-level `config.yml` switch control Cookie consent. Essential categories stay enabled and optional categories start off; optional scripts are not inserted before a visitor chooses. Human visitors can reopen the settings from the footer. Machines read `/.well-known/agent.json`, so the two entry points remain separate. The site also provides a skip link, visible focus, semantic headings, mobile table labels, and a no-motion default with reduced-motion scroll handling.

## Next step

Run `pagekiln check`, then `pagekiln s`. To generate a publishable `dist/`, run `pagekiln g`; to change page structure, read [Secondary development](/en/development/); to understand each adjacent tool's documented authoring path, read [Research and boundaries](/en/about/).
