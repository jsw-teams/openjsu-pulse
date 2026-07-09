# Pagekiln

[简体中文 README](README.md)

<p align="center">
  <img src="content/assets/icon-192.png" alt="Pagekiln project icon" width="160">
</p>

Pagekiln is a Hexo-inspired static site and blog builder. The current stable
npm version is `1.1.0`. Site settings live in `config.yml`, posts and pages
live in `content/`, themes live in `themes/<name>/`, and generated output goes
to `dist/`.

The intent is simple: if you only want to publish content, edit `content/` like
a normal Markdown site; if you need customization, move into config, themes, and
builder extensions. Since `1.1.0`, the default starter stays neutral: it does
not force blog archives, categories, tags, or search pages. Those surfaces are
created by `content/pages` files and dynamic slots. The default theme still provides
reusable locales, posts, feeds, sitemap, robots, llms, agent discovery, consent
preferences, and optional third-party script loading.

## Quick Start

For a blog or regular content site, you do not need to learn theme development
first. Install pagekiln, initialize the site, update config and site identity
assets, then use `pagekiln s` for preview, `pagekiln g` for generation, and
`pagekiln c` for checks.

### How To Install pagekiln

Create a site directory and install Pagekiln:

```bash
mkdir my-site
cd my-site
npm i pagekiln
npx pagekiln init .
```

`pagekiln init` uses the neutral root project template bundled in the npm
package. The template does not include production or preview secrets. Forks and
downstream projects should set their own site name, `siteUrl`, analytics,
robots policy, deployment target, and environment configuration.

When debugging the Pagekiln framework repository itself, you can call the CLI
directly:

```bash
node src/bin/pagekiln.mjs init my-site
```

### How To Run pagekiln

Commands for Hexo users:

```bash
pagekiln s
pagekiln g
pagekiln c
```

- `pagekiln s` / `pagekiln server` maps to `hexo server` / `hexo s` and starts local live preview.
- `pagekiln g` / `pagekiln generate` maps to `hexo generate` / `hexo g` and writes `dist/`.
- `pagekiln c` / `pagekiln check` verifies `dist/`, theme assets, sitemap, content-driven feeds/search indexes, agent discovery, and WebMCP bootstrap.

Local preview:

```text
http://127.0.0.1:4173/
```

`pagekiln s` polls `content/`, `themes/`, and `config.yml` every 10 seconds. It
rebuilds only after detected changes. Build errors stay visible in the browser
and do not stop the preview process. Changes to
`content/pages/<slug>/index.<locale>.md` prefer page-level incremental output.

`pagekiln init` writes compatibility scripts such as `generate`, `server`, and
`check` into the new project's `package.json`; public docs should prefer
`pagekiln g/s/c`. The full commands `pagekiln generate/server/check` also work.

### How To Configure Site Config

`config.yml` is the site-level entry point. It is not just a build-parameter
appendix; it is the main structured source for secondary development and agent
collaboration.

Minimal example:

```yaml
siteUrl: https://example.com
defaultLocale: zh-CN
activeLocales:
  - zh-CN
  - zh-TW
  - en
theme:
  name: default
```

Good `config.yml` responsibilities:

- `siteName`, `description`, and `author`: titles, SEO summaries, JSON-LD, feed titles, and default page copy.
- `defaultLocale` and `activeLocales`: localized routes, language links, and hreflang.
- `nav.links` and `nav.utilityLinks`: main navigation, search/archive entries, and site-level links.
- `footer`, `head`, `pwa`, and `icons`: footer content, head metadata, PWA output, and icon assets.
- `plugins`, `features`, `featureScripts`, and `featureCategories`: search, comments, analytics, ads, WebMCP, and consent-aware loading.
- `robots`, `llms`, `feed`, and `discovery`: `robots.txt`, `llms.txt`, `llms-full.txt`, `feed.xml` when public posts exist, `openapi.json`, `.well-known/api-catalog`, `.well-known/mcp/server-card.json`, and `_headers`.

If a site-operations file can be derived from `config.yml` or root `AGENTS.md`,
do not maintain a second handwritten public copy. For robots, llms, OpenAPI, API
catalog, MCP server card, `AGENTS.md`, or `_headers`, prefer config, the root
guide, or dynamic generation.

### How To Configure Site ICO And OG Images

Site identity assets live under `content/assets/`:

- `content/assets/icon-source.png` is the site icon source image. A customized site should replace at least this image. Use a clear square PNG, at least 512x512, and make sure it is still recognizable at 32px favicon size.
- `content/assets/og-default-source.png` is the default Open Graph source image. A customized site should replace at least this image. Use a 1200x630 PNG/JPG that represents the site and works well in social, chat, and link-preview crops.

After replacing `icon-source.png` or `og-default-source.png`, run:

```bash
pagekiln g
```

The builder generates the ICO, PWA icons, and OG share images from source
artwork and writes them into `dist/`, so the site icon and link-preview assets
match the project customization. Derived files may still live in
`content/assets/` as template resources, but they are not the build entry point;
`pagekiln g` reads source artwork first.

## Start Writing

Writing primarily happens in `content/pages/`; add `content/posts/` only when
the site needs a post collection. The whole `content/pages/` or `content/posts/`
directory may be absent without affecting the build. With no custom pages,
Pagekiln generates a neutral root entry, locale homepage fallback, 404, and
site-discovery files instead of inventing a set of blog default pages. When
public posts exist, they enter post detail pages, feeds, sitemap, llms, and
Markdown mirrors. Pages own the homepage, about page, archive page, category
page, tag page, search page, and other normal pages.

Page routes are decided by `content/pages/*`. If `content/pages/archive`,
`categories`, `tags`, or `search` is removed, the builder no longer invents
those blog-style pages. Missing `content/pages/` means no custom pages, not a
build error; missing `content/posts/` means no public posts. Search indexes are pulled by the
`<!-- pagekiln:search-panel -->` slot, so no search index, OpenAPI search path,
or post-search discovery is generated unless a page uses the search component.

### How To Write Your First Post

Post path:

```text
content/posts/<slug>/index.<locale>.md
```

For example:

```text
content/posts/hello-pagekiln/index.zh-CN.md
content/posts/hello-pagekiln/index.en.md
```

Frontmatter example:

```yaml
---
title: "Post title"
description: "SEO summary"
date: "2026-04-27"
updated: "2026-04-27"
translationKey: "welcome"
tags: ["Announcement"]
category: "News"
draft: false
sitemap: true
cover: ""
---
```

`draft: true` excludes content from public pages, search indexes, sitemap, feeds,
and llms files. `sitemap: false` excludes one post or page from the sitemap.

### How To Edit Your Pages

Page path:

```text
content/pages/<slug>/index.<locale>.md
```

Default special pages use the same page system:

```text
content/pages/home/index.<locale>.md        # /<locale>/
content/pages/archive/index.<locale>.md     # /<locale>/archive/ when the file exists
content/pages/categories/index.<locale>.md  # /<locale>/categories/ when the file exists
content/pages/tags/index.<locale>.md        # /<locale>/tags/ when the file exists
content/pages/search/index.<locale>.md      # /<locale>/search/ when the file exists
```

Markdown under `content/pages` may contain HTML directly. Prefer common
Markdown structure first: `#`, `##`, and `###` headings, paragraphs, lists,
blockquotes, tables, links, images, inline `code`, and fenced code blocks. Use
semantic HTML such as `<header>`, `<section>`, and `figure` when the page needs
clearer structure. Do not add multiple one-off classes to ordinary content just
to style copy. Theme CSS should first cover stable elements such as `h1`, `h2`,
`h3`, `p`, `ul`, `ol`, `blockquote`, `table`, `code`, and `pre`, then use
classes for reusable layouts, components, or slot containers. Place dynamic
components exactly where they should render:

```html
<!-- pagekiln:post-list -->
<!-- pagekiln:pagination -->
<!-- pagekiln:archive-list -->
<!-- pagekiln:terms -->
<!-- pagekiln:search-panel -->
<!-- pagekiln:languages -->
```

For example, the homepage can write its own introduction in
`content/pages/home/index.zh-CN.md`, then place `<!-- pagekiln:post-list -->`
where the post list belongs. An archive page can write its own heading and then
place `<!-- pagekiln:archive-list -->`.

Slot syntax is recognized globally, but context has two levels:

- Base context: `search-panel` only needs the current `locale` and can be used on any page.
- Homepage list context: `post-list` needs `posts`; `pagination` needs `page`, `totalPages`, and `pageUrl`.
- Archive page context: `archive-list` needs `groups` and should only be used on archive pages such as `content/pages/archive`.
- Term index context: `terms` needs `terms` and should only be used on category or tag index pages.
- Translation context: `languages` needs `translations` for a page or article with localized counterparts.

If a context-dependent slot is placed on a page without the required data,
`pagekiln c` reports the unresolved slot instead of silently dropping the
component.

Keep one data input and one output path when developing slots: page renderers
pass only raw data they own to `replaceSlots()`, such as `posts`, `groups`,
`terms`, `translations`, and pagination state; slot HTML is rendered only by
`slotRegistry` in `src/lib/slots.mjs`. Do not pass pre-rendered HTML or renderer
functions back into slot context.

Treat slots as complete components. Do not duplicate what a slot already
renders. Avoid this:

```html
<!-- pagekiln:search-panel -->
<p>Enter a query to start searching.</p>
```

The search panel owns its input, empty state, result count, and error state. Put
durable page explanation in the header, then place the slot.

## Secondary Development

Secondary development is for changing the visual system, page shell, theme
scripts, plugin loading, or builder behavior. Normal sites should prefer
`config.yml`, `content/`, and `themes/`; edit `src/` only when the theme API
cannot express the behavior.

### Understand This Project

Project layout:

```text
config.yml              # Site-level config
content/posts/          # Post Markdown
content/pages/          # Page Markdown/HTML
content/assets/         # Site operations icons, OG images, and derived assets
backend/                # Optional backend/cloud-function source, outside static frontend sources
src/bin/pagekiln.mjs    # CLI entry point
src/*.mjs               # Builder-side Node ESM modules
src/scripts/*.mjs       # Internal builder helper commands
src/pages/*.js|*.astro  # Astro routes and generated endpoints
themes/default/         # Default theme
dist/                   # Generated output
```

The build generates outputs from content triggers:

- Root entry, locale homepage fallback, and 404; the build should still succeed when `content/pages/` is absent
- Normal pages that exist under `content/pages/*`; `archive`, `categories`, `tags`, and `search` are optional pages, not builder-invented routes
- Post detail pages, `feed.xml`, locale feeds, and Markdown mirrors when public posts exist
- Post lists and pagination when homepage content uses `post-list` / `pagination` slots
- Term detail pages when `content/pages/categories` or `content/pages/tags` exists and public posts provide term data
- Search indexes, OpenAPI search paths, and post search discovery when a page uses the `search-panel` slot
- `sitemap.xml`
- `robots.txt`
- `llms.txt` and `llms-full.txt`
- `openapi.json`
- `.well-known/api-catalog`
- `.well-known/mcp/server-card.json`
- `_headers`
- `AGENTS.md`

Do not edit `dist/` by hand. Root `AGENTS.md` is the project guide for Codex,
Claude, and other coding agents. `pagekiln g` copies it to `dist/AGENTS.md` as
the deployed site-level agent guide.

Pagekiln is static-first, but it can be organized as a frontend + backend
project. When a site needs Cloudflare Pages Functions, Cloudflare Workers, a
Node service, a traditional server, or another backend runtime, the source code
must live under `/backend` as an independent boundary instead of being mixed
into `content/`, `themes/`, or builder `src/`.

Backend boundary guidance:

- Keep `content/` and `themes/` as static frontend sources. `pagekiln g` writes HTML, CSS, JS, images, slot-pulled search indexes, post-driven feeds, and discovery files to `dist/` so they can keep high CDN cache hit rates.
- `/backend` is the only place that should touch secrets, database connections, private API tokens, signing keys, privileged permissions, and write-side business logic. Cloudflare Pages Functions, Workers, queue consumers, webhooks, form handlers, login, payments, comment writes, and admin endpoints should follow this boundary.
- `/backend` is the single source of truth for backend source. If the target platform needs functions inside the deployment output, a build script or deployment adapter may compile, copy, or map `/backend` into the appropriate runtime directory under `dist/`; do not hand-author or maintain backend files inside `dist/`.
- Frontend files should call backend services through public endpoints like a normal web frontend. Endpoint paths are project decisions; Pagekiln should not require fixed URL naming.
- `config.yml` should describe only the site-level public calling contract, such as base URL, endpoint keys, methods, consent category, CAPTCHA requirement, cache intent, and whether an endpoint appears in OpenAPI/API catalog/MCP discovery. Never put real secrets in `config.yml`.
- Browser-side identifiers that third-party frontend services require publicly, such as a Cloudflare Web Analytics token, Google Ads client id, or Giscus repo id, should live in the corresponding theme plugin config, for example `themes/<name>/theme.yml` under `plugins.analytics` or `plugins.advertising`. Fill them only when the matching plugin has been developed and enabled. They are not backend secrets, but reusable default templates should still avoid real production values.
- Admin endpoints, privileged endpoints, and internal tools should not appear in the public manifest, OpenAPI, API catalog, MCP server card, or frontend discovery.

### How To Develop Themes

Secondary development should not follow a fixed sequence. Identify the kind of
site first, then choose the smallest suitable boundary:

- Content sites, documentation, and blogs: start with `config.yml`, `content/pages`, `content/posts`, and slot placement; do not copy a theme when the default theme already expresses the site.
- Brand sites, product pages, portfolios, and campaign pages: usually copy `themes/default` to `themes/<your-theme>`, update `theme.name`, then edit templates, CSS, page styles, and small browser scripts.
- Tools, directories, case-study libraries, and product collections: use `content/pages` for editable page structure, then connect dynamic regions through theme templates and slots; enter `src/` only when a reusable data model or page type is missing.
- Sites with forms, login, comment writes, payments, webhooks, or admin actions: keep the static frontend in `config.yml`, `content/`, and `themes/`; put all runtime backend and cloud-function source under `/backend`.
- Pagekiln framework capabilities, reusable slots, site-operations outputs, asset generation, and checks: edit `src/`, then update README, AGENTS, and the check script.

Theme layout:

```text
themes/default/theme.yml         # Theme configuration
themes/default/theme.example.yml # Copyable reference
themes/default/i18n.yml          # Theme UI strings
themes/default/style.css         # Global theme CSS
themes/default/styles/*.css      # Page or feature CSS
themes/default/templates/*.html  # Page templates
themes/default/scripts/*.js      # Consent entry and feature scripts
```

Do not keep `default` as the long-term theme name for a new project. Rename the
theme directory to something project-specific, such as `themes/company-docs/`,
`themes/product-site/`, or `themes/portfolio/`.

CSS placement guidance:

- Put small and reusable theme rules in `themes/<name>/style.css`; avoid loading extra render-blocking CSS files for page differences that are only a few dozen lines.
- Split CSS into `themes/<name>/styles/*.css` and load it through `theme.yml` `pageStyles` only when the page CSS is substantial, low-reuse, or dedicated to complex layouts, animation, or component states for a small set of pages.
- Keep clearly bounded feature styles, such as consent, search, comments, ads, gallery, or docs toc styles, separate when that helps feature/page loading.
- Do not put production CSS in Markdown/HTML. `content/pages` owns content structure and dynamic slot placement; theme CSS owns the visual system.
- Write CSS against semantic Markdown output and a few stable containers first, such as `main h1`, `.page-content h2`, `pre code`, and `blockquote`. Avoid class-heavy one-off content styling such as `class="title title-large title-primary"` for normal page copy.
- Keep CSS/JS source files readable and maintainable; deployment or package output may be minified to one line to reduce transfer size. Do not edit `dist/` by hand; minification should come from the builder, a theme build script, or a deploy adapter.

Plugins are optional. A simple site may use none; a larger site may enable
search, comments, analytics, RUM, ads, maps, forms, commerce, or custom scripts.
The default theme loads only `scripts/consent.js` unconditionally. Before the
user saves preferences, comments, analytics, ads, and marketing scripts do not
load. After consent is saved, the builder loads features by categories such as
`necessary`, `preferences`, `analytics`, and `marketing`.

### How To Develop Dynamic Slots

Add a new `<!-- pagekiln:xxx -->` slot only when users should control placement
from Markdown/HTML while the builder owns generated output.

Post lists, pagination, archives, term collections, language links, related
posts, and search panels fit slots. Fixed copy, static links, static layout, and
one-off structures that Markdown/HTML can already express should stay directly
in `content/pages`.

Workflow:

1. Use a lowercase slot name such as `<!-- pagekiln:relatedposts -->`; use the matching camelCase key in code, such as `relatedPosts`. Do not keep compatibility aliases for old names.
2. Declare the marker, context type, required fields, component HTML, and missing-context behavior in `src/lib/slots.mjs`.
3. Pass only raw page data that each renderer owns, such as `posts`, `page`, `totalPages`, `pageUrl`, `groups`, `terms`, or `translations`.
4. Do not pass pre-rendered HTML or renderer functions into slot context; the data input is the page renderer and the output path is `slotRegistry.render()`.
5. Keep `{{{content}}}` in templates so Markdown and slot output flow into the theme.
6. Put component strings in `themes/default/i18n.yml` and sync defaults in `src/i18n.mjs`.
7. Attach CSS and JS through `theme.yml` using `pageStyles`, `pageScripts`, `featureScripts`, or `featureStyles`.
8. Update README and `AGENTS.md`.
9. Run `pagekiln g` and `pagekiln c`; make sure new context-dependent slots are caught when unresolved.

A slot should own its accessible markup, loading state, empty state, error
state, and runtime behavior. It should not require users to add "results will
appear here" style notes after the slot.

### How To Develop The /src Builder

Normal sites use the default `src/` bundled in the npm package and do not need
to copy or maintain builder source. Enter `src/` only for Pagekiln framework
development, maintaining a fork, or adding reusable build-time capabilities.

Use this data flow when developing `src/`:

1. `src/bin/pagekiln.mjs` receives CLI commands and dispatches `g/s/c` to `src/prebuild.mjs`, Astro build, `src/scripts/serve-public.mjs`, or `src/scripts/check-build.mjs`.
2. `src/lib/content.mjs` reads `config.yml`, theme config, and `content/`, then prepares posts, pages, locales, terms, slot-pulled search, discovery, and site-operations data.
3. `src/assets.mjs` runs during `pagekiln g` and prepares static assets, including site icons and OG output generated from `content/assets/icon-source.png` and `content/assets/og-default-source.png`.
4. `src/templates.mjs` and `src/lib/theme-html.mjs` render data into HTML. Page structure that a theme can express should stay in `themes/<name>/templates/`.
5. `src/pages/` contains Astro endpoints that publish builder data as HTML, XML, JSON, Markdown, OpenAPI, llms, and well-known discovery files.

`src/` file map:

- `src/prebuild.mjs` is the preparation step before `pagekiln g` enters Astro build. It reads site config and post data so content issues fail early.
- `src/assets.mjs` owns build-time asset preparation: copying theme assets, copying `content/assets` site identity assets, generating favicon / app icons / `site.webmanifest` / default OG images, and writing them into `dist/`.
- `src/og-images.mjs` crops post covers into 1200x630 share images, supports local and remote covers, and uses a manifest cache so unchanged images are not regenerated every build.
- `src/i18n.mjs` stores built-in locales, language labels, date formatting, and default UI strings. Theme `i18n.yml` can override or extend these strings.
- `src/templates.mjs` is the built-in fallback renderer for the HTML shell, SEO meta, Open Graph, JSON-LD, navigation, footer, WebMCP bootstrap, post cards, pagination, search panel, term lists, and default page rendering.
- `src/lib/content.mjs` is the builder data core. It reads and merges `config.yml` with theme config, normalizes plugin and consent settings, renders Markdown, copies content images, loads posts and pages, and prepares data for localized routes, categories, tags, slot-pulled search indexes, feeds, sitemap, headers, robots, llms, OpenAPI, API catalog, and MCP server card.
- `src/lib/slots.mjs` centralizes the `<!-- pagekiln:xxx -->` slot registry, context checks, search panel, archive list, and other builder-owned slot components.
- `src/lib/theme-html.mjs` is the HTML theme adapter. It reads `themes/<name>/templates/*.html`, applies simple `{{ }}` / `{{{ }}}` replacements, and uses `src/lib/slots.mjs` to replace builder-owned slots such as post lists, pagination, archive lists, terms, search panel, and language links.
- `src/scripts/check-build.mjs` and `src/scripts/serve-public.mjs` are internal commands called by `pagekiln c` and `pagekiln s`; `src/scripts/generate-neutral-assets.mjs` is a site-operations crop helper for framework development.
- `src/pages/[...route].astro` is the Astro catch-all page output for static HTML routes returned by `buildHtmlPages()`.
- `src/pages/404.astro` outputs the 404 page.
- `src/pages/[feed].xml.js` and `src/pages/[locale]/feed.xml.js` output the global feed and locale feeds when public posts exist.
- `src/pages/robots.txt.js`, `src/pages/llms.txt.js`, `src/pages/llms-full.txt.js`, `src/pages/openapi.json.js`, `src/pages/.well-known/api-catalog.js`, and `src/pages/.well-known/mcp/server-card.json.js` output site-operations and agent discovery files.
- `src/pages/assets/[file].json.js` outputs JSON assets such as search indexes when a page uses the `search-panel` slot.
- `src/pages/md/[locale]/posts/[slug].md.js` exposes Markdown mirrors when public posts exist, for agents and external tools.

Guidance:

- Edit `src/` only for reusable page types, site-operations outputs, slots, config merging rules, asset generation rules, or checks.
- Do not put one site's colors, layout, interactions, third-party scripts, page copy, or images in `src/`; use `config.yml`, `content/`, `themes/`, or `/backend`.
- After changing `src/`, run `pagekiln g` and `pagekiln c`. If you add a new framework contract, update README, AGENTS, and `src/scripts/check-build.mjs`.

### Agent Collaboration

Root `AGENTS.md` is the project guide for Codex, Claude, and other coding
agents.

For blogging:

```text
Please read README.md, AGENTS.md, and config.yml first. I am using Pagekiln as a blog. Prefer config.yml and content/ edits; do not edit themes/ or src/ unless I explicitly ask for theme customization or builder behavior.
```

For secondary development:

```text
Please read AGENTS.md and config.yml first. Treat config.yml as the structured source for site name, locales, navigation, plugins, consent, footer, robots, llms, OpenAPI, API catalog, MCP server card, headers, and other site operations. Prefer config.yml, content/pages, and theme-level changes before editing src/.
```

For sites with Cloudflare Pages Functions, Workers, form handlers, login,
webhooks, or another runtime backend:

```text
Please read AGENTS.md, README.md, and config.yml first. Keep the static frontend in config.yml, content/, and themes/. All cloud-function and runtime backend source must live under /backend. A build script may generate platform deployment output from /backend into dist/, but do not hand-author dist/.
```

If [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) or
[anthropics/skills](https://github.com/anthropics/skills/) is installed, name
the relevant skill in the prompt. They are collaboration constraints, not runtime
dependencies.

When syncing localized pages, treat `zh-CN` as the source of content and
structure unless a locale-specific variation is intentional.

### Deployment Notes

Pagekiln can be deployed to Cloudflare Pages or any static hosting service that
can serve `dist/`. This public repository does not commit real Cloudflare
credentials, account IDs, project names, zone IDs, or production deployment
secrets.

For Cloudflare Pages Git integration, configure your own project:

```text
Build command: npm install && pagekiln g
Build output directory: dist
Node.js version: 22.12 or newer
```

Stable releases should update three places together: `package.json`, the npm
package, and GitHub Release notes. `1.1.0` has been published to npm. It covers
content-driven page generation; fully optional `content/pages/` and
`content/posts/` directories that still build successfully; post detail pages,
feeds, and Markdown mirrors only when public posts exist; search indexes pulled
by the `search-panel` slot; unified slot context checks; the `pagekiln s`
startup 404 fix; and standard right-side placement for the consent panel close
button. Before release, it passed `pnpm run build`, `pnpm run check`,
`git diff --check`, and a preview root HTTP 200 check.

Pagekiln is licensed under `AGPL-3.0-or-later`. Modified, redistributed,
publicly deployed, or downstream versions based on Pagekiln should keep their
corresponding source code open under the AGPL.

Please preserve the original author attribution: `Pagekiln by JSW Teams`, and
keep or equivalently display the `NOTICE` information and original repository
link.
