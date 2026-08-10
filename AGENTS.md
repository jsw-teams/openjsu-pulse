# Pagekiln 2.0 Agent Guide

Pagekiln is a TypeScript/Node 22+ static-first website compiler. The authoring model is Markdown → Pattern → Block → Schema Data. An Agent is optional: a person can build the site with the same files and commands.

## Ownership boundaries

- `config.yml` owns site metadata, active/default locales, navigation targets, collections, routes, schemas, image variants, search, privacy, and deployment settings. It is a settings surface, not a CSS, HTML, browser-script, UI-copy, or `unsafeHtml` injection surface. Theme message fallback and localized UI copy live in `themes/<name>/i18n.yml`.
- `content/<collection>/<id>/<locale>.md` owns content. The default project uses `pages` for general surfaces and `posts` for product notes. Keep user and brand assets in `content/assets/`.
- `themes/<name>/theme.yml`, `i18n.yml`, `theme.ts`, the unified `style.css`, and native browser ESM own visual behavior, theme messages, shell layout, mobile behavior, the no-motion default, search presentation, and Cookie presentation. `theme.yml` may point to the separate `i18n.yml`, but localized messages do not belong inside the theme config. Theme fingerprints are generated from all theme resources; do not add a hand-maintained theme version. Ordinary pages do not hydrate.
- `src/theme-api.ts` is the small theme contract. `src/compiler.ts` owns one shared BuildContext, Markdown/YAML validation, routes, dependencies, cache, assets, and static output; it must not contain a site-specific visual registry.
- `src/lib/` owns small reusable parsing and security helpers. `src/fetch-router.ts` owns the Web Standard Fetch router shared by deployment targets.
- `backend/` is the only source location for dynamic business logic, secrets, webhooks, writes, and privileged operations.
- `src/runtime/`, `.pagekiln/`, and `dist/` are generated. Never edit them manually. The root `src/` tree should contain real compiler, library, CLI, and router code rather than empty compatibility layers.

## Function map

| Function | First location | Verify with |
| --- | --- | --- |
| Write a general page | `content/pages/<id>/<locale>.md` | `pagekiln check` |
| Write a product note | `content/posts/<id>/<locale>.md` | `pagekiln g` |
| Change layout, visual language, or theme copy | `themes/<name>/theme.yml`, `i18n.yml`, `theme.ts`, `style.css` | `pagekiln catalog` |
| Change site settings | `config.yml` | `pagekiln check` |
| Discover available extensions | `.pagekiln/catalog.json`, `.well-known/agent.json` | `pagekiln inspect <id>` |
| Add runtime business behavior | `backend/handler.ts` | `pagekiln g` |
| Measure a temporary content fixture | `scripts/benchmark.mjs`, `scripts/benchmark-compare.mjs` | `npm run bench -- 100` |

## Content contract

Use YAML 1.2 Frontmatter and CommonMark/GFM. Paths derive collection, id, and locale. Directive attributes stay short and scalar; headings, prose, links, lists, tables, and code stay Markdown. Unknown Blocks, invalid attributes, missing schema fields, and route collisions must report file, line, column, and a useful suggestion.

Pagekiln does not use Astro, MDX, JSX, virtual DOM, HTML-comment Slots, or default raw-HTML pass-through. Text and attributes escape by default. Links pass the URL protocol policy. Only reviewed trusted values may cross `unsafeHtml`.

## Build contract

`pagekiln g`, `s`, and `d` are the primary Hexo-shaped CLI commands: generate `dist/`, serve an incremental preview, and deploy `dist/`. In a source checkout, use the equivalent npm scripts `npm run g`, `npm run s`, and `npm run d`; the bare `pagekiln` command exists after `npm link`, a global install, or another package-manager installation. `pagekiln build` is the explicit full-name generate command; the old `dev` and `deploy` command spellings are not public compatibility aliases. Deployment target, provider credentials references, and VPS paths belong in the site root `config.yml`; `pagekiln d` only accepts `--dry-run` as an optional inspection flag. One build creates one BuildContext, discovers source files, parses changed inputs once, derives routes, renders affected outputs, writes changed bytes atomically, removes outputs for deleted inputs, and records `.pagekiln/manifest.json`, `dependency-graph.json`, and `dist/.pagekiln/build-profile.json`.

Use mtime + size as the fast path and compute a hash after a change. Persist document outputs, Block names, translation and collection dependencies, image parameters, renderer/config/theme fingerprints, and output hashes. Dev keeps the BuildContext alive and consumes `fs.watch` paths; a diagnostics error must leave the preview process running.

Image variants use Sharp with a source + parameters + implementation cache. Search and `llms-full` support sharding, feeds are bounded, and product-note archives paginate. CSS is emitted as a compressed single line; CSS and native ESM asset names receive content fingerprints without query-string cache keys. Do not add packages for traversal, watch, hashing, routing, feeds, site maps, search serialization, or testing when Node/Web Standards and a small internal module are enough.

The optional scale fixture uses a temporary directory, reports full JSON lines to stdout, and removes its files after the run. It measures cold, no-change, edit, add, delete, theme, and setting changes without becoming a committed benchmark artifact or a product promise. `maxRssMiB` means the Node process peak resident set in MiB: `process.resourceUsage().maxRSS` in KiB divided by 1,024; it is not output size or per-page memory.

## Runtime and deployment contract

Static compilation must not create a Request/Fetch/HTTP lifecycle per page. Dynamic code uses Web Standard `Request`, `Response`, `URL`, and the internal Router. Compile `backend/handler.ts` before emitting deployment JavaScript.

- CDN, Caddy, or Nginx can serve the unified `dist/` directly.
- Cloudflare Workers uses a standard module Worker, static asset binding, and assets-first routing except configured dynamic paths.
- Cloudflare Pages stays pure static with `deployment.backend: false`; when enabled it emits Advanced Mode `_worker.js`.
- `deployment.targets` accepts one target or a list and runs the selected targets in order. Cloudflare Pages uses `deployment.cloudflare.pages.project` and optional `branch`; Workers uses `deployment.cloudflare.workers.name` and `compatibilityDate`; `github` uses `deployment.github.remote/branch`; and `vps` uses `deployment.vps.host/user/port/remotePath` plus an optional `identityFile` for SCP.
- `openai-sites` only hands off the configured, existing `.openai/hosting.json` to the OpenAI Sites connector; it does not create a project or invent credentials.
- VPS dynamic execution uses `Deno.serve`; Caddy/Nginx serves static files.

All dynamic targets share the same Fetch handler. Secrets come only from runtime bindings or environment variables. Human visitors open one localized Cookie selector from the footer; Agents read the separate machine-readable privacy disclosure at `/.well-known/agent.json`.

## Theme and extension contract

Secondary development starts in a copied theme. Add Pattern and Block definitions in `themes/<name>/theme.ts`, declare schemas and actual resource dependencies in `theme.yml`, put optional capabilities under nested `plugins.<name>` entries with `enabled: true|false`, and keep localized UI copy in the separate `themes/<name>/i18n.yml`. Keep responsive layout, icons, search hit labels, table adaptation, and privacy UI in the unified `style.css` and theme resources. Delete replaced CSS/JS files; do not preserve dead compatibility layers for hypothetical agents. Do not modify the compiler for a visual variation.

When a visual redesign replaces CSS or browser ESM, overlapping and superseded files, rules, and handlers are disposable. Delete duplicates and dead compatibility layers; do not keep them for hypothetical future agents or rely on cascade order to preserve old behavior.

The default theme includes the `landing`, `document`, `docs`, and `blog` Patterns and reusable Blocks for compiler flow, comparison, measured data, research, posts, table-of-contents, and calls to action. The current example uses three locales, a general `pages` collection, and a `posts` collection presented as product notes. The root language picker keeps self-names such as `简体中文`, `繁體中文`, and `English`; translated product notes expose one language switcher in the title area.

## Documentation and attribution

Keep `README.md` and `README.en.md` aligned with exactly three primary sections: Quick Start, Start Writing, and Secondary Development. Keep their secondary headings and command coverage synchronized. Documentation must separate current behavior, local measurements, official-source comparison research, and explicit limits.

Preserve the MIT `LICENSE`, `NOTICE`, existing user assets, and the `Pagekiln by JSW Teams` attribution policy. `branding.showAttribution` may hide the footer credit; it does not change license obligations.

## Verification

Run:

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
```

Also verify generated HTML, the language picker at `/`, the custom 404 page, feeds, hreflang and site map, search result hit labels, `llms.txt`, catalog and Agent metadata, image-cache reuse, Worker/Pages output, VPS Fetch handler, Cookie consent before optional scripts, provider integrations after consent and on withdrawal, responsive tables, expandable mobile outline, fingerprinted one-line CSS, the 100-page build resource report, dev preview live update, and a real local HTTP preview. Run `git diff --check` only when Git metadata is available. Never publish npm, push, or open a PR unless the user explicitly asks for it.
