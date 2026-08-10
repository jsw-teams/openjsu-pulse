---
title: Publishing dist through OpenAI Sites
description: The current Pagekiln boundary for handing a validated dist build to OpenAI Sites.
date: 2026-08-10
cover: /assets/product-note-cover.webp
pattern: blog
tags: [deployment, openai-sites]
---

# Publishing dist through OpenAI Sites

This deployment keeps `dist` as the single static root. Pagekiln generates the pages and the Sites `server/index.js` entry, then hands the same validated source state and build output to OpenAI Sites; the site does not ask the command line to invent a project ID or token.

<more>

## Configuration states site facts

The site-root configuration keeps the project binding and static root together:

```yaml
deployment:
  targets: [openai-sites]
  openaiSites:
    metadata: .openai/hosting.json
    staticDirectory: dist
```

`.openai/hosting.json` stores only an existing `project_id`. Sites provides a short-lived source credential for the connector handoff; it must not enter configuration, a remote URL, or a commit.

## Publishing order

Run `pagekiln g` and `pagekiln check`, then `pagekiln d --dry-run` to inspect the selected target. The deployment script checks `dist/server/index.js` and `dist/index.html`, then hands the operation to the Sites connector: push the exact HEAD of the current source branch, save one version referencing that commit, deploy the saved version, and poll the production status.

The archive contains `dist/`, Sites metadata, and the required dynamic entry. Page requests use the same Web Standard Fetch handler; static files use `dist` as their root, and the generated fallback beside the entry handles platforms that do not inject a static binding.

## Keep one publish context when something fails

`Transport send error` is a temporary connector transport failure. After a short wait, retry the same save operation; do not create another site or invent another project ID. If Sites returns `stale_commit_sha`, read the real remote branch HEAD, rebuild an archive from that exact commit, and save again. Deploy only after saving a version succeeds.

## Boundary of this decision

OpenAI Sites owns access mode, the public URL, and custom domains; domain verification still requires the DNS records supplied by the platform at the domain provider. Pagekiln owns source, configuration, build output, and the verifiable deployment entry, and never writes platform credentials into site files.
