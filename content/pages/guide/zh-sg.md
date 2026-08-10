---
title: 安装、预览、构建与部署 Pagekiln
description: 从新建 Pagekiln 站点到检查、预览并部署 dist 目录的实际操作路径。
pattern: docs
---

# 安装、预览、构建与部署 Pagekiln

这是一份当前使用文档。`pages` 描述站点现在如何工作；`posts` 保存有日期的产品变化。如果编译器或主题行为发生变化，应更新本页和其他当前页面。需要新增 Block 或修改主题时，请阅读[二次开发](/zh-sg/development/)。

## 1. 安装

Pagekiln 要求 Node.js `>=22.12.0` 和 npm。在本仓库中操作：

```bash
git clone https://github.com/jsw-teams/pagekiln.git
cd pagekiln
npm install
```

使用源码 CLI 前，先编译运行时、主题和后端：

```bash
npm run compile-runtime
npm run compile-theme
npm run compile-backend
```

要在其他目录创建中性的站点，可链接本地 CLI，让它复制真实的 `starter/` 模板：

```bash
npm link
mkdir my-site
cd my-site
pagekiln init
```

`pagekiln init` 不会在 CLI 里再生成一套隐藏模板，而是复制 `starter/`，包括 `config.yml`、内容和主题资源。

## 2. 写入第一批内容

源码目录有两个 collection：

```text
content/
├─ pages/<id>/<locale>.md       当前站点信息
├─ posts/<id>/<locale>.md       有日期的产品笔记
└─ assets/                      图片及其他站点资源
```

当前页面写在 `content/pages/`。当首页、About、Guide、Reference 和目录页回答“站点现在怎样工作”时，它们都属于 `pages`。`docs` 是 `pages` 中的 Pattern，不是第三个 collection。

```markdown
---
title: 本地搜索
description: 当前构建如何建立索引并标记结果位置。
pattern: docs
---

# 本地搜索

Pagekiln 当前为每种语言建立静态索引，并按命中的标题、章节、正文或路径标记结果位置。
```

只有在记录一次有日期的决定、实现、发布、事故、部署或测量时，才在 `content/posts/<id>/<locale>.md` 写产品笔记。`date` 字段必填。

```markdown
---
title: 搜索结果新增命中位置
description: 记录 2026-08-10 新增可见命中位置标签的变更。
date: 2026-08-10
pattern: blog
---

# 搜索结果新增命中位置

这篇笔记记录当天改了什么以及为什么这样改。当前搜索用法仍然写在 Guide 中。
```

当前行为变化时，更新原来的页面。旧产品笔记保留为历史；新的有日期变化新增一篇笔记。这样 `pages` 表示当前状态，`posts` 表示时间线历史。

## 3. 检查源码

预览或部署前先运行：

```bash
pagekiln check
```

检查会验证 YAML Frontmatter、必填 schema 字段、collection 路由、翻译组、Pattern 和 Block 名称、指令属性以及路由冲突。产品笔记缺少 `date` 会检查失败；当前页面不需要日期。

需要确认当前主题实际提供了什么能力时，使用源码发现命令：

```bash
pagekiln catalog
pagekiln inspect collection:pages
pagekiln inspect collection:posts
pagekiln inspect block:notice
```

`catalog` 读取源码能力，不要求先完整构建站点。`inspect` 为内容 id 或明确 namespace 返回结构化事实。

## 4. 本地预览

启动增量预览服务：

```bash
pagekiln s
```

打开[http://127.0.0.1:4173/](http://127.0.0.1:4173/)。默认端口被占用时：

```bash
pagekiln s --port=4174
```

服务启动时先构建一次，然后监听 `config.yml`、`content/` 和 `themes/`。受影响的输出重建后浏览器会刷新，所以 Markdown、Frontmatter、CSS 或主题修改不需要重启进程即可看到。构建诊断错误会打印出来，但预览进程会继续运行，方便修复后再次构建。

在仓库源码中，等价的 npm 别名是 `npm run s` 和 `npm run s -- --port=4174`。

## 5. 构建 `dist/`

生成可发布的静态输出：

```bash
pagekiln g
pagekiln g --profile
```

短命令和 `pagekiln build` 执行相同操作。它写入 `dist/`，包括 HTML、单行压缩并带指纹的 CSS、浏览器 ESM 资源、Feed、sitemap、搜索数据、`llms.txt`、自定义 404 页面和目标平台部署文件。构建 profile 位于 `dist/.pagekiln/build-profile.json`。

在源码仓库中可运行 `npm run g -- --profile`。不要手动编辑 `dist/`，应修改源码后重新生成。

## 6. 从 `config.yml` 部署

部署写在站点配置文件中，不把供应商凭据放到命令行。可以选择一个或多个 target：

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

支持的 target 是 `cloudflare-pages`、`cloudflare-workers`、`github-pages`、`vps`，以及可选的 `openai-sites` connector handoff。凭据放在环境变量、本机 SSH agent 或 SSH 密钥文件中，不要把 token 或私钥内容写进 `config.yml`。

上传前先查看解析后的操作：

```bash
pagekiln d --dry-run
```

确认后上传：

```bash
pagekiln d
```

`pagekiln d` 会先构建。Cloudflare Pages 使用 Wrangler 发布 `dist/`；Cloudflare Workers 使用生成的标准 module Worker；GitHub Pages 把 `dist/` 推送到配置的远程分支；VPS 使用 SCP 复制到配置的路径。VPS 必须已有 SSH 访问权限、远程目录，并在使用密钥认证时把公钥放进服务器的 `authorized_keys`。

`deployment.backend: false` 时 Cloudflare Pages 是纯静态部署；打开 backend 后会进入 Advanced Mode 输出边界。CDN、Caddy 或 Nginx 都可以直接提供静态 `dist/`。OpenAI Sites 不是本项目的默认绑定，部分地区可能无法访问；需要广泛可达性时，应从目标地区测试最终域名。

## 7. 修改主题或新增 Block

将主题复制到 `themes/<name>/`，在 `theme.ts` 实现 Block，在 `theme.yml` 注册，把样式放入统一的 `style.css`，然后依次运行 `catalog`、`inspect`、`check`、`build` 和 `serve`。完整示例见[二次开发](/zh-sg/development/)。

不要为了保留旧实现而增加第二份 CSS、浏览器脚本或兼容 wrapper。重新设计替代旧规则或处理器时，删除重复项并检查生成结果。

## 8. 发布前检查

```bash
npm test
pagekiln check
pagekiln g --profile
pagekiln inspect collection:posts
pagekiln d --dry-run
```

检查三种语言链接、自定义 404、`feed.xml`、`sitemap.xml`、`llms.txt`、可选 Cookie 脚本、键盘焦点、窄屏表格和生成的部署文件。产品笔记必须按日期倒序出现在 archive/feed；当前页面不应被强制要求填写日期。
