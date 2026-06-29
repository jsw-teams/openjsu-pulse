# Pagekiln

[简体中文 README](README.md)

<p align="center">
  <img src="content/assets/icon-192.png" alt="Pagekiln project icon" width="160">
</p>

Pagekiln is a Hexo-inspired static site and blog builder. Site settings live in
`config.yml`, posts and pages live in `content/`, themes live in
`themes/<name>/`, and generated output goes to `dist/`.

The intent is simple: if you only want to blog, edit content like a normal
Markdown site; if you need customization, move into config, themes, and builder
extensions. The default theme already includes locales, archives, categories,
tags, search, feeds, sitemap, robots, llms, agent discovery, consent preferences,
and optional third-party script loading.

## Use Directly

For a blog or regular content site, you do not need to learn theme development
first:

1. Create a site directory and install Pagekiln: `mkdir my-site && cd my-site && npm i pagekiln`.
2. Initialize the site with the installed CLI: `npx pagekiln init .`. Use `node bin/pagekiln.mjs init my-site` only when debugging the framework repository itself.
3. Edit `config.yml` for site name, description, author, locales, navigation,
   footer, robots, llms, feeds, plugin toggles, and discovery data.
4. Edit `content/posts/` to add or update posts.
5. Edit `content/pages/` to customize the homepage, about page, archive,
   categories, tags, search page, or ordinary pages.
6. Run `pagekiln s` for local live preview.
7. Run `pagekiln g` and `pagekiln c` before publishing.

Commands for Hexo users:

```bash
mkdir my-site
cd my-site
npm i pagekiln
npx pagekiln init .
pagekiln s
pagekiln g
pagekiln c
```

`pagekiln init` uses the neutral root project template bundled in the repository/package. The template does not include production or preview secrets. Forks and downstream projects should set their own site name, `siteUrl`, analytics, robots policy, deployment target, and environment configuration.

- `pagekiln g` / `pagekiln generate` maps to `hexo generate` / `hexo g`.
- `pagekiln s` / `pagekiln server` maps to `hexo server` / `hexo s`.
- `pagekiln c` / `pagekiln check` verifies `dist/`, theme assets, sitemap, feed, agent
  discovery, and WebMCP bootstrap.

`pagekiln init` writes compatibility scripts such as `generate`, `server`, and
`check` into the new project's `package.json`; public docs should prefer
`pagekiln g/s/c`. The full commands `pagekiln generate/server/check` also work.
When working in the framework repository or debugging the CLI directly, you can
use `node bin/pagekiln.mjs init/generate/server/check`.

Local preview:

```text
http://127.0.0.1:4173/
```

`pagekiln s` polls `content/`, `themes/`, `static/`, and `config.yml`
every 10 seconds. It rebuilds only after detected changes. Build errors stay
visible in the browser and do not stop the preview process. Changes to
`content/pages/<slug>/index.<locale>.md` prefer page-level incremental output.

## Content And Pages

Posts:

```text
content/posts/<slug>/index.<locale>.md
```

Pages:

```text
content/pages/<slug>/index.<locale>.md
```

Default special pages use the same page system:

```text
content/pages/home/index.<locale>.md        # /<locale>/
content/pages/archive/index.<locale>.md     # /<locale>/archive/
content/pages/categories/index.<locale>.md  # /<locale>/categories/
content/pages/tags/index.<locale>.md        # /<locale>/tags/
content/pages/search/index.<locale>.md      # /<locale>/search/
```

Markdown under `content/pages` may contain HTML directly. You can write
`<header>`, `<section>`, `<img>`, small page scripts, and place dynamic
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
place `<!-- pagekiln:archive-list -->`. This avoids editing theme templates
just to move generated components.

Treat slots as complete components. Do not duplicate what a slot already
renders. Avoid this:

```html
<!-- pagekiln:search-panel -->
<p>Enter a query to start searching.</p>
```

The search panel owns its input, empty state, result count, and error state. Put
durable page explanation in the header, then place the slot.

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

## Project Layout

```text
config.yml              # Site-level config
content/posts/          # Post Markdown
content/pages/          # Page Markdown/HTML
content/assets/         # Site operations icons, OG images, and derived assets
bin/pagekiln.mjs        # CLI entry point
src/*.mjs               # Builder-side Node ESM modules
src/pages/*.js|*.astro  # Astro routes and generated endpoints
static/                 # Static files that cannot be generated from config
themes/default/         # Default theme
dist/                   # Generated output
```

Theme layout:

```text
themes/default/theme.yml         # Theme configuration
themes/default/theme.example.yml # Copyable reference
themes/default/i18n.yml          # Theme UI strings
themes/default/style.css         # Global theme CSS
themes/default/styles/*.css      # Page or feature CSS
themes/default/templates/*.html  # Page templates
themes/default/scripts/*.js      # Consent entry and feature scripts
themes/default/source-assets/    # Theme illustrations and interface images
```

JavaScript / MJS responsibilities:

- `bin/pagekiln.mjs` is the CLI entry point for `init`, `generate`, `server`, and `check`.
- `src/*.mjs` is builder-side code that runs in Node.js/Astro build contexts. It reads and merges config, generates assets, renders templates, handles i18n, indexes content, builds OG images, Agent discovery, feeds, sitemap, headers, and other framework outputs.
- `src/pages/*.js` and `src/pages/**/*.js` are Astro endpoints for generated files such as `robots.txt`, `llms.txt`, `openapi.json`, feeds, and Markdown APIs.
- `themes/<name>/scripts/*.js` is browser-side theme code. These scripts provide page behavior and consent-aware feature loading, such as search, media enhancement, lightbox, comments, and WebMCP client helpers.
- For visual changes, interactions, or third-party features, prefer `themes/<name>/theme.yml`, CSS, templates, and theme `scripts/*.js`. Edit `src/*.mjs` only for build-time capabilities, generated outputs, or reusable theme APIs.

Site operations asset contract:

- `content/assets/icon-source.png` is the site icon source image.
- `content/assets/og-default-source.png` is the default Open Graph source image.
- `pagekiln init` writes `npm run assets:site`, which calls `scripts/generate-neutral-assets.mjs`. This script only crops and exports derived files: `favicon.ico`, `favicon-32x32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `og-default.png`, and `og-default.jpg`. It does not design the icon or redraw the OG image.
- Site identity details such as icons, PWA colors, and the default OG image belong in `config.yml` and `content/assets/`; theme `source-assets/` should contain only theme-owned illustrations or interface images.
- Other theme illustrations or state images should be maintained directly as theme source assets, not added to the site operations cropping script.

## Site Config

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

- `siteName`, `description`, and `author`: titles, SEO summaries, JSON-LD,
  feeds, and default page copy.
- `defaultLocale` and `activeLocales`: localized routes, language links, and
  hreflang.
- `nav.links` and `nav.utilityLinks`: main navigation, search/archive entries,
  and site-level links.
- `footer`, `head`, `pwa`, and `icons`: footer content, head metadata, PWA
  output, and icon assets.
- `plugins`, `features`, `featureScripts`, and `featureCategories`: search,
  comments, analytics, ads, WebMCP, and consent-aware loading.
- `robots`, `llms`, `feed`, and `discovery`: `robots.txt`, `llms.txt`,
  `llms-full.txt`, `feed.xml`, `openapi.json`, `.well-known/api-catalog`,
  `.well-known/mcp/server-card.json`, and `_headers`.

If a site-operations file can be derived from `config.yml`, do not maintain a
second handwritten copy under `static/`. For robots, llms, OpenAPI, API catalog,
MCP server card, or `_headers`, prefer config or dynamic generation.

## Customization And Secondary Development

For simple blogging, stay in `config.yml` and `content/`. Move into secondary
development only when changing the visual system, page shell, theme scripts,
plugin loading, or builder behavior.

Recommended order:

1. Read `config.yml` and model site name, locales, navigation, footer, plugins,
   consent, robots, llms, and discovery as structured config.
2. Edit `content/pages` for page copy, static HTML structure, and dynamic slot
   placement.
3. Copy `themes/default` to `themes/<your-theme>` and update `theme.name`.
4. Edit `themes/<name>/theme.yml` for theme resources, page styles, feature
   scripts, consent categories, and plugin defaults.
5. Edit `themes/<name>/templates/`, `style.css`, `styles/`, and `scripts/`.
6. Edit `src/` only when the theme API cannot express the behavior.

Do not keep `default` as the long-term theme name for a new project. Rename the
theme directory to something project-specific, such as `themes/company-docs/`,
`themes/product-site/`, or `themes/portfolio/`.

CSS placement guidance:

- Put small and reusable theme rules in `themes/<name>/style.css`; avoid loading
  extra render-blocking CSS files for page differences that are only a few dozen
  lines.
- Split CSS into `themes/<name>/styles/*.css` and load it through `theme.yml`
  `pageStyles` only when the page CSS is substantial, low-reuse, or dedicated to
  complex layouts, animation, or component states for a small set of pages.
- Keep clearly bounded feature styles, such as consent, search, comments, ads,
  gallery, or docs toc styles, separate when that helps feature/page loading.
- Do not put production CSS in Markdown/HTML. `content/pages` owns content
  structure and dynamic slot placement; theme CSS owns the visual system.

## Developing Dynamic Slots

Add a new `<!-- pagekiln:xxx -->` slot only when users should control placement
from Markdown/HTML while the builder owns generated output. Post lists,
pagination, archives, term collections, language links, related posts, and
search panels fit slots. Fixed copy, static links, and one-off HTML should stay
directly in `content/pages`.

A slot is not another syntax for inserting static HTML. If the content can live
directly in Markdown/HTML, do not add a slot. Use slots only when the builder
must inject dynamic data, interaction state, cross-locale UI strings, or runtime
components.

Workflow:

1. Use a kebab-case slot name such as `<!-- pagekiln:related-posts -->`; use
   the matching camelCase key in code, such as `relatedPosts`.
2. Generate component HTML in the relevant renderer in `src/lib/theme-html.mjs`,
   then pass it to `replaceSlots(pageContent.html, { relatedPosts })`.
3. If `src/templates.mjs` has a fallback path, add the same slot there.
4. Keep `{{{content}}}` in templates so Markdown and slot output flow into the
   theme.
5. Put component strings in `themes/default/i18n.yml` and sync defaults in
   `src/i18n.mjs`.
6. Attach CSS and JS through `theme.yml` using `pageStyles`, `pageScripts`,
   `featureScripts`, or `featureStyles`.
7. Update README, `AGENTS.md`, and `static/AGENTS.md`.
8. Run `pagekiln g` and `pagekiln c`; extend checks for new framework
   contracts.

A slot should own its accessible markup, loading state, empty state, error
state, and runtime behavior. It should not require users to add "results will
appear here" style notes after the slot.

## Plugins And Consent

Plugins are optional. A simple site may use none; a larger site may enable
search, comments, analytics, RUM, ads, maps, forms, commerce, or custom scripts.

The default theme loads only `scripts/consent.js` unconditionally. Before the
user saves preferences, comments, analytics, ads, and marketing scripts do not
load. After consent is saved, the builder loads features by categories such as
`necessary`, `preferences`, `analytics`, and `marketing`. WebMCP discovery is
inlined by the builder so browser agents can discover site tools on page load.

Only one comments provider should be active at a time. Analytics, RUM, ads, and
other third-party scripts should live under theme `plugins` config with an
explicit consent category.

## Generated Outputs

The build generates:

- Home and paginated indexes
- Posts
- Archive
- Categories and category detail pages
- Tags and tag detail pages
- Normal pages
- Search page and search indexes
- `feed.xml`
- `sitemap.xml`
- `robots.txt`
- `llms.txt` and `llms-full.txt`
- `openapi.json`
- `.well-known/api-catalog`
- `.well-known/mcp/server-card.json`
- `_headers`

Do not edit `dist/` by hand.

## Agent Collaboration

Root `AGENTS.md` is the project guide for Codex, Claude, and other coding
agents.

For blogging:

```text
Please read README.md, AGENTS.md, and config.yml first. I am using Pagekiln as
a blog. Prefer config.yml and content/ edits; do not edit themes/ or src/ unless
I explicitly ask for theme customization or builder behavior.
```

For secondary development:

```text
Please read AGENTS.md and config.yml first. Treat config.yml as the structured
source for site name, locales, navigation, plugins, consent, footer, robots,
llms, OpenAPI, API catalog, MCP server card, headers, and other site operations.
Prefer config.yml, content/pages, and theme-level changes before editing src/.
```

If [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) or
[anthropics/skills](https://github.com/anthropics/skills/) is installed, name
the relevant skill in the prompt. They are collaboration constraints, not runtime
dependencies.

When syncing localized pages, treat `zh-CN` as the source of content and
structure unless a locale-specific variation is intentional.

## Deployment Notes

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

## License

Pagekiln is licensed under `AGPL-3.0-or-later`. Modified, redistributed,
publicly deployed, or downstream versions based on Pagekiln should keep their
corresponding source code open under the AGPL.

Please preserve the original author attribution: `Pagekiln by JSW Teams`, and
keep or equivalently display the `NOTICE` information and original repository
link.
