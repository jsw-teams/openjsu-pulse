# Pagekiln Agent Guide

This file is for AI agents and developers who want to build sites or custom
themes on top of Pagekiln with minimal project-specific knowledge.

Pagekiln is a small static site builder inspired by Hexo's separation of site
content, theme configuration, layouts, assets, and plugins. Treat it as a
frontend framework for content sites: customize themes first, change the core
builder only when the theme API cannot express the needed behavior.

## Fast Orientation

- `config.yml` is the site-level entry point. It selects a theme, declares site
  metadata, locales, navigation, content behavior, and optional plugins.
- `themes/<name>/` is the theme boundary. A new project should usually start by
  copying `themes/default` and changing the copy.
- `themes/default/theme.yml` is the active default theme configuration.
- `themes/default/theme.example.yml` is the copyable reference for theme users.
- The repository root is the neutral default project copied by `pagekiln init`; keep it free of production domains, author identity, analytics tokens, Cloudflare settings, and deployment secrets.
- `themes/default/templates/` contains HTML template fragments for page types.
- `themes/default/style.css` is the theme baseline stylesheet.
- `themes/default/styles/` contains page or feature styles loaded by theme
  configuration.
- `themes/default/scripts/` contains behavior and plugin scripts. Optional
  third-party features should be loaded through consent-aware feature scripts.
- `content/assets/` contains site-operations assets such as source artwork and
  derived favicon, app icon, and default OG files. `icon-source.png` and
  `og-default-source.png` are source artwork. `pagekiln g` should generate the
  final favicon, app icon, and OG output from these sources.
- `src/bin/pagekiln.mjs` is the CLI entry point for init, generate, server, and
  check commands.
- `src/*.mjs` contains builder-side Node ESM modules for config loading,
  content indexing, template rendering, asset generation, i18n, OG images, and
  discovery outputs.
- `src/pages/*.js` and `src/pages/**/*.js` are Astro endpoints for generated
  text, JSON, XML, and Markdown outputs.
- `src/scripts/*.mjs` contains internal builder helper commands used by
  `pagekiln s`, `pagekiln c`, and framework development utilities.
- Agent discovery and site-operations outputs such as `_headers`, `llms.txt`,
  `llms-full.txt`, `openapi.json`, API catalog, and MCP server card are generated
  from `config.yml` and builder code.
- `src/` contains the builder. Avoid changing it for purely visual or
  project-specific theme work.
- `dist/` is generated output. Do not edit it by hand.

## License And Attribution

Pagekiln is licensed under `AGPL-3.0-or-later`. Modified, redistributed,
publicly deployed, or downstream versions should keep their corresponding source
code open under the AGPL.

Preserve the original author attribution: `Pagekiln by JSW Teams`. Keep the
root `NOTICE` file, or provide equivalent visible attribution with a link to the
original repository.

## Config As Secondary-Development Source

When doing secondary development or helping a user shape a new site, read
`config.yml` before making frontend decisions. Treat it as structured
site-operations data that can generate UI and metadata, not as a passive build
appendix. Site names, descriptions, locales, navigation, utility links, footer
content, icons, PWA settings, plugin toggles, consent categories, comments,
analytics, ads, search, WebMCP settings, robots rules, LLM discovery metadata,
OpenAPI/API catalog data, MCP server card metadata, and response headers should
be expressed through `config.yml` and theme config where possible.

This reduces frontend communication cost: the user can fill in YAML values once,
and the builder can generate headers, navigation, language links, SEO metadata,
feeds, sitemap hints, robots.txt, llms.txt, llms-full.txt, OpenAPI, API catalog,
MCP server card, consent behavior, footer content, and discovery resources.
Do not ask the user to repeatedly describe these details in prose when they can
be represented in `config.yml`.

If a site-operations file can be derived from `config.yml` or root
`AGENTS.md`, do not maintain a separate handwritten public copy. When you find
duplicated metadata such as `openapi.json`, API catalog, MCP server card,
`_headers`, robots, LLM discovery text, or deployed agent guidance, prefer
adding or improving a dynamic generator in `src/` and document the contract.

## README Structure

Keep `README.md` and `README.en.md` in the same shape. Aside from the top
`# Pagekiln` document title, the README body should use exactly three primary
sections: Quick Start, Start Writing, and Secondary Development.

The secondary headings should stay aligned across both languages:

- How To Install pagekiln
- How To Run pagekiln
- How To Configure Site Config
- How To Configure Site ICO And OG Images
- How To Write Your First Post
- How To Edit Your Pages
- Understand This Project
- How To Develop Themes
- How To Develop Dynamic Slots
- How To Develop The /src Builder
- Agent Collaboration
- Deployment Notes

Do not add extra top-level README sections for deployment, license, plugins, or
agent collaboration. Fold those details into the relevant primary section unless
the user asks for a new documentation structure.

## Theme-First Workflow

1. Read `config.yml` and identify which site-level content can be generated from
   structured config.
2. Copy `themes/default` to `themes/<your-theme>`.
3. Rename `<your-theme>` to a project-appropriate theme name, not a leftover
   generic or source-project name.
4. Set `theme.name: <your-theme>` in `config.yml`.
5. Move migrated site metadata, locales, navigation, footer, plugin choices, and
   consent behavior into `config.yml` / `theme.yml`.
6. Change global visual language in `themes/<your-theme>/style.css`.
7. Change page-specific layout and polish in `themes/<your-theme>/styles/`.
8. Change HTML structure in `themes/<your-theme>/templates/`.
9. Add site identity assets such as icons and default OG artwork under
   `content/assets/`. If a custom theme needs its own interface images, it may
   create `themes/<your-theme>/source-assets/`; the default theme does not
   require this directory.
10. Add optional behavior under `themes/<your-theme>/scripts/`, then expose it
   from `theme.yml` through `featureScripts` and `featureCategories`.
11. Run `pagekiln g` and `pagekiln c`.

If a requested customization can be done by changing theme config, templates,
CSS, or theme scripts, do that instead of editing `src/`.

When changing the default project created for new users, edit the neutral root `config.yml`, `content/`, `themes/`, and framework generators under `src/` when needed. Do not sync real production domains, author identity, analytics tokens, Cloudflare settings, or deployment secrets into the public Pagekiln repository.

## Theme Contracts

The default theme shows the expected shape for custom themes. Its current page
types are blog-oriented, but custom projects should define page types around
their own product and content model.

- `theme.yml` declares CSS, JS, page style mapping, feature scripts, footer
  content, optional plugin defaults, and consent categories. Site identity
  assets such as icons, PWA colors, and default OG artwork belong in
  `config.yml` and `content/assets/`.
- `i18n.yml` contains theme-owned UI strings. Site content should not need to
  carry theme interface text.
- A theme should support a customizable homepage.
- A theme should support customizable ordinary pages.
- A theme should be able to add project-specific page types, such as product
  pages, documentation sections, portfolio entries, landing pages, tools, case
  studies, blog posts, archive listings, category pages, tag pages, or search
  pages.
- Blog-specific templates such as `home.html`, `archive.html`,
  `terms-index.html`, `terms-page.html`, and `page.html` are examples from the
  default theme, not mandatory page types for every Pagekiln-based project.

When adding a new reusable page type, prefer adding a theme template and a small
builder hook that passes structured data into it. Do not hardcode one site's
layout into `src/templates.mjs`.

## Markdown Pages And Dynamic Slots

`content/pages/<slug>/index.<locale>.md` is a first-class customization surface.
Page Markdown may contain static HTML directly, not only prose Markdown. Use this
for low-cost user-editable page structure: headings, sections, small static
layout wrappers, images, and the position of Pagekiln dynamic components.

Special default pages are also content-owned:

- `content/pages/home/index.<locale>.md` -> `/<locale>/`
- `content/pages/archive/index.<locale>.md` -> `/<locale>/archive/`
- `content/pages/categories/index.<locale>.md` -> `/<locale>/categories/`
- `content/pages/tags/index.<locale>.md` -> `/<locale>/tags/`
- `content/pages/search/index.<locale>.md` -> `/<locale>/search/`

Use Pagekiln slots where the builder should inject dynamic output:

```html
<!-- pagekiln:post-list -->
<!-- pagekiln:pagination -->
<!-- pagekiln:archive-list -->
<!-- pagekiln:terms -->
<!-- pagekiln:search-panel -->
<!-- pagekiln:languages -->
```

Slot syntax is recognized globally, but some slots require page context:

- `post-list` and `pagination` require homepage list context.
- `archive-list` requires archive page context.
- `terms` requires category or tag index context.
- `search-panel` only requires the current locale and can be used on any page.
- `languages` requires translations for the current page or article.

If a context-dependent slot is placed on a page without the required data,
`pagekiln c` should report the unresolved slot instead of letting the component
silently disappear.

Treat slots as real components, not as comments that need explanatory text below
them. For example, do not add a paragraph such as "Enter a query to start searching." after
`<!-- pagekiln:search-panel -->`; the search component already owns its input,
status, results, and error states. Put durable page intent in the page header,
then place the slot exactly where the component should render.

When developing a new slot, add it only for generated or interactive UI whose
placement should remain user-editable in Markdown/HTML. Use one lowercase marker
in page content, such as `<!-- pagekiln:relatedposts -->`, and camelCase in renderer
code, such as `relatedPosts`. Do not keep compatibility aliases for old marker
names. Declare component HTML, required context, and
missing-context behavior in `src/lib/slots.mjs`; page renderers should only pass
the context data they own. Put UI strings in `themes/default/i18n.yml` and
`src/i18n.mjs`, attach CSS/JS through `theme.yml`, and update README plus both
AGENTS documents. Do not add a slot for static copy that can live directly in
`content/pages`.

When the user edits zh-CN content first, use it as the source of truth for
structure and meaning. Sync zh-TW and en pages to the same structure unless the
user explicitly wants a locale-specific variation.

## CSS Guidance

- Keep the theme baseline and small reusable page rules in `style.css`.
- Keep page or feature-specific rules in `styles/*.css` only when the CSS is
  substantial, low-reuse, or dedicated to complex layouts, animations, or
  component states for a small set of pages.
- Small page-specific rules, especially differences of only a few dozen lines,
  should usually be merged into `style.css` to avoid extra render-blocking CSS
  requests and `theme.yml` fragmentation.
- Clearly bounded feature styles such as consent, search, comments, ads,
  gallery, or docs toc may stay separate when that helps feature or page
  loading.
- Do not put production CSS in Markdown/HTML. Page Markdown controls structure
  and dynamic slot placement; theme CSS controls visual language.
- Use stable layout constraints such as `max-width`, grid tracks, aspect ratios,
  and predictable spacing so content cannot overlap on mobile or desktop.
- Prefer CSS custom properties for colors, spacing, borders, and typography that
  a downstream theme may want to override.
- Keep consent UI styles separate from unrelated page styles.
- Do not rely on JavaScript to fix basic layout.
- Do not bake one site's brand, palette, or copy into reusable theme names
  unless the theme is explicitly brand-specific.

## JavaScript Guidance

- Treat `src/*.mjs` as build-time framework code. It runs in Node.js/Astro
  contexts and should own reusable generation behavior, not one site's visual
  preferences.
- Treat `themes/<name>/scripts/*.js` as browser-side theme behavior. It should
  handle progressive enhancement, consent-aware feature loading, and optional
  integrations declared by `theme.yml`.
- `src/pages/*.js` files are generated-output endpoints. Use them for resources
  such as robots, feeds, llms, OpenAPI, API catalog, MCP server card, and other
  structured site-operations files.
- JavaScript should provide behavior and plugin loading, not layout rendering.
- `scripts/consent.js` is the minimal consent entry point. Before the user has
  made a cookie choice, optional analytics, comments, ads, and marketing scripts
  must not load.
- Optional scripts should be mapped in `theme.yml` and gated by consent
  categories.
- Plugins are optional and project-specific. A simple site may need none; a
  larger site may enable search, comments, analytics, ads, commerce, maps, or
  custom integrations.
- Only one comments provider should be active at a time when comments are used.
  Keep provider examples in example config, not as mandatory defaults.
- Analytics providers such as Cloudflare Web Analytics should be configurable
  through `plugins.analytics`, including token, source URL, consent category, and
  provider-specific beacon options.
- Browser-side identifiers required by third-party frontend services, such as
  Cloudflare Web Analytics tokens, Google Ads client ids, or Giscus repo ids,
  may live in theme plugin config only when the corresponding plugin exists and
  is enabled. These values are public client identifiers, not backend secrets;
  reusable default templates should keep placeholders instead of real production
  values.
- WebMCP discovery is intentionally inline in the document shell so agent tools
  can be detected on page load without an extra external script.

## Builder Boundary

Edit `src/` only when you are improving the framework itself:

- loading or merging site and theme config
- adding a reusable page type
- exposing new structured data to theme templates
- improving generated feeds, sitemap, headers, or agent discovery files
- changing asset copying or build output behavior
- adding checks that protect all downstream themes

Do not edit `src/` to change colors, spacing, a single site's hero layout, a
footer label, comment provider preference, analytics token, or theme image.

## Developing src

Normal Pagekiln sites use the default `src/` from the installed npm package.
They should not copy or maintain builder source. Work in `src/` only for
framework development, forks, or reusable build-time capabilities.

Use this flow:

1. `src/bin/pagekiln.mjs` dispatches CLI commands.
2. `src/lib/content.mjs` reads and normalizes config, theme config, Markdown
   content, pages, terms, search data, discovery data, and site operations data.
3. `src/assets.mjs` prepares static assets during `pagekiln g`, including icons
   and OG output generated from `content/assets/*-source.png`.
4. `src/templates.mjs` and `src/lib/theme-html.mjs` render built-in fallback
   HTML and HTML theme templates.
5. `src/pages/` exposes generated HTML, XML, JSON, Markdown, OpenAPI, llms, and
   well-known discovery endpoints through Astro.
6. `src/scripts/` contains internal CLI helper commands such as preview,
   checking, and framework asset utilities.

When changing `src/`, update README and AGENTS if the public contract changes.
Extend `src/scripts/check-build.mjs` for new framework contracts so downstream
themes do not silently regress.

## Backend Boundary

Pagekiln may be used as a static-first frontend + backend project, but backend
runtime code belongs under `/backend`. Do not place backend secrets or business
runtime logic in `content/`, `themes/`, or builder `src/`.

When adding backend support:

- Keep the frontend static by default so HTML, CSS, JS, images, search indexes,
  feeds, and discovery files can be cached effectively.
- Treat `/backend` as the only directory that may access secrets, databases,
  private API tokens, signing keys, privileged permissions, and write-side
  business logic.
- Let project developers choose endpoint paths. Do not require fixed API path
  names in Pagekiln conventions.
- Put only public backend calling contracts in `config.yml`: base URL, endpoint
  keys, methods, consent category, CAPTCHA requirement, cache intent, and
  whether a public endpoint should appear in OpenAPI/API catalog/MCP discovery.
- Put public browser-side third-party identifiers in the matching theme plugin
  config when that plugin is implemented and enabled. Examples include
  Cloudflare Web Analytics token, Google Ads client id, and Giscus repo id.
- Never put real secrets in `config.yml`, README, AGENTS files, generated
  manifests, OpenAPI, API catalog, MCP server card, issues, or chat logs.
- If a backend manifest is generated, it must expose only public metadata needed
  by frontend scripts and agents.

Recommend cache and discovery behavior by endpoint semantics instead of path
prefixes:

- Public, anonymous, idempotent reads may use CDN caching with an explicit
  freshness policy.
- Reads tied to user identity, sessions, subscriptions, or private data should
  be `private` or `no-store`.
- Writes, form submissions, comments, webhooks, login, logout, and token refresh
  endpoints should default to `no-store` and should include validation,
  Origin/CORS checks, request size limits, rate limiting, and CAPTCHA/Turnstile
  where appropriate.
- Admin, privileged, and internal endpoints must not be included in public
  manifests, OpenAPI, API catalog, MCP server card, or frontend discovery.

## Agent Discovery

Pagekiln exposes agent-facing resources for deployed sites:

- Root `AGENTS.md` is the development and agent-collaboration guide.
- `pagekiln g` copies root `AGENTS.md` to `dist/AGENTS.md` for deployed
  site-level agent guidance.
- `_headers` is generated from config and defines RFC 8288 `Link` headers for
  useful resources.
- `llms.txt` and `llms-full.txt` are generated from config and content.
- `openapi.json`, `.well-known/api-catalog`, and
  `.well-known/mcp/server-card.json` are generated discovery endpoints.

Keep repository guidance in this root `AGENTS.md`; the deployed copy is
generated into `dist/`.

## Build And Verify

Use Node 22 or newer.

For Hexo-oriented users, document `pagekiln g` as the public static generation
command. The underlying command maps to Hexo's `hexo generate`;
`npm run generate` remains only a compatibility wrapper created by
`pagekiln init`.

```bash
npm install
pagekiln g
pagekiln c
```

The build output directory is `dist/`.

For local preview, use:

```bash
pagekiln s
```

The preview server polls source files every 10 seconds and rebuilds only after a
detected change. Changes to `content/pages/<slug>/index.<locale>.md` should
prefer page-level incremental output for the matching URL; changes to posts,
theme files, config, or builder code may still require a full
generation pass. Build errors should remain visible in the browser and must not
terminate preview unless the user explicitly stops it.

`pagekiln check` verifies important generated files, theme assets, sitemap shape,
agent discovery headers, and WebMCP bootstrap behavior. If you add new framework
contracts, extend the check script so future themes do not silently regress.

## What Not To Do

- Do not edit generated files in `dist/`.
- Do not put theme assets in `src/`.
- Do not make optional third-party scripts unconditional.
- Do not reintroduce a `public/` build output directory unless the deployment
  contract is intentionally changed.
- Do not add XSL styling to sitemap output just to make it look nicer in a
  browser. The sitemap should remain valid XML that browsers can inspect as an
  XML tree.
- Do not copy large chunks of another static-site generator. Reuse design ideas,
  not source code.
- Do not commit real API tokens, Cloudflare tokens, analytics secrets, or AWS
  keys.

## Recommended Agent Routine

When asked to build a custom site or theme with pagekiln:

1. Read `config.yml`, `themes/default/theme.yml`, and the relevant template.
2. Extract site-level secondary-development facts from `config.yml`: names,
   locales, navigation, footer, plugin toggles, consent categories, robots/LLM
   policy, and discovery needs.
3. Decide whether the request belongs in `config.yml`, `content/pages`, theme
   config, templates, CSS, scripts, content, or builder core.
4. Prefer config, Markdown/HTML page edits, and theme-level changes before
   builder code.
5. Run `pagekiln g` and `pagekiln c`.
6. Summarize changed files and explain whether the change is structured site
   config, user-editable page
   content, reusable theme work,
   or framework work.
