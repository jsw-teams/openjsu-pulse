# OpenJSU Pulse

OpenJSU Pulse 是基于 [Pagekiln](https://github.com/jsw-teams/pagekiln) 的公开服务状态页。根路径 `/` 保留语言选择页，状态页提供繁体中文 `/zh-tw/`、简体中文 `/zh-cn/` 和英文 `/en/` 三个入口。

项目没有管理页。检测点、检测类型、超时时间和阈值统一由仓库中的 `.github/probes.json` 配置，GitHub Actions 负责定时探测并更新独立的 `status-data` 分支。

当前示例有三个检测点，且全部使用 HTTP：

- 博客
- 递归解析器
- 门户

示例源站地址只存在于 Action 配置和探针执行环境中，不会写入公开快照或渲染到前端。页面只显示配置中的公开名称、三种状态、响应耗时、正常率和最近 100 次真实检查。

## 动态数据链路

页面只部署一次静态展示壳。`Probe status snapshot` 工作流按 5 分钟计划运行探针，把最新结果写入独立的 `status-data/status/probes.json`；浏览器打开页面或点击刷新时，直接读取最新 JSON。单次探测不会触发 Pages 重新构建。

```text
.github/probes.json
        │
        ▼
GitHub Actions（每 5 分钟）
        │
        ▼
status-data/status/probes.json
        │
        ▼
状态页运行时读取最新快照
```

每次 Action 会恢复上一版快照，把本次真实检查放到历史最前面，并覆盖写回同一个文件。每个检测点最多保留 100 条检查；历史不足 100 条时，页面显示空白柱位，不会用演示数据补齐。

如果更换检测点或检测协议后需要清除旧历史，可在 `Actions → Probe status snapshot → Run workflow` 中将 `reset_history` 设为 `true`。该次运行仍只使用真实探测结果，后续定时运行继续追加。

## 配置一个或多个检测点

编辑 `.github/probes.json` 并提交到默认分支 `main`。`targets` 至少需要一项，每项需要唯一的 `id`、前端显示用的 `name` 和 `type`。

### 单个 HTTP 检测

```json
{
  "version": 1,
  "intervalMinutes": 5,
  "timeoutMs": 10000,
  "historyLimit": 100,
  "targets": [
    {
      "id": "portal",
      "name": "门户",
      "type": "http",
      "url": "https://openjsu.com",
      "method": "GET",
      "expectedStatus": [200],
      "degradedAboveMs": 3000
    }
  ]
}
```

### 多个 HTTP 检测

将更多对象放入同一个 `targets` 数组即可。仓库内的示例统一使用 HTTP：

```json
{
  "version": 1,
  "intervalMinutes": 5,
  "timeoutMs": 10000,
  "historyLimit": 100,
  "targets": [
    {
      "id": "blog",
      "name": "博客",
      "type": "http",
      "url": "https://blog.openjsu.com",
      "expectedStatus": [200],
      "degradedAboveMs": 3000
    },
    {
      "id": "dns",
      "name": "递归解析器",
      "type": "http",
      "url": "https://dns.openjsu.com",
      "expectedStatus": [200],
      "degradedAboveMs": 3000
    },
    {
      "id": "portal",
      "name": "门户",
      "type": "http",
      "url": "https://openjsu.com",
      "expectedStatus": [200],
      "degradedAboveMs": 3000
    }
  ]
}
```

### TCP 与 PING 检测

需要启用其他探针时，在 `targets` 中加入对应对象。TCP 和 PING 的地址只用于 Action 执行，不会展示在前端：

```json
[
  {
    "id": "portal-tcp",
    "name": "门户 TCP",
    "type": "tcp",
    "host": "openjsu.com",
    "port": 443
  },
  {
    "id": "portal-ping",
    "name": "门户网络",
    "type": "ping",
    "host": "openjsu.com"
  }
]
```

当前探针也兼容 `dns` 类型：它需要 `host`（DNS 服务器）和 `query`（要解析的域名）。

常用字段如下：

| 字段 | 适用类型 | 作用 |
| --- | --- | --- |
| `intervalMinutes` | 全局 | 页面显示的计划周期；工作流计划当前为 5 分钟 |
| `timeoutMs` | 全局/单点 | 超时时间，限制在 500–30000ms |
| `historyLimit` | 全局 | 每个检测点保留的真实检查数，限制在 1–100 |
| `url` | `http` | HTTP/HTTPS 地址 |
| `method` | `http` | HTTP 方法，默认 `GET` |
| `expectedStatus` | `http` | 允许的状态码，例如 `200` 或 `[200, 204]`；未配置时接受 2xx/3xx |
| `host` | `tcp`/`ping`/`dns` | 主机名或 IP 地址 |
| `port` | `tcp` | 1–65535 的 TCP 端口 |
| `query` | `dns` | 要解析的域名 |
| `degradedAboveMs` | 单点 | 超过该延迟标记为“性能下降” |

## 页面状态

页面只对外展示三个指标：

- **服务正常**：探测成功，且响应耗时处于正常阈值内。
- **性能下降**：探测成功，但响应耗时超过 `degradedAboveMs`。
- **服务异常**：请求失败、超时或进入该探针类型的异常延迟分档。

“正常率”只统计最近历史中“服务正常”的真实检查。总体状态用于快速判断，不会因为单个服务降级或异常就把仍有正常服务的系统整体点成红灯：只要至少一个服务正常，总体保持“服务正常”，同时在说明中提示部分服务需要关注；只有没有任何正常服务时，才显示“性能下降”或“服务异常”。

探针内部仍按参考标准分类延迟，但这些检测方法和分档不会出现在前端：

| 类型 | 内部分档 |
| --- | --- |
| HTTP | 绿色 `0–3000ms`；黄色 `3000–6000ms`；红色 `>6000ms` |
| PING | 绿色 `0–50ms`；浅绿 `50–100ms`；黄色 `100–150ms`；橙色 `150–200ms`；红色 `>200ms` |
| TCP | 深绿 `≤50ms`；绿色 `51–100ms`；浅绿 `101–200ms`；黄色 `201–250ms`；橙色 `>250ms`；超时为异常 |
| DNS | 绿色 `0–100ms`；黄色 `100–500ms`；红色 `>500ms` |

GitHub-hosted runner 只有一个执行位置，项目不会伪造全国地域或运营商地图数据。要做多地域探测，需要增加不同位置的 self-hosted runner 或外部探针，并扩展结果模型。

## GitHub 部署

这是一个独立项目，应创建新的公共仓库，不要推送回 Pagekiln 上游仓库。

### GitHub Pages

1. 把项目推送到新的 public repository，默认分支使用 `main`。
2. 在 `Settings → Pages` 将构建来源设为 `GitHub Actions`。
3. `Build and publish Pages` 使用 Node.js 22 执行 `npm ci` 和 `npm run build`，发布 `dist`。
4. 在 `Actions → Probe status snapshot` 中手动运行一次，确认 `status-data` 分支产生 `status/probes.json`。

Pages 只部署页面静态壳，不需要把 `status-data` 分支作为构建源。修改 `.github/probes.json` 后，下一次探测工作流会读取新配置；修改页面、主题或工作流源文件时，Pages 工作流才会重新部署。

### Cloudflare Pages

如果使用 Cloudflare Pages，请将生产分支设置为 `main`，根目录设为仓库根目录 `/`，构建命令设为 `npm run build`，输出目录设为 `dist`，Node.js 版本设为 22。

`status-data` 是只包含运行时 JSON 的孤立数据分支，没有 `package.json`。如果 Cloudflare 日志出现 `ENOENT ... /repo/package.json`，并且日志显示检出 `status-data` 或类似的探测结果提交，原因就是 Pages 选错了构建分支；把生产分支改回 `main` 后重新部署即可。配置中的 `deployment.cloudflare.pages.branch: main` 只是项目记录，不能替代 Cloudflare 控制台中的分支设置。

如果组织策略把 `GITHUB_TOKEN` 默认权限设为只读，请在仓库 `Settings → Actions → General → Workflow permissions` 允许工作流读写仓库内容。探测工作流声明了 `contents: write`，并会强制更新 `status-data` 分支；若该分支启用了保护规则，需要允许 Actions bot 更新它。

## GitHub Free 公共仓库限制

本项目使用单个 `ubuntu-latest` 标准 GitHub-hosted runner。GitHub 当前文档说明，公共仓库使用标准 GitHub-hosted runner 的 Actions 运行时间免费且不限量；较大规格 runner 即使在公共仓库中也会计费，本项目没有使用它们。详见 [GitHub Actions 计费](https://docs.github.com/en/billing/concepts/product-billing/github-actions)、[选择 runner](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job)。

还需要留意：

- `schedule` 的最短支持间隔是 5 分钟，按 UTC 运行，并且只在默认分支上触发；高负载时可能延迟，公共仓库长时间没有活动时计划任务可能被自动禁用。详见 [工作流事件](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)。
- Actions 仍有并发、单个 job 运行时长、API 请求和存储等平台限制；当前工作流是单 job、单 runner、单 JSON 文件更新，远低于常见限制。详见 [Actions limits](https://docs.github.com/en/enterprise-cloud@latest/actions/reference/limits)。
- GitHub Pages 公共仓库可用，但发布站点有 1GB 源码/发布容量、10 分钟部署超时、每月 100GB 软带宽和每小时 10 次构建等限制；使用自定义 Actions 工作流时，10 次/小时的构建软限制不适用于该工作流。详见 [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)。
- GitHub-hosted runner 是单一云端位置，不等同于跨地域 SLA 监控。若需要秒级频率、多个地区或严格可用性承诺，应接入专业监控服务或自托管 runner。

如果使用 `status.openjsu.com`，在 Pages 设置中绑定自定义域名并按平台提示配置 DNS；`config.yml` 的 `siteUrl` 已预留该域名。

## 本地检查

```bash
npm ci
npm run check
npm run build
```

`status/probes.json` 是运行时输出，不应提交到 `main`；探测工作流会把它发布到 `status-data`。在没有快照时，页面保持等待状态，不会展示编造的探测结果。

## License

沿用 Pagekiln 的 MIT License；本项目的页面、配置和工作流改动属于 OpenJSU Pulse。
