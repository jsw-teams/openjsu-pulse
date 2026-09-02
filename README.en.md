# OpenJSU Pulse

OpenJSU Pulse is a public service status page built with [Pagekiln](https://github.com/jsw-teams/pagekiln). The root `/` keeps Pagekiln's language picker; the current status dashboard is at `/zh-tw/`. There is no admin page. Detection points and thresholds are managed in `.github/probes.json`.

The example configuration checks `blog.openjsu.com` (blog), `dns.openjsu.com` (recursive resolver entry), and `openjsu.com` (portal), all over HTTP. No probe result is committed to the source branch. Before the first scheduled run, the page stays in a waiting state.

The Pages workflow deploys the static dashboard shell when source files change. The scheduled probe workflow runs every five minutes, restores the previous snapshot from `status-data`, prepends the latest checks, keeps at most 100 checks per target, and overwrites `status-data/status/probes.json`. It never redeploys Pages. The browser fetches that branch at runtime with a cache-busting query string.

Edit `.github/probes.json` and push to `main`. A target has an `id`, `name`, and `type`. Supported types are `http`, `tcp`, `ping`, and `dns`. The shipped demo uses HTTP for all three OpenJSU targets:

```json
{
  "version": 1,
  "intervalMinutes": 5,
  "timeoutMs": 10000,
  "historyLimit": 100,
  "targets": [
    { "id": "blog", "name": "blog.openjsu.com", "role": "Blog", "type": "http", "url": "https://blog.openjsu.com", "expectedStatus": [200], "degradedAboveMs": 3000 },
    { "id": "dns", "name": "dns.openjsu.com", "role": "Recursive resolver", "type": "http", "url": "https://dns.openjsu.com", "expectedStatus": [200], "degradedAboveMs": 3000 },
    { "id": "portal", "name": "openjsu.com", "role": "Portal", "type": "http", "url": "https://openjsu.com", "expectedStatus": [200], "degradedAboveMs": 3000 }
  ]
}
```

To monitor one endpoint, leave one object in `targets`. To monitor several endpoints, add more objects to the same array. HTTP targets accept an HTTP/HTTPS URL, optional `method` (default `GET`), optional `expectedStatus`, and optional `degradedAboveMs`.

For TCP and PING, add targets like these:

```json
[
  { "id": "portal-tcp", "name": "openjsu.com:443", "role": "TLS port", "type": "tcp", "host": "openjsu.com", "port": 443 },
  { "id": "portal-ping", "name": "openjsu.com ICMP", "role": "Connectivity", "type": "ping", "host": "openjsu.com" }
]
```

Each target keeps up to 100 checks. The workflow restores the previous `status-data/status/probes.json` before each run, writes the new result plus history, and force-updates that same file so history is carried forward rather than replaced with fabricated data.

If the target set or probe protocols change and the old history should be discarded, run `Actions → Probe status snapshot → Run workflow` with `reset_history` enabled. That run skips the old snapshot and creates a new history from real probe results; scheduled runs then append to it normally.

Latency bands match the supplied references: HTTP `0–3000ms` / `3000–6000ms` / `>6000ms`; PING `0–50ms` / `50–100ms` / `100–150ms` / `150–200ms` / `>200ms`; TCP `≤50ms` / `51–100ms` / `101–200ms` / `201–250ms` / `>250ms`, with timeouts shown in red. DNS uses `0–100ms` / `100–500ms` / `>500ms`.

The page exposes exactly three status indicators: “服务正常” (successful and within the normal threshold), “性能下降” (successful but above `degradedAboveMs`), and “服务异常” (failed, timed out, or in the red latency band). `uptime` is the percentage of recent checks that were “服务正常”; each service shows 100 history bars, with empty slots until enough real checks exist.

GitHub-hosted Actions is a single probe location. The project does not invent nationwide or carrier-specific map points. That view needs multiple self-hosted runners or an external probe service.

For deployment, create a new public repository, set Pages to “GitHub Actions”, push `main`, and manually run `Probe status snapshot` once. If the repository token is read-only, allow read/write workflow permissions; the workflow requires `contents: write` to update `status-data`. Scheduled workflows have a five-minute minimum, run in UTC on the default branch, can be delayed under load, and may be disabled after 60 days without repository activity. Standard runners in public repositories are generally free; larger runners and private-repository usage follow account billing and quota rules. See the [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [runner selection](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job), [scheduled events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [Actions limits](https://docs.github.com/en/enterprise-cloud@latest/actions/reference/limits), and [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) documentation.

```bash
npm ci
npm run check
npm run build
```

`status/probes.json` is runtime output and belongs on `status-data`, not on `main`.
