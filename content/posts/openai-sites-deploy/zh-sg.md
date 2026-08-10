---
title: 通过 OpenAI Sites 发布 dist
description: 记录 Pagekiln 将已验证的 dist 交给 OpenAI Sites 发布的完整边界。
date: 2026-08-10
cover: /assets/product-note-cover.webp
pattern: blog
tags: [deployment, openai-sites]
---

# 通过 OpenAI Sites 发布 dist

这次部署把静态根统一设为 `dist`。Pagekiln 先生成页面和 Sites 所需的 `server/index.js`，再把同一份已验证的源码和构建产物交给 OpenAI Sites；站点不依赖命令行临时填写项目 ID 或令牌。

<more>

## 配置只表达站点事实

站点根目录的配置保留项目绑定和静态根：

```yaml
deployment:
  targets: [openai-sites]
  openaiSites:
    metadata: .openai/hosting.json
    staticDirectory: dist
```

`.openai/hosting.json` 只保存已经存在的 `project_id`。源码凭据由 Sites 连接器短时提供，不能写入配置、远程 URL 或提交记录。

## 发布顺序

先运行 `pagekiln g` 和 `pagekiln check`，再运行 `pagekiln d --dry-run` 检查目标。部署脚本会确认 `dist/server/index.js` 和 `dist/index.html` 都存在，然后把动作交给 Sites 连接器：推送当前源码分支的准确 HEAD，保存一个引用该提交的版本，部署已保存版本，并轮询生产状态。

归档同时包含 `dist/`、Sites 元数据和必要的动态入口。页面请求由同一份 Web Standard Fetch handler 处理；静态文件使用 `dist` 作为根，入口旁边的静态资源回退用于处理平台未注入静态绑定的情况。

## 失败时保持同一发布上下文

`Transport send error` 是连接器传输层的临时故障，只能在短暂等待后重试同一个保存动作；不能重新创建站点或生成另一套项目 ID。若 Sites 返回 `stale_commit_sha`，先读取远端分支的真实 HEAD，重新构建与该提交一致的归档，再保存版本。只有保存成功并返回版本后才允许部署。

## 这次决定的边界

OpenAI Sites 的访问权限、公开 URL 和自定义域名属于 Sites 管理面；域名验证仍需在域名服务商添加平台提供的 DNS 记录。Pagekiln 只负责源码、配置、构建输出和可验证的部署入口，不把平台凭据写进站点文件。

## 部署成功不等于所有地区可访问

OpenAI Sites 可以接受构建并报告部署成功，但这只证明平台完成了发布，不代表每个地区、运营商或企业网络都能建立到站点的连接。DNS 传播、跨境或区域路由、企业防火墙、平台区域可用性以及自定义域名状态，都可能让部分访客打不开或访问不稳定。需要广泛可达性时，应从目标地区实测，并准备 Cloudflare、GitHub Pages 或 VPS 作为替代出口。

本项目已经移除本地 OpenAI Sites 绑定，因此不会继续默认发布到该站点；这篇笔记保留为可选 Sites 适配的部署边界说明。
