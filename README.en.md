# Pagekiln

Pagekiln 2.0 is a TypeScript/Node 22+ static-first website compiler. YAML 1.2 Frontmatter, CommonMark/GFM Markdown, Patterns, Blocks, and Schema Data compile into inspectable, deployable `dist/` output. Authors write content in Markdown, themes own structure and visual language, and the compiler owns routes, locales, assets, and delivery files.

## Quick Start

```bash
npm install
npm run g -- --profile
npm run check
npm run s
```

Use `npm run g`, `npm run check`, and `npm run s` from a source checkout. After linking the project with `npm link` or installing a published CLI, use `pagekiln g`, `pagekiln check`, and `pagekiln s`. Open `http://127.0.0.1:4173/` to choose a site version. The picker keeps each language name in its own language: `简体中文`, `繁體中文`, and `English`. `g --profile` reports discover, load, validate, parse, route, render, assets, and write timings. A static build does not start an HTTP or Fetch lifecycle for each page; `src/runtime/` contains precompiled JavaScript.

## Start Writing

### Content paths

Put general pages in `content/pages/<id>/<locale>.md`, product notes in `content/posts/<id>/<locale>.md`, and assets in `content/assets/`. The default site provides `zh-sg`, `zh-tw`, and `en`; the final locale segment defines translation groups, routes, and hreflang.

```markdown
---
title: Ship a reusable product note
description: Record one clear product decision.
pattern: blog
date: 2026-08-09
cover: /assets/product-note-cover.webp
---

# Ship a reusable product note

Start with the decision, evidence, and follow-up. Text before `<more>` becomes the archive excerpt.

<more>

The full note remains ordinary Markdown.
```

### Markdown model

The body supports GFM tables, task lists, strikethrough, blockquotes, fenced code, and autolinks. Block Directive attributes stay short and scalar; headings, lists, tables, and explanations stay in Markdown:

```markdown
:::feature-grid{columns="3"}
### Pages
For home, guide, and directory surfaces.

### Product notes
For decisions that keep changing.

### Themes
For visual and structural extension.
:::
```

Unknown Blocks, invalid attributes, missing schema fields, and route collisions report the source file, line, column, and a repair suggestion. Raw HTML is escaped by default; only reviewed trusted values may use `unsafeHtml`. MDX, JSX, virtual DOM, and HTML-comment Slots are outside the compiler path.

### Built-in outputs

The default site emits static HTML, a custom 404 page, a feed (an RSS/Atom-style update subscription file), `sitemap.xml` (a search-engine site map), a local search index, `llms.txt` (a concise site entry point for Agents), `.pagekiln/catalog.json` (theme capabilities and content contexts), and `.well-known/agent.json`. Search results label the matching title, description, heading, body, or path instead of returning an unexplained title-only hit.

## Secondary Development

### Project structure

```text
config.yml                 site information, locales, routes, collections, plugin switches
content/                   Markdown content and user-owned assets
themes/default/            theme.yml, i18n.yml, theme.ts, style.css, plugin scripts, Pattern/Block resources
src/compiler.ts            BuildContext, parsing, schemas, graph, cache, static output
src/theme-api.ts           Pattern, Block, and Shell theme contract
src/lib/                   Markdown, SafeHtml, URL, and small core helpers
src/fetch-router.ts        shared Web Standard Fetch router
backend/handler.ts         only source for dynamic business logic and secrets
test/                      unit, integration, and output-contract tests
scripts/benchmark.mjs      temporary scale fixture, never production dist
```

`src/runtime/`, `.pagekiln/`, and `dist/` are generated and must not be hand-edited. The root `src/` tree no longer preserves empty layers from the previous engine; check the theme and existing Blocks before adding a new content capability.

### Commands

| Command | Purpose |
| --- | --- |
| `pagekiln init` | Create a neutral project without a production domain, token, or identity |
| `pagekiln g --profile` | Generate the static site and write a machine-readable build profile |
| `pagekiln s [port]` | Keep one BuildContext alive for incremental preview |
| `pagekiln d --dry-run` | Preview the deployment action from `config.yml` without uploading |
| `pagekiln d` | Build and upload `dist/` using the target in `config.yml` |
| `pagekiln check` | Validate Markdown, schemas, Blocks, routes, and outputs |
| `pagekiln catalog` | Inspect the active theme's Patterns, Blocks, schemas, examples, and dependencies |
| `pagekiln inspect <id>` | Inspect content identity, route, locale, and Directive source positions |

### Theme-first extension

Start secondary development in `themes/<name>/`. Copy the default theme, add a Pattern or Block in `theme.ts`, declare its schema in `theme.yml`, keep styles in the unified `style.css`, and keep optional capabilities under nested `plugins.<name>` entries with an `enabled: true|false` switch. Put localized UI messages in the separate `i18n.yml`. The page shell, mobile breakpoints, expandable outline, hit-location search labels, no-motion default, and Cookie selector are theme concerns. Ordinary pages do not hydrate.

Pattern → Block → Schema Data is the intended composition. Collections, locale fallback, feeds, site maps, search, image caching, incremental dependency graphs, and deployment output remain compiler capabilities so each page does not need a private template.

### Configuration boundaries

`config.yml` manages site information, locales, navigation, collections, routes, schemas, image variants, search, privacy, and deployment settings. It is not a CSS, HTML, browser-script, or `unsafeHtml` injection surface. Visual behavior belongs in the theme; dynamic behavior belongs in `backend/handler.ts`.

The default theme keeps styles in the unified `style.css`. CSS builds as one compressed line, and CSS/native ESM filenames receive content fingerprints without query-string cache keys. OG and product-note covers are produced from configured image variants, with default source images when a page has no asset.

### Privacy and accessibility

The `privacyConsent` theme plugin declares the Cookie selector, and its `enabled` switch can be combined with the site-level `config.yml` switch. Essential categories remain available; optional categories start disabled, and optional scripts are not inserted before consent. Human visitors open one localized settings control from the footer, while Agents read a separate machine-readable disclosure; the two audiences do not share an entry point. Output includes a skip link, semantic headings, keyboard focus, ARIA state, hreflang, and a site map. On mobile, tables become labeled vertical rows and the outline expands with the page instead of relying on a native horizontal scroller.

Optional services are configured under `privacy.cookieConsent.integrations` in `config.yml`, without adding script paths there. Built-in providers are `googleAnalytics` (`measurementId`), `googleAds` (`conversionId`), `cloudflareWebAnalytics` (`token`), and `baiduTongji` (`siteId`). Each provider loads only after its category is selected; Google receives Consent Mode updates, Baidu's official async code is preserved, and Cloudflare Web Analytics remains an optional data transmission even though its beacon does not use cookies.

```yaml
privacy:
  cookieConsent:
    integrations:
      googleAnalytics: { enabled: true, measurementId: G-XXXXXXXXXX, category: analytics }
      googleAds: { enabled: true, conversionId: AW-XXXXXXXXXX, category: advertising }
      cloudflareWebAnalytics: { enabled: true, token: YOUR_CLOUDFLARE_TOKEN, category: analytics }
      baiduTongji: { enabled: true, siteId: YOUR_BAIDU_SITE_ID, category: analytics }
```

### Deployments and dependencies

The unified `dist/` can be served directly by a CDN, Caddy, or Nginx. Put one or more deployment targets and their destinations in the site-root `config.yml`; targets run in list order:

```yaml
deployment:
  targets: [vps, cloudflare-pages]
  cloudflare:
    accountId: CF_ACCOUNT_ID
    pages:
      project: site-name
      branch: production
    workers:
      name: site-worker
      compatibilityDate: '2026-08-10'
  github:
    remote: origin
    branch: gh-pages
  vps:
    host: vps.example.com
    user: deploy
    port: 22
    remotePath: /var/www/site
    identityFile: ~/.ssh/id_ed25519
  openaiSites:
    metadata: .openai/hosting.json
```

Then run `pagekiln d`; `pagekiln d --dry-run` inspects every selected action. Cloudflare Pages needs a project name and optional branch; Workers needs a Worker name and compatibility date, while Wrangler credentials come from environment variables or local configuration. GitHub needs an existing remote name and target branch. VPS needs a host, user, SSH port, and an existing remote directory, with an optional `identityFile`; when omitted, OpenSSH agent/config is used. The OpenAI Sites target accepts only an existing `.openai/hosting.json` and hands the validated source state to the Sites connector for source push, version saving, and deployment; it never creates a project or invents credentials when metadata is absent. With the backend enabled, the compiler emits a Cloudflare Workers module, a Cloudflare Pages Advanced Mode `_worker.js`, and a VPS `Deno.serve` entry using the same Fetch handler. Static requests are served first and secrets come only from runtime bindings.

Production dependencies have narrow roles: `markdown-it` and `markdown-it-task-lists` parse GFM, `yaml` parses YAML 1.2, `sharp` creates image variants, and `lucide` supplies mature open-source SVG icon nodes. Traversal, watch, hashing, routing, feeds, site maps, search serialization, atomic writes, and tests use Node/Web Standards rather than convenience packages.

### Verification and limits

```bash
npm run compile-runtime
npm run compile-theme
npm run compile-backend
npm test
pagekiln g --profile
pagekiln check
npm run catalog
npm run inspect -- home
npm run bench -- 100
npm run bench:compare -- --sizes=100 --scenario=cold --tools=pagekiln,astro,eleventy,hugo
```

The scale fixture is created in the system temporary directory and removed after the run. The documented default is 100 entries; `--locales=3` adds the three locales, `--images` exercises the image cache, and `--quick` measures cold and no-change builds. Each JSON line records the machine, phases, scenarios, output counts, and image counters. `maxRssMiB` is peak resident memory of the Node process (RSS, KiB divided by 1,024), not `dist/` size or the memory of one page. Temporary build JSON is not committed or exposed as a product claim.

The comparison page uses only capabilities confirmed by official tool documentation and separates tool execution time from Pagekiln’s additional delivery contract. See `content/pages/about/`, `content/pages/guide/`, and `content/pages/development/` for the current implementation, reproduction details, and explicit limits.

Preserve the MIT license, `NOTICE`, existing user assets, and the optional `Pagekiln by JSW Teams` attribution policy. `branding.showAttribution` controls only the footer credit; it does not change license obligations.
