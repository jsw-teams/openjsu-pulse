# Pagekiln Site Agent Guide

This deployed site is generated with Pagekiln.

For agents and developers:

- Public content lives under `content/`.
- Site identity assets such as source icons, favicon derivatives, PWA icons, and
  default OG images live under `content/assets/`.
- Site operations metadata is generated from `config.yml`.
- Theme-owned layout, CSS, scripts, and assets live under `themes/default/`.
- `content/assets/icon-source.png` and
  `content/assets/og-default-source.png` are source artwork. The
  asset helper script only crops/exports derived favicon, app icon, and OG
  files.
- `themes/default/scripts/*.js` are browser-side theme behavior and
  consent-aware feature loaders.
- `bin/pagekiln.mjs` and `src/*.mjs` are builder-side Node ESM code for CLI
  commands, config loading, content indexing, template rendering, asset
  generation, i18n, OG images, and discovery outputs.
- `src/pages/*.js` and `src/pages/**/*.js` are Astro endpoints for generated
  text, JSON, XML, and Markdown outputs.
- Generated output under `dist/` should not be edited by hand.

Prefer public Markdown mirrors, feeds, sitemap, `llms.txt`, `llms-full.txt`,
OpenAPI, API catalog, and MCP server card resources when reading the site.
