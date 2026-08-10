---
title: Secondary development starts in the theme
description: Change Patterns, Blocks, and the unified stylesheet first; use plugin switches for optional browser behavior and backend for runtime needs.
pattern: docs
---

# Secondary development starts in the theme

Pagekiln puts its extension boundary in the theme. Content, collections, routes, locales, search, image caching, and deployment output belong to the core; new page structure and visual language start in `themes/<name>/`.

## The directory is the capability map

```text
themes/default/
├─ theme.yml                 Patterns, Blocks, resources, plugin declarations
├─ theme.ts                  page shell, Pattern, and Block renderers
├─ style.css                 global layout, responsive, accessibility styles
├─ i18n.yml                  localized theme UI messages
└─ scripts/                  native ESM needed after consent or by a page
```

`src/` is the compiler and Fetch router. `backend/` is only for requests, secrets, writes, and webhooks. `config.yml` manages site information, collections, routes, capability switches, and deployment settings; it is not a CSS, HTML, or script injection surface.

## The theme contract

The theme module exports `defineTheme`:

```ts
import { defineTheme } from '../../src/theme-api.ts';

export default defineTheme({
  name: 'default',
  patterns: {
    document: { name: 'document', contexts: ['page'], render: content => content }
  },
  blocks: {
    notice: {
      name: 'notice',
      schema: { tone: 'string' },
      render: (node, context) => `<aside class="notice">${context.renderNodes(node.children)}</aside>`
    }
  }
});
```

Declare Block attributes in the schema first. Renderers use `context.escapeHtml`, `context.safeUrl`, and `context.renderNodes`; do not concatenate unreviewed input into raw HTML. `unsafeHtml` is reserved for trusted fragments that have crossed the compiler review boundary.

## Add a page structure from the theme directory

1. Add a Pattern or Block in `theme.ts` and declare its context.
2. Register its name, scalar attributes, schema example, and resource dependencies in `theme.yml`.
3. Complete desktop, narrow-screen, and focus states in `style.css` or theme resources; keep the default visual system free of unnecessary motion.
4. Run `npm run catalog`, then use `pagekiln inspect block:<id>` or `pattern:<id>` to verify the local capability.
5. Build a real Markdown example with `pagekiln check` and `pagekiln g --profile`.

Reuse an existing Block when it expresses the content. Page archives, product notes, language switching, excerpts, covers, the Feed, sitemap, and local search are core capabilities; a project does not need to copy another page engine for them.

## How search points to the match

The compiler creates a static index for each locale. The default theme ranks title, summary, section, content, and path hits in the browser. Each result labels the hit location, takes a nearby snippet, and marks the exact matching text. A single Latin letter asks for more input, so typing `n` does not return a noisy list; a single Chinese character remains searchable.

The search script uses native Fetch and DOM APIs, not a framework. When an index exceeds the shard threshold, the entry JSON lists shard URLs instead of loading one large file.

## Mobile and animation boundaries

The default theme uses a single-column reading flow, a right-side expandable outline, responsive tables with `data-label`, and a narrow layout that does not depend on a horizontal scrollbar. Its stylesheet intentionally has no transition or keyframe animation; interaction is communicated by color, border, focus, and open states. `prefers-reduced-motion: reduce` keeps scroll behavior explicit. Check new components at 320px, with long CJK headings, long paths, and keyboard input.

## Cookie, asset, and cache behavior

Cookie categories, retention, copy, and provider integrations live in `privacy.cookieConsent` in `config.yml`; the `privacyConsent` theme plugin declares its script and has an `enabled` switch. Optional scripts appear only as `<template>` before a choice and are inserted after consent. Human visitors see a footer settings entry; machines read `/.well-known/agent.json`.

Built CSS is minified to one line. CSS and browser ESM filenames carry a theme fingerprint such as `style.<fingerprint>.css`, and asset links use no query string. Image cache keys include the source, parameters, and Sharp version; an unchanged image is not processed again.

## The build graph and reproducible measurement

One BuildContext handles discovery, loading, parsing, validation, routing, rendering, and writes. A normal edit uses mtime and size as the fast path, then hashes changed inputs; only affected pages and outputs are written. `.pagekiln/manifest.json`, the dependency graph, and output hashes are recoverable without a database.

When a measurement is useful, use the temporary fixture:

```bash
npm run compile-runtime
npm run compile-theme
npm run compile-backend
npm run bench -- 100
```

The fixture is for local measurement. It does not read the example site's content or write the production `dist/`. The complete JSON keeps every scenario, phase, and machine field. `maxRssMiB` is the peak resident memory of the Node build process; one MiB is 1,024² bytes. It is not the size of `dist/` or the memory used by one page.

## Deployment boundaries

- A CDN, Caddy, or Nginx serves `dist/` directly.
- Cloudflare Workers use a static-asset binding and a standard module worker; static requests stay in the asset layer first.
- Cloudflare Pages is static when backend is off and emits Advanced Mode `_worker.js` when backend is on.
- The VPS dynamic entry uses `Deno.serve`; Caddy or Nginx still serves static files.

All three dynamic targets import the same Fetch handler. Secrets come only from runtime bindings or environment variables.

`pagekiln d` builds before publishing. From this source checkout, use `npm run d`; the bare command is available after `npm link` or a package installation. Put one target or a target list and each provider's destination in `config.yml`; the command only accepts `--dry-run` for inspection. Selected targets run in order. Cloudflare Pages uses Wrangler, GitHub uses `git subtree`, `vps` uses OpenSSH SCP, and `openai-sites` requires an existing `.openai/hosting.json` for the Sites connector handoff.

```yaml
deployment:
  targets: [vps]
  cloudflare:
    accountId: CF_ACCOUNT_ID
    apiTokenEnv: CLOUDFLARE_API_TOKEN
    pages:
      project: site-name
      branch: production
    workers:
      name: site-worker
      compatibilityDate: '2026-08-10'
  github:
    remote: origin
    branch: gh-pages
    tokenEnv: GITHUB_TOKEN
  vps:
    host: vps.example.com
    user: deploy
    port: 22
    remotePath: /var/www/site
    identityFile: ~/.ssh/id_ed25519
    publicKeyFile: ~/.ssh/id_ed25519.pub
```

`cloudflare.pages.project` is the Pages project name; `cloudflare.workers.name` and `compatibilityDate` identify the Worker generated in `dist/wrangler.toml`. When `cloudflare.apiTokenEnv` is set, deployment reads the token from that environment variable; when omitted, Wrangler uses its local login. `github.remote` and `branch` must already exist locally; an HTTPS remote can use the environment token named by `github.tokenEnv`, while an SSH remote uses the local SSH agent/config. VPS requires the SSH host, user, port, and an existing remote directory; `identityFile` is the private key and `publicKeyFile` is optional, with the public key pre-installed in the server's `authorized_keys`. Credentials stay outside this file.

OpenAI Sites remains an optional adapter, but this project has removed its Sites binding. A hosting platform reporting a successful deployment does not imply access from every region; DNS, ISP routing, enterprise network policy, platform regional availability, and custom-domain state can still cause failures. Test from target regions and keep Cloudflare, GitHub Pages, or VPS as alternative delivery paths when broad reachability matters.

```bash
pagekiln d --dry-run
pagekiln d
```

## After a change

```bash
npm run compile-runtime
npm run compile-theme
npm run compile-backend
npm test
pagekiln check
npm run catalog
npm run inspect -- home
pagekiln g --profile
```

Check generated HTML, 404, Feed, sitemap, search indexes, `llms.txt`, deployment files, and fingerprinted theme files. `dist/` is generated output; do not edit it by hand.
