---
title: 开发 Block 与主题扩展
description: 以主题为起点新增 Block、注册资源、测试扩展并部署结果的实际流程。
pattern: docs
---

# 开发 Block 与主题扩展

Pagekiln 的二次开发从复制主题开始。编译器负责 Markdown、schema、路由、依赖、资源和输出；主题负责 Pattern、Block、布局、CSS、浏览器 ESM、图标和隐私呈现。本页描述当前扩展路径。

## 1. 复制主题边界

在新的主题目录开始，让原主题继续作为可运行的参考：

```text
themes/<name>/
├─ theme.yml
├─ theme.ts
├─ style.css
├─ i18n.yml
└─ scripts/                 可选的原生浏览器 ESM
```

`theme.yml` 声明 `theme.ts`、`style.css`、i18n 资源、Pattern、Block 和插件资源。主题级 `plugins` 开关下放二级插件名称。主题 UI 文案放在 `themes/<name>/i18n.yml`，不放入站务根配置。

## 2. 在 `theme.ts` 添加 Block

使用小型主题 API，让 Block schema 保持标量且明确：

```ts
import { defineTheme } from '../../src/theme-api.ts';

export default defineTheme({
  name: 'nebula',
  patterns: {
    document: { name: 'document', contexts: ['page'], render: content => content }
  },
  blocks: {
    notice: {
      name: 'notice',
      schema: { tone: 'string' },
      render: (node, context) => {
        const tone = context.escapeHtml(node.attributes.tone || 'info');
        return `<aside class="notice notice--${tone}">${context.renderNodes(node.children)}</aside>`;
      }
    }
  }
});
```

`context.renderNodes` 渲染 Markdown 子节点。文本和属性使用 `context.escapeHtml`，链接使用 `context.safeUrl`。不要把未经审查的 Markdown、Frontmatter 或配置值送进 `unsafeHtml`。

在 `theme.yml` 注册同一个 Block：

```yaml
name: nebula
module: theme.ts
style: style.css
blocks:
  - notice
patterns:
  - document
plugins:
  privacyConsent:
    enabled: true
```

代码中的 schema 和 `theme.yml` 的注册共同构成一个契约。未注册的 Block 应由 discovery 或 check 报错，不要用编译器条件隐藏它。

## 3. 在 Markdown 使用 Block

在 `content/pages/` 下的页面加入指令：

```markdown
:::notice{tone="info"}
当前使用说明在 Guide 中。
:::
```

指令属性保持短小且为标量。标题、段落、列表、表格、代码和链接继续使用普通 Markdown。描述当前行为的 Block 放在 page；记录有日期的实现决定则放在带必填 `date` 的 Product Note。

## 4. 让一个样式文件拥有视觉行为

把 Block 规则加入主题的 `style.css`：

```css
.notice{border-inline-start:3px solid var(--accent);padding:1rem 1.2rem;background:var(--panel);color:var(--ink)}
```

编译器会把 CSS 压缩为单行并为文件名加指纹。响应式布局、焦点状态、表格适配、图标尺寸和 reduced-motion 行为都放在这个样式文件或声明的主题资源中。新规则替代旧规则时删除重叠规则和无效兼容文件，不要依靠 cascade 顺序同时维持两套设计。

默认主题通过主题模块使用 Lucide 图标包。已有控件应复用已声明的图标库，不要为同一组控件再增加图标字体或另一套内联 SVG。

## 5. 发现并测试扩展

按以下顺序运行：

```bash
npm run compile-theme
npm run catalog
pagekiln inspect block:notice
pagekiln check
pagekiln g --profile
pagekiln s
```

`catalog` 确认当前主题的 Pattern、Block、插件、schema 名称和资源依赖。`inspect block:notice` 以结构化输出回答单个能力问题。`check` 会以源码位置报告未知 Block、无效属性、路由冲突和缺少必填字段。`g` 确认 Block 进入静态输出；`s` 确认 Markdown 或主题编辑后浏览器会刷新。

## 6. 添加可选浏览器行为

原生 ESM 放在 `themes/<name>/scripts/`，并在对应插件下声明。每个可选插件都要有明确开关：

```yaml
plugins:
  privacyConsent:
    enabled: true
  search:
    enabled: true
```

可选分析或广告脚本在访客同意对应 Cookie 类别前保持不活动。必要的同意存储由隐私契约启用；footer 打开与访客之后重新打开的同一个设置对话框。浏览器代码只加载一次，每个事件处理器只保留一个拥有者。旧脚本被替代时删除它，不要让两个处理器竞争。

## 7. 分离站务配置与运行时代码

`config.yml` 保存站点信息、语言、collection、路由、schema、隐私设置和部署位置，不保存 CSS 路径、任意 HTML 或浏览器脚本正文。需要动态请求、密钥、写入和 webhook 时，代码只放在 `backend/handler.ts`；使用共享 Fetch router，并在部署前编译后端。

纯静态站点在 Pages 上关闭 backend，使用 CDN、Caddy 或 Nginx 提供 `dist/`。部署配置示例：

```yaml
deployment:
  targets: [cloudflare-pages]
  cloudflare:
    apiTokenEnv: CLOUDFLARE_API_TOKEN
    pages:
      project: example-site
      branch: production
```

```bash
pagekiln d --dry-run
pagekiln d
```

一次发布需要多个目的地时使用 `targets: [cloudflare-pages, github-pages, vps]`。在 `config.yml` 填写各供应商的项目、远程仓库、分支、SSH 主机、用户、端口、远程路径和密钥路径；密钥值留在环境变量或本机 SSH 配置中。

## 8. 测量修改

可选 fixture 会测量 100 个临时页面，并以 JSON 行报告 cold、no-change、edit、add、delete、theme 和 settings 变化：

```bash
npm run compile-runtime
npm run compile-theme
npm run compile-backend
npm run bench -- 100
```

`maxRssMiB` 是 Node 构建进程的峰值常驻内存，不是输出目录大小。fixture 运行后会移除，不构成产品性能承诺。

## 9. 扩展完成清单

```text
[ ] theme.ts 通过 defineTheme 导出 Block
[ ] theme.yml 注册 Block 和资源
[ ] style.css 负责响应式及焦点状态
[ ] 删除重复 CSS、JS 和兼容层
[ ] 可选插件有明确开关
[ ] i18n 留在 themes/<name>/i18n.yml
[ ] pagekiln catalog 和 inspect 能描述 Block
[ ] pagekiln check、build、test 和 preview 通过
[ ] 检查生成的 dist/，不手动编辑
```
