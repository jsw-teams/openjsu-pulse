---
title: Develop a Block and theme extension
description: A practical theme-first workflow for adding a Block, registering resources, testing it, and deploying the result.
pattern: docs
---

# Develop a Block and theme extension

Pagekiln secondary development starts in a copied theme. The compiler owns Markdown, schemas, routes, dependencies, assets, and output; the theme owns Patterns, Blocks, layout, CSS, browser ESM, icons, and privacy presentation. This page describes the current extension path.

## 1. Copy the theme boundary

Start in a new theme directory so the original theme remains a working reference:

```text
themes/<name>/
├─ theme.yml
├─ theme.ts
├─ style.css
├─ i18n.yml
└─ scripts/                 optional native browser ESM
```

`theme.yml` declares `theme.ts`, `style.css`, i18n resources, Patterns, Blocks, and plugin resources. Keep plugin names below the theme-level `plugins` switch. Theme i18n belongs in `themes/<name>/i18n.yml`, not in the root site config.

## 2. Add a Block in `theme.ts`

Use the small theme API and keep the Block schema scalar and explicit:

```ts
import { defineTheme } from '../../src/theme-api.ts';

export default defineTheme({
  name: 'nebula',
  patterns: {
    document: { name: 'document', contexts: ['page'], render: content => content }
  },
  blocks: {
    notice: {
      name: 'notice',
      schema: { tone: 'string' },
      render: (node, context) => {
        const tone = context.escapeHtml(node.attributes.tone || 'info');
        return `<aside class="notice notice--${tone}">${context.renderNodes(node.children)}</aside>`;
      }
    }
  }
});
```

`context.renderNodes` renders Markdown children. Use `context.escapeHtml` for text and attributes and `context.safeUrl` for links. Do not pass unreviewed Markdown, frontmatter, or config values through `unsafeHtml`.

Register the same Block in `theme.yml`:

```yaml
name: nebula
module: theme.ts
style: style.css
blocks:
  - notice
patterns:
  - document
plugins:
  privacyConsent:
    enabled: true
```

The schema in code and the registration in `theme.yml` are one contract. A name missing from the registration should fail discovery or check; do not hide an unregistered Block behind a compiler conditional.

## 3. Use the Block in Markdown

Add a directive to a page under `content/pages/`:

```markdown
:::notice{tone="info"}
The current instructions are in the Guide.
:::
```

The directive attribute is short and scalar. Headings, paragraphs, lists, tables, code, and links remain ordinary Markdown. If the Block describes a current behavior, use a page; if it records a dated implementation decision, use a Product Note with a required `date`.

## 4. Put visual behavior in one stylesheet

Add the Block rule to the theme's `style.css`:

```css
.notice{border-inline-start:3px solid var(--accent);padding:1rem 1.2rem;background:var(--panel);color:var(--ink)}
```

The compiler emits CSS as one compressed line and fingerprints the filename. Keep responsive behavior, focus states, table adaptation, icon sizing, and reduced-motion behavior in this stylesheet or declared theme resources. Delete overlapping old rules and dead compatibility files when the new rule replaces them; do not rely on cascade order to keep two designs alive.

The default theme uses the Lucide icon package through the theme module. Reuse the declared icon library instead of adding a second icon font or an inline SVG collection for the same controls.

## 5. Discover and test the extension

Run the commands in this order:

```bash
npm run compile-theme
npm run catalog
pagekiln inspect block:notice
pagekiln check
pagekiln g --profile
pagekiln s
```

`catalog` confirms the active theme's Patterns, Blocks, plugins, schema names, and resource dependencies. `inspect block:notice` answers one capability question as structured output. `check` catches unknown Blocks, invalid attributes, route collisions, and missing required fields with a source position. `g` confirms the Block renders to static output; `s` confirms the browser preview reloads after a theme or Markdown edit.

## 6. Add optional browser behavior

Put native ESM in `themes/<name>/scripts/` and declare it under the appropriate plugin. Give every optional plugin an explicit switch:

```yaml
plugins:
  privacyConsent:
    enabled: true
  search:
    enabled: true
```

Optional analytics or advertising scripts remain inert until the visitor grants the matching Cookie category. Essential consent storage is enabled by the privacy contract; the footer opens the same settings dialog that the visitor can reopen later. Browser code should be loaded once, with one owner per event handler. Delete a superseded script instead of leaving two handlers to compete.

## 7. Keep site settings and runtime code separate

`config.yml` contains site metadata, locales, collections, routes, schemas, privacy settings, and deployment destinations. It does not contain CSS paths, arbitrary HTML, or browser-script bodies. `backend/handler.ts` is the source location for dynamic requests, secrets, writes, and webhooks; use the shared Fetch router and compile the backend before deployment.

For a static-only site, leave backend execution off for Pages and serve `dist/` from a CDN, Caddy, or Nginx. For the configured deployment targets:

```yaml
deployment:
  targets: [cloudflare-pages]
  cloudflare:
    apiTokenEnv: CLOUDFLARE_API_TOKEN
    pages:
      project: example-site
      branch: production
```

```bash
pagekiln d --dry-run
pagekiln d
```

Use `targets: [cloudflare-pages, github-pages, vps]` when one release must publish to several destinations. Configure each provider's project, remote, branch, SSH host, user, port, remote path, and key path in `config.yml`; keep secret values in environment variables or the local SSH setup.

## 8. Measure a change

The optional fixture measures 100 temporary pages and reports JSON lines for cold, no-change, edit, add, delete, theme, and settings changes:

```bash
npm run compile-runtime
npm run compile-theme
npm run compile-backend
npm run bench -- 100
```

`maxRssMiB` is the Node process peak resident memory, not the output directory size. The fixture is removed after the run and is not a product performance promise.

## 9. Final extension checklist

```text
[ ] theme.ts exports the Block through defineTheme
[ ] theme.yml registers the Block and its resources
[ ] style.css owns the responsive and focus states
[ ] duplicate CSS, JS, and compatibility layers are deleted
[ ] plugin switches are explicit
[ ] i18n stays in themes/<name>/i18n.yml
[ ] pagekiln catalog and inspect describe the Block
[ ] pagekiln check, build, test, and preview pass
[ ] generated dist/ is reviewed and not edited manually
```
