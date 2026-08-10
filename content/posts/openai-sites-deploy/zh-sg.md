---
title: OpenAI Sites 部署适配记录
description: 记录 2026-08-10 的 OpenAI Sites 交接实验；当前部署以 Guide 和 CLI help 为准。
date: 2026-08-10
cover: /assets/product-note-cover.webp
pattern: blog
tags: [deployment, openai-sites]
---

# OpenAI Sites 部署适配记录

这篇笔记记录 2026-08-10 完成的 OpenAI Sites 交接实验。Pagekiln 当前默认配置不绑定 OpenAI Sites；deploy 代码仍保留 `openai-sites` 作为可选连接器交接，并要求已有的 Sites 元数据。当前操作请查看[二次开发中的部署说明](/zh-sg/development/)和 CLI help；这篇笔记是部署历史，不是当前部署教程。

这次实验把 `dist/` 作为唯一静态根目录，验证如何把已检查的构建交给已有 Sites 项目，同时不在命令行临时填写项目 ID 或令牌。

<more>

## 实验时使用的配置

下面的配置描述这次实验，不是当前默认配置。当前项目在站点所有者于 `config.yml` 选择目标前保持 `deployment.targets` 为空：

```yaml
deployment:
  targets: [openai-sites]
  openaiSites:
    metadata: .openai/hosting.json
    staticDirectory: dist
```

`.openai/hosting.json` 表示一个已经存在的 `project_id`。Sites 提供短时连接器凭据；凭据不能放进配置、远程 URL 或提交记录。

## 这次实验改变了什么

交接流程检查 `dist/server/index.js` 和 `dist/index.html`，再把源码状态和构建产物交给 Sites 连接器。测试顺序是引用准确的源码提交、保存一个版本、部署该版本并轮询生产状态。传输失败时必须重试同一个保存上下文；提交过期时要依据远端真实分支 HEAD 重新构建。

实验也确认了静态边界：生成的输出仍是应该被托管的交付物；选定目标支持动态请求时，动态请求使用共享的 Web Standard Fetch handler。

## 边界和结果

OpenAI Sites 负责访问方式、公开 URL 和自定义域名验证。Pagekiln 负责源码、配置、构建输出和部署入口。平台报告部署成功，只能证明平台完成了发布，不保证每个地区、运营商或企业网络都能连接。DNS 传播、区域路由、防火墙、平台可用性和自定义域名状态，都可能让部分访客无法访问。需要覆盖目标地区时，应从实际地区测试，并准备 Cloudflare、GitHub Pages 或 VPS 等备用出口。

实验结束后移除了本地 Sites 绑定。可选适配仍面向已有 Sites 项目；当前部署选择以[当前二次开发部署说明](/zh-sg/development/)和 `config.yml` 为准。
