---
title: "Research: how each tool organizes content"
description: Compare official entry paths with Pagekiln's current theme and site-configuration boundaries.
pattern: docs
---

# Research: how each tool organizes content

This page does not turn “best tool” into a single score. It answers a practical question: what does each project ask me to maintain, where does page structure begin, and when do I enter a theme or component code? Speed is measured separately with fixed versions, a fixed fixture, and a complete command; this page does not fill cells with estimates.

## One boundary table

| Tool | Official content entry | Official extension entry | Main maintenance surface |
| --- | --- | --- | --- |
| Astro | `src/pages/`, Markdown, Content Collections | `.astro` pages, layouts, integrations | Page components, collection schemas, integrations |
| Eleventy | Markdown and template files | Liquid, Nunjucks, shortcodes, Data Cascade | Template language, data cascade, collections, assets |
| Hugo | `content/`, Front Matter, Markdown | `layouts/`, shortcodes, resource processing | Content tree, sections, template lookup, i18n |
| VitePress | Markdown under `docs/` | Vue theme and Vue components in Markdown | Vue theme, document navigation, client behavior |
| Docusaurus | Markdown/MDX under `docs/`, `src/pages/` | React theme, plugins, MDX | Docs, sidebar, version, i18n, React components |
| Pagekiln | `content/pages/`, `content/posts/`, Frontmatter, GFM | Patterns, Blocks, `theme.ts`, `style.css`, and nested plugins in `themes/<name>/` | Markdown files, theme directory, site config |

Pagekiln is not trying to reproduce every ecosystem. It places common product-content needs in the core: collection routes, three locales, excerpts, covers, the archive, a Feed, sitemap, local search, 404, OG images, and static deployment files. A new page shape starts in the theme.

## Pagekiln's content contract

The project has two content collections. `pages` stores current effective site content; update a page when the behavior it describes changes. `posts` stores dated records of completed decisions, implementations, releases, incidents, deployments, and measured results; `date` is required, and the archive and Feed form its timeline. `docs` is a Pattern inside `pages`, not a collection. Current usage belongs in `content/pages/`; a record of why a change happened belongs in `content/posts/`.

## Astro: page files and content collections

Astro's [official Pages documentation](https://docs.astro.build/en/basics/astro-pages/) says that files in `src/pages/` own routing and supports `.astro`, Markdown, MDX, HTML, and endpoint files; layouts are the normal way to reuse a document shell. [Content Collections](https://docs.astro.build/en/guides/content-collections/) describes local Markdown/MDX collections, loaders, entry data, and schemas. The [internationalization guide](https://docs.astro.build/en/recipes/i18n/) describes using collections and dynamic routes to organize translations.

That official path suits sites that need components and integrations. With Pagekiln, the maintenance surface becomes `content/<collection>/<id>/<locale>.md` plus the theme contract; the body stays CommonMark/GFM and ordinary pages do not hydrate.

## Eleventy: templates, data, and collections

The [Eleventy home page](https://www.11ty.dev/) starts with Markdown and template languages and demonstrates collection output. [Data Cascade](https://www.11ty.dev/docs/data-cascade/) explains how template, directory, content, and global data combine. [Collections](https://www.11ty.dev/docs/collections/) explains grouping content for lists.

That official path gives the project freedom through template languages and data cascade. With Pagekiln, a project does not need to redefine page identity, translation groups, the product-note archive, and the search index for every site; a different visual language is a theme choice.

## Hugo: content tree, sections, and languages

Hugo's [content formats documentation](https://gohugo.io/content-management/formats/) says Markdown is the default content format and documents Front Matter and other formats. [Sections](https://gohugo.io/content-management/sections/) explains how top-level content directories and `_index.md` create sections, list pages, and template selection. [Multilingual mode](https://gohugo.io/content-management/multilingual/) documents filename language suffixes, translation links, language resources, and fallback behavior.

That official path suits sites where the content tree, sections, and resource features are central. With Pagekiln, collections and routes live in `config.yml`, filenames directly form locale and id, and the theme owns presentation.

## VitePress: Markdown as a Vue component

VitePress's [Getting Started guide](https://vitepress.dev/guide/getting-started) starts with Markdown under `docs/` and a Vue-oriented theme, with sections for Markdown, deployment, themes, and i18n. [Using Vue in Markdown](https://vitepress.dev/guide/using-vue.html) explicitly says that Markdown is compiled to HTML and then processed as a Vue Single-File Component; pages can import Vue components and add scripts.

That official path suits a documentation site whose theme boundary is Vue. With Pagekiln, the body remains CommonMark/GFM; interaction appears only in an explicit theme script, and static pages do not carry a framework runtime by default.

## Docusaurus: docs, sidebars, versions, and React

Docusaurus's [installation guide](https://docusaurus.io/docs/installation) shows `docs/`, `blog/`, `src/pages/`, and a static directory. [Create a doc](https://docusaurus.io/docs/create-doc) explains Markdown under `docs/`, with Front Matter and folder structure affecting ids, URLs, and sidebars. The [i18n introduction](https://docusaurus.io/docs/i18n/introduction) explains locale directories, theme translations, plugin translations, and hreflang goals.

That official path suits a documentation portal that needs docs sidebars, versions, and a React/MDX ecosystem. With Pagekiln, product pages and product notes use two explicit collections; content needs stay in the core and theme work does not require compiler edits.

## What Pagekiln actually maintains

```text
content/       human-readable pages, product notes, and assets
themes/        page structure, Blocks, i18n.yml, style.css, native ESM
config.yml     site information, collections, routes, locales, switches
backend/       dynamic logic that needs requests, secrets, writes, webhooks
```

The shortest verification path after a change is:

```bash
pagekiln check
pagekiln g --profile
npm run catalog
```

`catalog` is a source-backed capability directory, not a content page. It reads the active config, content, and theme without rendering the site or requiring `dist/`. `inspect` keeps content-id lookup and also exposes local namespaces such as `block:<id>`, `pattern:<id>`, `collection:<id>`, and `plugin:<id>` as structured JSON.

## How to read a performance comparison

Hugo, Eleventy, and Pagekiln timing must use the same machine, input, version, and output contract. Comparing only CLI cold start omits sitemap, search, 404, Feed, and deployment files; adding them back changes the measurement boundary. The repository keeps `scripts/benchmark.mjs` and `scripts/benchmark-compare.mjs` as local tools. It does not turn one run into a product promise or publish a temporary JSON report into `dist/`.

## Choosing a starting point

- Choose Astro, VitePress, or Docusaurus when their component ecosystem is the required authoring surface.
- Study Hugo first when a deep content tree, sections, taxonomies, or resource processing is central.
- Study Eleventy when template-language freedom and Data Cascade are the main requirement.
- Choose Pagekiln's theme-first path when product content should remain Markdown while collections, locales, search, archives, and static delivery already have defined boundaries.
