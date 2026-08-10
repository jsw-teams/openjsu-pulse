---
title: Write current pages and dated Product Notes
description: Put current Pagekiln usage in pages and completed product changes in dated posts.
pattern: docs
---

# Write current pages and dated Product Notes

Pagekiln has two content collections with different responsibilities. `pages` stores the site's current effective information. `posts` stores dated records of changes that already happened. When Pagekiln behavior changes, update the relevant page; record the change in a new Product Note when it belongs in the history.

:::pipeline
### Write a current page
Put Frontmatter and ordinary Markdown in `content/pages/home/en.md`. Home, About, Guide, Reference, and directory pages belong to `pages` when they describe the site as it works now.

### Record a completed change
Put a Product Note in `content/posts/<id>/<locale>.md`. Its `date` field is required. The note records one decision, implementation, release, incident, deployment, or measured result; it is not a replacement for the current Guide.

### Run the check
`pagekiln check` validates fields, Patterns, Blocks, route collisions, and Markdown source positions. Missing required fields point to the source file, line, and column.

### Preview locally
`pagekiln s` serves `http://127.0.0.1:4173/`. A content change refreshes affected outputs while the browser still receives static HTML.

### Generate the site
`pagekiln g --profile` writes `dist/` and records build phases, changed outputs, and image-cache hits.
:::

## Where content lives

```text
content/
├─ pages/<id>/<locale>.md       current site content
├─ posts/<id>/<locale>.md       dated Product Notes
└─ assets/                      OG images, covers, and other resources
```

`docs` is a Pattern, not a collection. For example, `content/pages/guide/en.md` is a `pages` entry with `pattern: docs`.

## Choose between pages and posts

| Content | Current document page | Product Note |
| --- | --- | --- |
| Purpose | Describe how Pagekiln works now | Record what changed on a date |
| Collection | `pages` | `posts` |
| Time relationship | Current state | Chronological history |
| After behavior changes | Update the existing page | Keep the old note and add a new note for the new change |
| Date | Not part of page identity | Required Frontmatter field |
| Feed / archive | Does not enter the Product Note timeline | Enters the archive and Feed automatically |
| Pattern | `document`, `docs`, or another page Pattern | `blog` by default |

If you are writing current usage instructions, use `content/pages/`. If you are recording why catalog changed today, use `content/posts/` and add the date.

## A current document page

This example answers what the current build does, without a historical event date:

```markdown
---
title: Local search
description: How the current Pagekiln build creates the local search index and labels matches.
pattern: docs
---

# Local search

Pagekiln currently creates a static search index for each locale. The browser ranks title, description, heading, body, and path matches, then labels the matching location and highlights the matched text.
```

When that behavior changes, update this page so it remains the current explanation.

## A dated Product Note

This example records one completed change rather than describing the current feature contract:

```markdown
---
title: Search results gained hit locations
description: Record the 2026-08-10 change that added visible hit-location labels.
date: 2026-08-10
pattern: blog
---

# Search results gained hit locations

This note records the completed change that added a visible title, summary, section, content, or path label to each matching result.

<more>

The current search behavior belongs in the Guide. This note keeps the decision and implementation context for the dated archive.
```

The `date` is required. A cover and `<more>` excerpt boundary are optional.

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

The project enables `zh-sg`, `zh-tw`, and `en`. Three files with the same id form one translation group:

```yaml
defaultLocale: en
activeLocales: [zh-sg, zh-tw, en]
```

The product-note title area contains the single language switcher. It displays “简体中文”, “繁體中文”, and “English”, rather than internal codes. Theme UI messages live in `themes/<name>/i18n.yml`, outside the site-operations config; missing messages use the theme's `fallbackLocale` while preserving `lang`, canonical, and `hreflang` metadata.

## What the build writes

- `feed.xml`: a bounded Product Note subscription list ordered by date.
- `sitemap.xml`: the sitemap, including translated-page relationships.
- `llms.txt`: the first site entry point for an Agent; `llms-full.txt` provides sharded page summaries and full-content links.
- `pagekiln catalog`: the source-backed capability catalog for the active theme, including Patterns, Blocks, schemas, plugins, and dependencies; it does not require a full build.
- `pagekiln inspect block:<id>` / `pattern:<id>` / `collection:<id>` / `plugin:<id>`: structured local capability queries; a bare id still queries content.
- `.pagekiln/catalog.json`: the generated discovery copy emitted during a normal build.
- `site.webmanifest`, OG images, 404, and deployment files for browsers, sharing, and static hosting.

## Cookie and accessibility behavior

The `privacyConsent` theme plugin and the site-level `config.yml` switch control Cookie consent. Essential categories stay enabled and optional categories start off; optional scripts are not inserted before a visitor chooses. Human visitors can reopen the settings from the footer. Machines read `/.well-known/agent.json`, so the two entry points remain separate. The site also provides a skip link, visible focus, semantic headings, mobile table labels, and a no-motion default with reduced-motion scroll handling.

## Next step

Run `pagekiln check`, then `pagekiln s`. To generate a publishable `dist/`, run `pagekiln g`; to change page structure, read [Secondary development](/en/development/); to understand adjacent tools' documented authoring paths, read [Research and boundaries](/en/about/).
