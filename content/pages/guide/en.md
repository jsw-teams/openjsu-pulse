---
title: Install, preview, build, and deploy Pagekiln
description: The practical path from a new Pagekiln site to a checked, previewed, and deployable dist directory.
pattern: docs
---

# Install, preview, build, and deploy Pagekiln

This is the current operating guide. `pages` describes how the site works now; `posts` records dated product changes. If the compiler or theme behavior changes, update this page and the other current pages. Read the [development guide](/en/development/) when the task is to add a Block or change the theme.

## 1. Install

Pagekiln requires Node.js `>=22.12.0` and npm. In a checkout of this repository:

```bash
git clone https://github.com/jsw-teams/pagekiln.git
cd pagekiln
npm install
```

Compile the runtime, theme, and backend once before using the source checkout:

```bash
npm run compile-runtime
npm run compile-theme
npm run compile-backend
```

To create a neutral site in another directory, link the local CLI and copy the real `starter/` template:

```bash
npm link
mkdir my-site
cd my-site
pagekiln init
```

`pagekiln init` does not create a second template hidden in the CLI. It copies `starter/`, including `config.yml`, content, and theme resources.

## 2. Write the first content

The source tree has two collections:

```text
content/
├─ pages/<id>/<locale>.md       current site information
├─ posts/<id>/<locale>.md       dated Product Notes
└─ assets/                      images and other site assets
```

Write a current page in `content/pages/`. Home, About, Guide, Reference, and directory pages belong there when they answer what the site does now. `docs` is a Pattern inside `pages`, not a third collection.

```markdown
---
title: Local search
description: How the current build indexes content and marks result locations.
pattern: docs
---

# Local search

Pagekiln currently creates a locale-specific static index and labels each result by the matching title, section, content, or path.
```

Write a Product Note in `content/posts/<id>/<locale>.md` only when recording one dated decision, implementation, release, incident, deployment, or measurement. The `date` field is required.

```markdown
---
title: Search results gained hit locations
description: Record the 2026-08-10 change that added visible hit-location labels.
date: 2026-08-10
pattern: blog
---

# Search results gained hit locations

This note records what changed on that date and why. The current search instructions remain in the Guide.
```

When current behavior changes, update the existing page. Keep an old Product Note as history and add a new note for a new dated change. This keeps `pages` as current state and `posts` as chronological history.

## 3. Check the source

Run the check before previewing or deploying:

```bash
pagekiln check
```

The check validates YAML frontmatter, required schema fields, collection routes, translation groups, Pattern and Block names, directive attributes, and route collisions. A missing Product Note `date` fails the check; a current page does not need a date.

Use source discovery when you need to know what the active theme actually provides:

```bash
pagekiln catalog
pagekiln inspect collection:pages
pagekiln inspect collection:posts
pagekiln inspect block:notice
```

`catalog` reads the source-backed capability surface without requiring a complete site build. `inspect` returns structured facts for a content id or an explicit namespace.

## 4. Preview locally

Start the incremental preview server:

```bash
pagekiln s
```

Open [http://127.0.0.1:4173/](http://127.0.0.1:4173/). Use another port when the default is occupied:

```bash
pagekiln s --port=4174
```

The server builds once, watches `config.yml`, `content/`, and `themes/`, and reloads the browser after an affected output is rebuilt. A Markdown, frontmatter, CSS, or theme change is therefore visible in the preview without restarting the process. A diagnostic build error is printed while the preview process remains available for the next fix.

From the repository checkout, the equivalent npm aliases are `npm run s` and `npm run s -- --port=4174`.

## 5. Build `dist/`

Generate the publishable static output:

```bash
pagekiln g
pagekiln g --profile
```

The short command is the same operation as `pagekiln build`. It writes `dist/`, including HTML, one-line fingerprinted CSS, browser ESM assets, feeds, sitemap, search data, `llms.txt`, the custom 404 page, and target-specific deployment files. The build profile is stored at `dist/.pagekiln/build-profile.json`.

The source checkout can use `npm run g -- --profile`. Do not edit `dist/` by hand; edit the source and generate it again.

## 6. Deploy from `config.yml`

Deployment is configured in the site file, not by passing provider credentials on the command line. Select one target or several:

```yaml
deployment:
  targets: [cloudflare-pages, vps]
  cloudflare:
    apiTokenEnv: CLOUDFLARE_API_TOKEN
    pages:
      project: example-site
      branch: production
  vps:
    host: vps.example.com
    user: deploy
    port: 22
    remotePath: /var/www/example-site
    identityFile: ~/.ssh/id_ed25519
    publicKeyFile: ~/.ssh/id_ed25519.pub
```

The supported targets are `cloudflare-pages`, `cloudflare-workers`, `github-pages`, `vps`, and the optional `openai-sites` connector handoff. Credentials stay in environment variables, a local SSH agent, or the SSH key files; do not put tokens or private key contents in `config.yml`.

Inspect the resolved actions before uploading:

```bash
pagekiln d --dry-run
```

Upload selected targets after the dry run:

```bash
pagekiln d
```

`pagekiln d` builds first. Cloudflare Pages publishes `dist/` with Wrangler; Cloudflare Workers uses the generated standard module Worker; GitHub Pages pushes `dist/` to the configured remote branch; VPS copies `dist/` with SCP to the configured path. A VPS host must already have SSH access, the destination directory, and the public key in `authorized_keys` when key authentication is used.

Cloudflare Pages is static when `deployment.backend: false`; the backend-enabled Advanced Mode output is a different deployment boundary. A CDN, Caddy, or Nginx can serve the static `dist/` directly. OpenAI Sites is not the default binding for this project and may be unavailable from some regions; test the final domain from the regions that matter.

## 7. Change the theme or add a Block

Copy a theme into `themes/<name>/` and implement a Block in `theme.ts`. Register it in `theme.yml`, put its styles in the unified `style.css`, then run `catalog`, `inspect`, `check`, `build`, and `serve`. The complete example is in [Secondary development](/en/development/).

Do not add a second CSS file, browser script, or compatibility wrapper to preserve a superseded implementation. When a redesign replaces an old rule or handler, delete the duplicate and verify the generated output.

## 8. Before publishing

```bash
npm test
pagekiln check
pagekiln g --profile
pagekiln inspect collection:posts
pagekiln d --dry-run
```

Check the three language links, the custom 404 route, `feed.xml`, `sitemap.xml`, `llms.txt`, optional Cookie scripts, keyboard focus, narrow-screen tables, and the generated deployment files. Product Notes must appear in date-descending archive/feed output; current pages must not be forced to carry a date.
