---
title: OpenAI Sites deployment adaptation record
description: A dated record of the 2026-08-10 OpenAI Sites handoff experiment; current deployment follows the Guide and CLI help.
date: 2026-08-10
cover: /assets/product-note-cover.webp
pattern: blog
tags: [deployment, openai-sites]
---

# OpenAI Sites deployment adaptation record

This note records the OpenAI Sites handoff experiment completed on 2026-08-10. Pagekiln's current default configuration does not bind OpenAI Sites. The deploy code retains `openai-sites` as an optional connector handoff and requires existing Sites metadata. For current operation, use the [deployment section of Development](/en/development/) and CLI help; this note is deployment history, not the current deployment tutorial.

The experiment kept `dist/` as the single static root and tested how a validated build could be handed to an existing Sites project without putting a project id or token in the command line.

<more>

## Historical test configuration

The following configuration describes the experiment, not the current default. The current project keeps `deployment.targets` empty until a site owner selects a target in `config.yml`:

```yaml
deployment:
  targets: [openai-sites]
  openaiSites:
    metadata: .openai/hosting.json
    staticDirectory: dist
```

`.openai/hosting.json` represented an existing `project_id`. Sites supplied the short-lived connector credential; it did not belong in configuration, a remote URL, or a commit.

## What the experiment changed

The handoff checked `dist/server/index.js` and `dist/index.html`, then passed the source state and build output to the Sites connector. The tested order was to reference the exact source commit, save one version, deploy that saved version, and poll the production status. A transport failure had to retry the same save context; a stale commit required rebuilding from the real remote branch head.

The experiment also confirmed the static boundary: the generated output remains the artifact to serve, while dynamic requests use the shared Web Standard Fetch handler when the selected target supports it.

## Boundary and result

OpenAI Sites owns access mode, the public URL, and custom-domain verification. Pagekiln owns source, configuration, build output, and the deployment entry. A successful platform deployment only proves that the platform published the output; it does not guarantee access from every region, ISP, or enterprise network. DNS propagation, regional routing, firewalls, platform availability, and custom-domain state can leave some visitors unable to connect. Regional reachability requires tests from the regions served and an alternate path such as Cloudflare, GitHub Pages, or a VPS.

The local Sites binding was removed after the experiment. The optional adapter remains for an existing Sites project, while the current deployment choice belongs in the [current Development guide](/en/development/) and `config.yml`.
