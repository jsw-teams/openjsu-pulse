# OpenJSU Pulse

OpenJSU Pulse is a public service status page built with [Pagekiln](https://github.com/jsw-teams/pagekiln). The root `/` keeps Pagekiln's language picker; the current status dashboard is at `/zh-tw/`. There is no admin page. Detection points and thresholds are managed in `.github/probes.json`.

The example configuration checks `blog.openjsu.com` over HTTP, `dns.openjsu.com` as a recursive DNS resolver, and `openjsu.com` over HTTP. No probe result is committed to the source branch. Before the first scheduled run, the page stays in a waiting state.

The Pages workflow deploys the static dashboard shell when source files change. The scheduled probe workflow runs every five minutes, writes the latest JSON snapshot to `status-data/status/probes.json`, and never redeploys Pages. The browser fetches that branch at runtime with a cache-busting query string.

Edit `.github/probes.json` and push to `main`. A target has an `id`, `name`, and `type`. Supported types are `http`, `tcp`, `ping`, and `dns`:

```json
{
  "version": 1,
  "intervalMinutes": 5,
  "timeoutMs": 10000,
  "historyLimit": 12,
  "dns": { "query": "example.com" },
  "targets": [
    { "id": "portal", "name": "openjsu.com", "role": "Portal", "type": "http", "url": "https://openjsu.com", "expectedStatus": [200] },
    { "id": "resolver", "name": "dns.openjsu.com", "role": "Recursive DNS", "type": "dns", "host": "dns.openjsu.com", "query": "example.com" },
    { "id": "tls", "name": "openjsu.com:443", "role": "TCP", "type": "tcp", "host": "openjsu.com", "port": 443 },
    { "id": "icmp", "name": "openjsu.com ICMP", "role": "Ping", "type": "ping", "host": "openjsu.com" }
  ]
}
```

Latency bands match the supplied references: HTTP `0–3000ms` / `3000–6000ms` / `>6000ms`; PING `0–50ms` / `50–100ms` / `100–150ms` / `150–200ms` / `>200ms`; TCP `≤50ms` / `51–100ms` / `101–200ms` / `201–250ms` / `>250ms`, with timeouts shown in red. DNS uses `0–100ms` / `100–500ms` / `>500ms`.

GitHub-hosted Actions is a single probe location. The project does not invent nationwide or carrier-specific map points. That view needs multiple self-hosted runners or an external probe service.

For deployment, create a new public repository, set Pages to “GitHub Actions”, push `main`, and manually run `Probe status snapshot` once. If the repository token is read-only, allow read/write workflow permissions; the workflow requires `contents: write` to update `status-data`. Scheduled workflows have a five-minute minimum, run in UTC on the default branch, can be delayed under load, and may be disabled after 60 days without repository activity. Standard runners in public repositories are generally free; larger runners and private-repository usage follow account billing and quota rules. See the [Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions), [runner selection](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job), [scheduled events](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows), [Actions limits](https://docs.github.com/en/enterprise-cloud@latest/actions/reference/limits), and [Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits) documentation.

```bash
npm ci
npm run check
npm run build
```

`status/probes.json` is runtime output and belongs on `status-data`, not on `main`.
