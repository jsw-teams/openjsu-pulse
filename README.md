# OpenJSU Pulse

OpenJSU Pulse 是一个基于 [Pagekiln](https://github.com/jsw-teams/pagekiln) 的公开服务状态页。`/` 保留 Pagekiln 的语言选择页，当前状态面板位于 `/zh-tw/`；没有管理页，检测点、检测类型和阈值全部由仓库中的 `.github/probes.json` 决定。

当前配置示例包含：

- `blog.openjsu.com`：博客，HTTP 检测
- `dns.openjsu.com`：递归解析器入口，HTTP 检测
- `openjsu.com`：门户，HTTP 检测

仓库中不包含任何预填的探测结果。首次运行 GitHub Actions 前，页面显示等待状态。

## 动态数据链路

页面代码只发布一次静态展示壳。`Probe status snapshot` 工作流按计划运行探针，将最新结果写入独立的 `status-data` 分支中的 `status/probes.json`；浏览器打开页面或点击“刷新快照”时，直接读取该 JSON。每次探测不会触发 Pages 重新构建。

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
首页运行时 fetch 最新快照
```

探测工作流每次会先恢复 `status-data` 上一版的 `status/probes.json`，再把本次真实探测结果放在历史最前面，并覆盖写回同一个文件；每个检测点最多保留 100 条历史。它只更新 `status-data`，Pages 工作流只在页面源文件变化时部署。因此，状态结果是动态反馈的，同时页面布局仍是可缓存的静态文件。

如果更换了一批检测点或检测协议，需要清除旧历史时，可在 `Actions → Probe status snapshot → Run workflow` 中勾选 `reset_history`。这会跳过旧快照，仅由本次 Action 生成新的真实结果；之后的定时运行会继续从这份新历史追加。

## 配置一个或多个检测点

编辑 `.github/probes.json` 后提交到 `main`。`targets` 至少要有一项，每个检测点需要唯一的 `id`、显示名称 `name` 和 `type`。

### 单个 HTTP 检测点

```json
{
  "version": 1,
  "intervalMinutes": 5,
  "timeoutMs": 10000,
  "historyLimit": 100,
  "targets": [
    {
      "id": "portal",
      "name": "openjsu.com",
      "role": "门户",
      "type": "http",
      "url": "https://openjsu.com",
      "method": "GET",
      "expectedStatus": [200],
      "description": "OpenJSU 主门户与服务入口",
      "degradedAboveMs": 3000
    }
  ]
}
```

### 多个检测点

将对象继续放入同一个 `targets` 数组即可。当前示例统一使用 HTTP：

```json
{
  "version": 1,
  "intervalMinutes": 5,
  "timeoutMs": 10000,
  "historyLimit": 100,
  "targets": [
    {
      "id": "blog",
      "name": "blog.openjsu.com",
      "role": "博客",
      "type": "http",
      "url": "https://blog.openjsu.com",
      "expectedStatus": [200],
      "degradedAboveMs": 3000
    },
    {
      "id": "dns",
      "name": "dns.openjsu.com",
      "role": "递归解析器",
      "type": "http",
      "url": "https://dns.openjsu.com",
      "expectedStatus": [200],
      "degradedAboveMs": 3000
    },
    {
      "id": "portal",
      "name": "openjsu.com",
      "role": "门户",
      "type": "http",
      "url": "https://openjsu.com",
      "expectedStatus": [200],
      "degradedAboveMs": 3000
    }
  ]
}
```

### TCP 与 PING 检测格式

需要启用其他探针时，在 `targets` 中加入对应对象即可：

```json
[
  {
    "id": "portal-tcp",
    "name": "openjsu.com:443",
    "role": "TLS 端口",
    "type": "tcp",
    "host": "openjsu.com",
    "port": 443
  },
  {
    "id": "portal-ping",
    "name": "openjsu.com ICMP",
    "role": "网络连通性",
    "type": "ping",
    "host": "openjsu.com"
  }
]
```

支持的字段：

| 字段 | 适用类型 | 作用 |
| --- | --- | --- |
| `intervalMinutes` | 全局 | 页面显示的计划周期；当前工作流按 5 分钟运行 |
| `timeoutMs` | 全局/单点 | 超时时间，范围 500–30000ms |
| `historyLimit` | 全局 | 每个检测点保留的历史次数，范围 1–100 |
| `url` | `http` | HTTP/HTTPS 地址 |
| `method` | `http` | HTTP 方法，默认 `GET` |
| `expectedStatus` | `http` | 允许的状态码，可以是 `200` 或 `[200, 204]`；未配置时接受 2xx/3xx |
| `host` | `tcp`/`ping`/`dns` | 主机名或 IP 地址 |
| `port` | `tcp` | TCP 端口，1–65535 |
| `query` | `dns` | 要解析的域名；未配置时使用全局 `dns.query` 或 `example.com` |
| `degradedAboveMs` | 单点 | 超过此延迟标记为“性能下降”，不改变延迟颜色分档 |

页面状态统一显示为三个指标：探测成功且处于正常延迟阈值内是“服务正常”；探测成功但超过 `degradedAboveMs` 是“性能下降”；请求失败、超时、HTTP 关键错误或进入红色延迟分档是“服务异常”。`uptime` 表示最近历史检查中“服务正常”的百分比，页面固定展示最近 100 次检查，历史不足 100 次时剩余柱位留空。

## 状态指标与延迟分档

页面对外只展示“服务正常”“性能下降”“服务异常”三个状态。探针仍按参考图保留以下内部延迟分档，用于判断服务异常和保留结果明细：

| 类型 | 分档 |
| --- | --- |
| HTTP | 绿色 `0–3000ms`；黄色 `3000–6000ms`；红色 `>6000ms` |
| PING | 绿色 `0–50ms`；浅绿 `50–100ms`；黄色 `100–150ms`；橙色 `150–200ms`；红色 `>200ms` |
| TCP | 深绿 `≤50ms`；绿色 `51–100ms`；浅绿 `101–200ms`；黄色 `201–250ms`；橙色 `>250ms`；超时显示红色 |
| DNS | 绿色 `0–100ms`；黄色 `100–500ms`；红色 `>500ms` |

GitHub-hosted runner 是单个执行点，不会伪造全国地域或中国电信/联通/移动等多运营商节点。要做截图中的多地域地图，需要增加不同地域的 self-hosted runners 或外部探针，并扩展结果模型。

## GitHub 部署

这是一个独立项目，应创建新的公共仓库，不要推送回上游 Pagekiln 仓库。

1. 将本项目推送到新的 public repository，默认分支使用 `main`。
2. 在仓库 `Settings → Pages` 将构建来源设置为 `GitHub Actions`。
3. `Build and publish Pages` 会构建 Pagekiln 输出并部署首页；它不会读取或打包探测结果。
4. 在 `Actions → Probe status snapshot` 中手动运行一次，确认 `status-data` 分支产生 `status/probes.json`。
5. 如果使用 `status.openjsu.com`，在 Pages 设置中绑定自定义域名并按 GitHub 给出的指引配置 DNS；`config.yml` 的 `siteUrl` 已按该域名预留。

修改 `.github/probes.json` 后，探测工作流下一次运行会读取新配置。修改页面、主题或工作流源文件时，Pages 工作流才会重新部署。

如果组织策略把 `GITHUB_TOKEN` 默认权限设为只读，需要在仓库 `Settings → Actions → General → Workflow permissions` 允许工作流读写仓库内容；工作流本身也声明了 `contents: write`。`status-data` 是专门的数据分支，若为它启用分支保护，需允许 Actions bot 更新该分支。

## GitHub Free 与公共仓库限制

本项目选择 `ubuntu-latest` 标准 GitHub-hosted runner。公共仓库使用标准 runner 通常不消耗付费 Actions 分钟；larger runner、私有仓库配额和其他计费情形仍以账户页面为准。参见 [GitHub Actions 产品计费](https://docs.github.com/en/billing/concepts/product-billing/github-actions) 与 [选择 runner](https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job)。

需要留意：

- GitHub schedule 的最短间隔是 5 分钟，按 UTC 解释，且只在默认分支上运行；高负载时可能延迟，公共仓库连续 60 天没有活动时，计划工作流可能被自动禁用。参见 [触发工作流的事件](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)。
- GitHub 的公共仓库仍受并发数、单个 job 最长运行时间和 workflow 文件大小等平台上限约束；本项目单 job、单 runner、单 JSON 分支更新，远低于这些上限。参见 [Actions limits](https://docs.github.com/en/enterprise-cloud@latest/actions/reference/limits)。
- GitHub Pages 适合公开状态页，但不是高可用探针平台；官方列出的站点发布容量、软带宽和部署时间限制见 [GitHub Pages limits](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)。Pages 工作流写法参见 [使用自定义工作流发布 Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows)。

计划任务不是严格实时调度。如果需要秒级、跨地域或有 SLA 的监测，应把 GitHub Actions 作为补充探针，另接专业监控系统或自托管 runner。

## 本地检查

```bash
npm ci
npm run check
npm run build
```

`status/probes.json` 是运行时输出，不应提交到 `main`；探测工作流会把它发布到 `status-data` 分支。页面在没有该文件时保持等待状态，而不会展示编造的结果。

## License

沿用 Pagekiln 的 MIT License；本项目的页面、配置和工作流改动属于 OpenJSU Pulse。
