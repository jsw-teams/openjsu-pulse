# Pagekiln Agent Guide

Use the repository's source files and generated discovery output as the contract. Keep this file about safe work habits and boundaries; do not copy the complete project reference into it.

## Boundaries

- `config.yml` owns site metadata, locales, navigation, collections, routes, schemas, privacy, search, images, and deployment settings. It is not a CSS, HTML, browser-script, or `unsafeHtml` injection surface.
- `content/pages/<id>/<locale>.md` owns general pages; `content/posts/<id>/<locale>.md` owns dated notes; `content/assets/` owns user assets.
- `themes/<name>/theme.yml`, `i18n.yml`, `theme.ts`, `style.css`, and theme resources own Patterns, Blocks, shell markup, visual behavior, localized UI copy, icons, search, and Cookie presentation. Optional plugins live under `plugins.<name>` and support `enabled: true|false`.
- `backend/handler.ts` is the only source for dynamic business logic, secrets, writes, and webhooks.
- `src/` owns the compiler, CLI, libraries, Fetch router, and theme contract. Never hand-edit `src/runtime/`, `.pagekiln/`, or `dist/`; they are generated.

## Discover before changing

Run `pagekiln catalog` for the active source-backed capability catalog. Use `pagekiln inspect home` for content and explicit queries for local facts:

```text
pagekiln inspect page:<id>
pagekiln inspect block:<id>
pagekiln inspect pattern:<id>
pagekiln inspect collection:<id>
pagekiln inspect plugin:<id>
```

`config.yml`, `content/`, and `themes/` are the source of truth. `.pagekiln/catalog.json` and `.well-known/agent.json` are generated discovery; `AGENTS.md` is operational guidance, not a capability registry.

## Change and verify

Change content in Markdown, visual behavior in a copied theme, site settings in `config.yml`, and dynamic behavior in `backend/handler.ts`. If a CSS or browser ESM redesign replaces an implementation, delete overlapping dead files and handlers; do not preserve them for hypothetical agents or rely on cascade order.

Keep `theme.yml` declarations aligned with the actual `theme.ts`/`theme.js` export. Keep localized UI messages in `i18n.yml`, not in `config.yml`. Do not perform a broad compiler refactor for a local feature; a future candidate is splitting `src/compiler.ts` by pipeline responsibility.

Verify proportionally, normally with:

```bash
npm run compile-runtime
npm run compile-theme
npm run compile-backend
npm test
npm run build -- --profile
npm run check
npm run catalog
npm run inspect -- home
```

Use `npm run bench -- 100` only for the temporary scale/resource and preview-live-update measurement. Run `git diff --check` when Git metadata is available. Never publish, push, deploy, or open a PR unless the user explicitly asks for that action.
