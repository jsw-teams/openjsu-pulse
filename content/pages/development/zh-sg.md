---
title: 二次开发从主题开始
description: 先改主题里的 Pattern、Block 和统一样式，再用插件开关控制可选浏览器行为，把运行时需求放进 backend。
pattern: docs
---

# 二次开发从主题开始

我把 Pagekiln 的扩展边界放在主题。内容、集合、路由、语言、搜索、图片缓存和部署输出由核心负责；新页面结构和视觉语言先进入 `themes/<name>/`。

## 目录就是功能地图

```text
themes/default/
├─ theme.yml                 Pattern、Block、资源和插件声明
├─ theme.ts                  页面壳、Pattern、Block renderer
├─ style.css                 全局布局、响应式和无障碍样式
├─ i18n.yml                  主题 UI 本地化文案
└─ scripts/                  需要同意后或页面需要的原生 ESM
```

`src/` 是编译器和 Fetch router。`backend/` 只放请求、秘密、写入和 webhook。`config.yml` 只管理站点信息、内容集合、路由、能力开关和部署选项，不接受 CSS、HTML 或脚本注入。

## 主题合约

主题模块导出 `defineTheme`：

```ts
import { defineTheme } from '../../src/theme-api.ts';

export default defineTheme({
  name: 'default',
  patterns: {
    document: { name: 'document', contexts: ['page'], render: content => content }
  },
  blocks: {
    notice: {
      name: 'notice',
      schema: { tone: 'string' },
      render: (node, context) => `<aside class="notice">${context.renderNodes(node.children)}</aside>`
    }
  }
});
```

Block 的属性先在 schema 中声明。渲染器使用 `context.escapeHtml`、`context.safeUrl` 和 `context.renderNodes`，不要把未经审查的输入拼成原始 HTML。真正可信的原始片段才进入 `unsafeHtml`，而且只在编译器边界审查。

## 从主题目录新增页面结构

1. 在 `theme.ts` 增加 Pattern 或 Block，并写出适用的 context。
2. 在 `theme.yml` 注册名称、短属性、schema 示例和实际资源依赖。
3. 在 `style.css` 或主题资源中完成桌面、窄屏和焦点状态；默认视觉系统不加入无意义动效。
4. 运行 `npm run catalog`，确认能力目录能够让人和 Agent 找到它。
5. 用一份真实 Markdown 运行 `pagekiln check` 与 `pagekiln g --profile`。

普通需求优先复用已有 Block。页面目录、产品笔记、语言切换、摘要、封面、Feed（产品笔记订阅清单）、站点地图和本地搜索都已经属于核心能力，不需要为每个站点复制一套页面代码。

## 搜索怎样指出命中点

编译器为每个语言生成静态索引。默认主题在浏览器端按标题、摘要、章节、正文和路径加权；结果显示命中层级，截取命中附近的文字，并用 `<mark>` 标示实际匹配部分。单个英文字母会提示继续输入，避免输入 `n` 时返回一堆噪声；中文单字仍可搜索。

搜索脚本使用原生 Fetch 和 DOM API，不加载框架。索引超过分片阈值时，入口 JSON 只列出分片地址。

## 移动端和动画边界

默认主题使用单列阅读流、右侧可展开目录、带 `data-label` 的响应式表格和不依赖横向滚动条的窄屏布局。样式表刻意不使用 transition 或 keyframe 动画，交互通过颜色、边框、焦点和展开状态表达；`prefers-reduced-motion: reduce` 保留明确的滚动处理。新增组件要先检查 320px 宽度、长中文标题、长路径和键盘操作。

## Cookie、资源与缓存

Cookie 类别、保存期限、文案和 provider 集成由 `config.yml` 的 `privacy.cookieConsent` 管理；`privacyConsent` 主题插件声明脚本并带有 `enabled` 开关。可选脚本在选择前只以 `<template>` 出现，保存同意后才插入脚本节点。人类访客从页脚打开设置；机器读取 `/.well-known/agent.json`。

CSS 输出会压缩成单行，CSS 和浏览器 ESM 文件名带主题指纹，例如 `style.<fingerprint>.css`，资源链接不使用查询字符串。图片缓存键包含源文件、参数和 Sharp 版本；未变化图片不会再次处理。

## 构建图和可复现实验

一次 BuildContext 负责发现、加载、解析、校验、路由、渲染和写入。普通改稿通过 mtime 与 size 快速判断，变化后才计算 hash；受影响的页面和输出才会重新写入。`.pagekiln/manifest.json`、依赖图和输出 hash 可恢复，不需要数据库。

需要测量时使用临时夹具：

```bash
npm run compile-runtime
npm run compile-theme
npm run compile-backend
npm run bench -- 100
```

夹具只用于本地测量，不读取示例站点内容，也不写入生产 `dist/`。完整 JSON 保留每个场景、阶段和机器信息。`maxRssMiB` 是 Node 构建进程的峰值常驻内存，1 MiB 等于 1,024² 字节，它不是 `dist/` 大小，也不是单页占用。

## 部署边界

- CDN、Caddy 和 Nginx 直接提供 `dist/`。
- Cloudflare Workers 使用静态资源绑定和标准 module worker，静态请求先交给资源层。
- Cloudflare Pages 在关闭 backend 时只部署静态文件，启用 backend 时生成 Advanced Mode `_worker.js`。
- VPS 的动态入口使用 `Deno.serve`，静态文件仍由 Caddy 或 Nginx 提供。

三种动态目标都导入同一个 Fetch handler。秘密只从运行时绑定或环境变量读取。

`pagekiln d` 会先构建再发布。直接使用本源码仓库时运行 `npm run d`；执行 `npm link` 或安装 CLI 后才使用裸命令。`config.yml` 可以填写一个或多个目标及各自的发布位置，命令只接受用于检查的 `--dry-run`，多个目标按列表顺序执行。Cloudflare 目标调用 Wrangler，GitHub 使用 `git subtree`，`vps` 使用 OpenSSH SCP，`openai-sites` 需要已存在的 `.openai/hosting.json` 才能交给 Sites 连接器。

```yaml
deployment:
  targets: [vps]
  cloudflare:
    accountId: CF_ACCOUNT_ID
    pages:
      project: site-name
      branch: production
    workers:
      name: site-worker
      compatibilityDate: '2026-08-10'
  github:
    remote: origin
    branch: gh-pages
  vps:
    host: vps.example.com
    user: deploy
    port: 22
    remotePath: /var/www/site
    identityFile: ~/.ssh/id_ed25519
  openaiSites:
    metadata: .openai/hosting.json
```

`cloudflare.pages.project` 是 Pages 项目名；`cloudflare.workers.name` 和 `compatibilityDate` 用于生成 `dist/wrangler.toml`。`github.remote` 和 `branch` 必须是本机已有的远程仓库与目标分支。VPS 必须填写 SSH 主机、用户、端口和已存在的远程目录；省略 `identityFile` 时使用 OpenSSH agent 或用户配置。凭据不写入此文件。

```bash
pagekiln d --dry-run
pagekiln d
```

## 完成修改后的检查

```bash
npm run compile-runtime
npm run compile-theme
npm run compile-backend
npm test
pagekiln check
npm run catalog
npm run inspect -- home
pagekiln g --profile
```

最后检查生成的 HTML、404、Feed、站点地图、搜索索引、`llms.txt`、部署文件和主题指纹文件是否都存在。`dist/` 是生成物，不要手动编辑。
