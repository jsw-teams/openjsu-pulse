# OpenJSU Pulse

OpenJSU Pulse is a public service status page built with [Pagekiln](https://github.com/jsw-teams/pagekiln). The root `/` keeps the language picker. The dashboard is available in Traditional Chinese at `/zh-tw/`, Simplified Chinese at `/zh-cn/`, and English at `/en/`.

There is no admin page. Probe targets, probe types, timeouts, and thresholds are managed in `.github/probes.json`. GitHub Actions runs the checks on a schedule and updates the separate `status-data` branch.

The shipped demo contains three targets, all using HTTP: Blog, Recursive resolver, and Portal. Source addresses only exist in the Action configuration and probe runtime. They are not written to the public snapshot or rendered in the browser. The page exposes only a public name, one of three statuses, response time, uptime, and the latest 100 real checks.

## Runtime data flow

The page shell is deployed once. The `Probe status snapshot` workflow runs every five minutes, writes the latest result to `status-data/status/probes.json`, and the browser fetches that JSON when the page opens or when the user refreshes. A probe run never rebuilds Pages.

```text
.github/probes.json
        │
        ▼
GitHub Actions (every 5 minutes)
        │
        ▼
status-data/status/probes.json
        │
        ▼
The dashboard fetches the latest snapshot at runtime
```

Each run restores the previous snapshot, prepends the new real checks, and force-updates the same file. Each target keeps at most 100 checks. Missing history slots remain empty; the project does not fill them with demo results.

When the target set or probe type changes, run `Actions → Probe status snapshot → Run workflow` with `reset_history` set to `true` to discard the previous history. That run still uses only real probe results.

## Configure one or more targets

Edit `.github/probes.json` and commit it to the default `main` branch. Each target needs a unique `id`, a public display `name`, and a `type`.

### One HTTP target

```json
{
  "version": 1,
  "intervalMinutes": 5,
  "timeoutMs": 10000,
  "historyLimit": 100,
  "targets": [
    {
      "id": "portal",
      "name": "Portal",
      "type": "http",
      "url": "https://openjsu.com",
      "method": "GET",
      "expectedStatus": [200],
      "degradedAboveMs": 3000
    }
  ]
}
```

### Multiple HTTP targets

Add more objects to the same `targets` array. The shipped demo intentionally uses HTTP for all three OpenJSU services:

```json
{
  "version": 1,
  "intervalMinutes": 5,
  "timeoutMs": 10000,
  "historyLimit": 100,
  "targets": [
    { "id": "blog", "name": "Blog", "type": "http", "url": "https://blog.openjsu.com", "expectedStatus": [200], "degradedAboveMs": 3000 },
    { "id": "dns", "name": "Recursive resolver", "type": "http", "url": "https://dns.openjsu.com", "expectedStatus": [200], "degradedAboveMs": 3000 },
    { "id": "portal", "name": "Portal", "type": "http", "url": "https://openjsu.com", "expectedStatus": [200], "degradedAboveMs": 3000 }
  ]
}
```

### TCP and PING targets

Add targets like these when needed. `host` is used by the Action only and is not rendered in the frontend:

```json
[
  { "id": "portal-tcp", "name": "Portal TCP", "type": "tcp", "host": "openjsu.com", "port": 443 },
  { "id": "portal-ping", "name": "Portal network", "type": "ping", "host": "openjsu.com" }
]
```

The probe runner also supports `dns` targets with `host` (DNS server) and `query` (hostname to resolve).

| Field | Applies to | Purpose |
| --- | --- | --- |
| `intervalMinutes` | Global | Displayed schedule interval; the workflow currently runs every five minutes |
| `timeoutMs` | Global/target | Timeout, clamped to 500–30000ms |
| `historyLimit` | Global | Real checks retained per target, clamped to 1–100 |
| `url` | `http` | HTTP/HTTPS URL |
| `method` | `http` | HTTP method, default `GET` |
| `expectedStatus` | `http` | Accepted status codes, such as `200` or `[200, 204]`; without it, 2xx/3xx are accepted |
| `host` | `tcp`/`ping`/`dns` | Hostname or IP address |
| `port` | `tcp` | TCP port from 1 to 65535 |
| `query` | `dns` | Hostname to resolve |
| `degradedAboveMs` | Target | Successful checks above this latency become “Performance degraded” |

## Status model

The public page has exactly three indicators:

- **Service operational**: the check succeeded and stayed within the normal latency threshold.
- **Performance degraded**: the check succeeded but exceeded `degradedAboveMs`.
- **Service unavailable**: the check failed, timed out, or entered the probe type’s exceptional latency band.

Uptime is the percentage of recent real checks that were operational. Overall status is intentionally resilient: if at least one service is operational, the system remains “Service operational” while the page calls out that some services need attention. “Performance degraded” or “Service unavailable” is shown overall only when no service is operational.

The runner still uses the supplied reference latency bands internally, but the frontend does not display probe methods or those bands: HTTP `0–3000ms` / `3000–6000ms` / `>6000ms`; PING `0–50ms` / `50–100ms` / `100–150ms` / `150–200ms` / `>200ms`; TCP `≤50ms` / `51–100ms` / `101–200ms` / `201–250ms` / `>250ms`, with timeouts treated as unavailable; DNS `0–100ms` / `100–500ms` / `>500ms`.

GitHub-hosted Actions has one execution location. The project does not invent nationwide or carrier-specific map points. Multiple regions require self-hosted runners or an external probe service.

## GitHub deployment

This is a standalone project. Create a new public repository; do not push it back to the Pagekiln upstream repository.

### GitHub Pages

1. Push the project to a new public repository with `main` as the default branch.
2. Set `Settings → Pages` to use `GitHub Actions`.
3. `Build and publish Pages` uses Node.js 22, runs `npm ci` and `npm run build`, and publishes `dist`.
4. Manually run `Actions → Probe status snapshot` once and confirm that `status-data/status/probes.json` is created.

Pages deploys only the static shell. It must not use `status-data` as the build source. Source/config changes rebuild Pages; probe runs update the runtime JSON only.

### Cloudflare Pages

Set the production branch to `main`, the root directory to `/`, the build command to `npm run build`, the output directory to `dist`, and Node.js to version 22.

`status-data` is an orphan data branch containing only runtime JSON, so it has no `package.json`. If Cloudflare reports `ENOENT ... /repo/package.json` after checking out `status-data` or a probe-result commit, Pages is building the wrong branch. Select `main` in the Cloudflare dashboard and redeploy. `deployment.cloudflare.pages.branch: main` in `config.yml` records the intended setting but cannot change an existing Cloudflare integration by itself.

If repository policy gives `GITHUB_TOKEN` read-only permissions, enable read/write workflow permissions in `Settings → Actions → General → Workflow permissions`. The probe workflow declares `contents: write` and force-updates `status-data`; branch protection must allow the Actions bot to update that branch.

## GitHub Free public-repository limits

This project uses one standard `ubuntu-latest` GitHub-hosted runner. GitHub’s current documentation says standard GitHub-hosted runner usage is free and unlimited in public repositories. Larger runners are billed even for public repositories, and this project does not use them. See [GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) and [choosing a runner](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job).

Keep these limits in mind:

- `schedule` supports a minimum five-minute interval, runs in UTC, and triggers only on the default branch. Scheduled jobs can be delayed under load and may be disabled after a long period of repository inactivity. See [workflow events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows).
- Actions has platform limits for concurrency, job duration, API requests, and storage. This project’s single-job, single-runner, single-file update is far below the usual limits. See [Actions limits](https://docs.github.com/en/enterprise-cloud@latest/actions/reference/limits).
- GitHub Pages is available for public repositories, but published sites have limits including 1GB source/published size, a 10-minute deployment timeout, a 100GB/month soft bandwidth limit, and a 10-builds/hour soft limit. The hourly build limit does not apply when using a custom GitHub Actions publishing workflow. See [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits).
- A GitHub-hosted runner is not a multi-region SLA monitoring system. Use a monitoring provider or self-hosted runners for second-level frequency, regional coverage, or a formal availability commitment.

For `status.openjsu.com`, bind the custom domain in Pages and follow the platform’s DNS instructions. `config.yml` already reserves that site URL.

## Local checks

```bash
npm ci
npm run check
npm run build
```

`status/probes.json` is runtime output and belongs on `status-data`, not `main`. Before the first probe run, the page stays in a waiting state instead of showing fabricated results.

## License

MIT, inherited from Pagekiln. Page, configuration, and workflow changes in this repository belong to OpenJSU Pulse.
