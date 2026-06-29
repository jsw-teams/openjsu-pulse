import { createReadStream } from "node:fs";
import { mkdir, readFile, readdir, stat, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { buildHtmlPagesForUrls } from "../src/lib/content.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const rootDir = process.env.PAGEKILN_SITE_ROOT || process.cwd();
const outputDir = path.join(rootDir, "dist");
const host = process.env.HOST || "127.0.0.1";
const preferredPort = Number(process.env.PORT || 4173);
const nodeBin = process.execPath;
const watchTargets = ["content", "themes", "static", "config.yml"];
const pollIntervalMs = 10000;
let pollingStarted = false;

const mime = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".m4a", "audio/mp4"],
  [".md", "text/markdown; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".vtt", "text/vtt; charset=utf-8"],
  [".webmanifest", "application/manifest+json; charset=utf-8"],
  [".webp", "image/webp"],
  [".xml", "text/xml; charset=utf-8"]
]);

const clients = new Set();
let status = {
  state: "starting",
  message: "Starting preview server...",
  updatedAt: new Date().toISOString()
};
let buildTimer = null;
let buildRunning = false;
let buildAgain = false;
let contentSnapshot = new Map();

function normalizeUrl(url) {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  return pathname.replace(/^\/+/, "");
}

function resolvePublicPath(url) {
  const relative = normalizeUrl(url);
  const requestPath = path.normalize(path.join(outputDir, relative));
  if (!requestPath.startsWith(outputDir)) return null;
  return requestPath;
}

async function findFile(url) {
  const requestPath = resolvePublicPath(url);
  if (!requestPath) return null;

  const candidates = [
    requestPath,
    path.join(requestPath, "index.html")
  ];

  for (const candidate of candidates) {
    try {
      const info = await stat(candidate);
      if (info.isFile()) return candidate;
    } catch {}
  }

  const notFound = path.join(outputDir, "404.html");
  return (await stat(notFound).then((info) => info.isFile()).catch(() => false)) ? notFound : null;
}

function previewClientScript() {
  return `<script>
(() => {
  const id = "pagekiln-preview-status";
  const styleId = "pagekiln-preview-style";
  let lastOkUpdatedAt = null;
  const ensureStyle = () => {
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = "#" + id + "{position:fixed;left:16px;right:16px;bottom:16px;z-index:2147483647;max-height:45vh;overflow:auto;background:#2b1010;color:#fff;border:2px solid #ff7676;box-shadow:0 8px 30px rgba(0,0,0,.35);padding:12px 14px;font:13px/1.45 ui-monospace,SFMono-Regular,Consolas,monospace;white-space:pre-wrap}#" + id + "[hidden]{display:none}";
    document.head.appendChild(style);
  };
  const show = (message) => {
    ensureStyle();
    let box = document.getElementById(id);
    if (!box) {
      box = document.createElement("pre");
      box.id = id;
      document.body.appendChild(box);
    }
    box.hidden = false;
    box.textContent = message;
  };
  const hide = () => {
    const box = document.getElementById(id);
    if (box) box.hidden = true;
  };
  const handleStatus = (data, reloadOnNewOk) => {
    if (data.state === "ok") {
      hide();
      if (reloadOnNewOk && data.updatedAt && lastOkUpdatedAt && data.updatedAt !== lastOkUpdatedAt) {
        location.reload();
        return;
      }
      lastOkUpdatedAt = data.updatedAt || lastOkUpdatedAt;
    } else if (data.state === "error") {
      show(data.message || "Build failed.");
    }
  };
  const events = new EventSource("/__Pagekiln/events");
  events.addEventListener("message", (event) => {
    handleStatus(JSON.parse(event.data), true);
  });
  fetch("/__Pagekiln/status").then((response) => response.json()).then((data) => {
    handleStatus(data, false);
  }).catch(() => {});
  setInterval(() => {
    fetch("/__Pagekiln/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => handleStatus(data, true))
      .catch(() => {});
  }, 1500);
})();
</script>`;
}

async function sendHtml(file, response, statusCode) {
  let html = await readFile(file, "utf8");
  const script = previewClientScript();
  html = html.includes("</body>") ? html.replace("</body>", `${script}</body>`) : `${html}${script}`;
  response.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(html);
}

function sendPreviewMessage(response, statusCode, title, message) {
  const html = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    body{margin:0;min-height:100vh;display:grid;place-items:center;background:#faf7ef;color:#1f1f1d;font:16px/1.6 system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    main{width:min(720px,calc(100vw - 40px));border:2px solid #24211d;background:#fffaf0;padding:28px;box-shadow:8px 8px 0 rgba(36,33,29,.15)}
    h1{margin:0 0 12px;font-size:24px}
    p{margin:0;color:#5b554c}
  </style>
</head>
<body>
  <main>
    <h1>${title}</h1>
    <p>${message}</p>
  </main>
${previewClientScript()}
</body>
</html>`;
  response.writeHead(statusCode, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff"
  });
  response.end(html);
}

function sendEvent(payload) {
  const body = `data: ${JSON.stringify(payload)}\n\n`;
  for (const response of clients) response.write(body);
}

function setStatus(next) {
  status = {
    ...next,
    updatedAt: new Date().toISOString()
  };
  sendEvent(status);
}

function run(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: options.cwd || rootDir,
      shell: false,
      env: {
        ...process.env,
        PAGEKILN_SITE_ROOT: rootDir
      }
    });
    let output = "";
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });
    child.on("close", (code) => resolve({ code, output }));
    child.on("error", (error) => resolve({ code: 1, output: String(error.stack || error.message || error) }));
  });
}

function pageUrlFromChange(reason) {
  const normalized = String(reason || "").replaceAll("\\", "/");
  const match = normalized.match(/^content\/pages\/([^/]+)\/index\.([^/.]+(?:-[^/.]+)?)\.md$/);
  if (!match) return null;
  const [, slug, locale] = match;
  if (slug === "home") return `/${locale}/`;
  return `/${locale}/${slug}/`;
}

function outputFileForUrl(url) {
  const clean = url.replace(/^\/+/, "");
  if (!clean) return path.join(outputDir, "index.html");
  return url.endsWith("/")
    ? path.join(outputDir, clean, "index.html")
    : path.join(outputDir, clean);
}

async function writeHtmlRoute(route) {
  const file = outputFileForUrl(route.url);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, route.html, "utf8");
}

async function buildChangedPage(reason) {
  const url = pageUrlFromChange(reason);
  if (!url) return false;
  setStatus({ state: "building", message: `Building ${url} after ${reason}...` });
  const routes = await buildHtmlPagesForUrls([url]);
  if (!routes.length) throw new Error(`No page route generated for ${url}`);
  await Promise.all(routes.map(writeHtmlRoute));
  setStatus({ state: "ok", message: `Build complete for ${url}` });
  console.log(`Updated ${url}`);
  return true;
}

async function build(reason = "change") {
  if (buildRunning) {
    buildAgain = true;
    return;
  }
  buildRunning = true;
  try {
    if (!await buildChangedPage(reason)) {
      setStatus({ state: "building", message: `Building after ${reason}...` });
      const prebuild = await run(nodeBin, [path.join(packageRoot, "src/prebuild.mjs")]);
      if (prebuild.code !== 0) throw new Error(prebuild.output || "prebuild failed");
      const astro = await run(nodeBin, [
        path.join(packageRoot, "node_modules/astro/bin/astro.mjs"),
        "build"
      ], { cwd: packageRoot });
      if (astro.code !== 0) throw new Error(astro.output || "build failed");
      setStatus({ state: "ok", message: "Build complete." });
    }
  } catch (error) {
    const message = String(error.stack || error.message || error);
    setStatus({ state: "error", message });
    console.error(message);
  } finally {
    buildRunning = false;
    if (buildAgain) {
      buildAgain = false;
      scheduleBuild("queued change");
    }
  }
}

function scheduleBuild(reason) {
  clearTimeout(buildTimer);
  buildTimer = setTimeout(() => build(reason), 200);
}

function shouldIgnoreChange(relativePath) {
  const normalized = relativePath.replaceAll("\\", "/");
  return (
    normalized.startsWith("static/assets/") ||
    normalized === "static/favicon.ico" ||
    normalized === "static/favicon-32x32.png" ||
    normalized === "static/apple-touch-icon.png" ||
    normalized === "static/site.webmanifest" ||
    normalized.endsWith(".log")
  );
}

async function collectSnapshotEntry(relativePath, snapshot) {
  if (shouldIgnoreChange(relativePath)) return;

  const fullPath = path.join(rootDir, relativePath);
  let info;
  try {
    info = await stat(fullPath);
  } catch {
    return;
  }

  if (info.isDirectory()) {
    const entries = await readdir(fullPath, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      await collectSnapshotEntry(path.join(relativePath, entry.name), snapshot);
    }
    return;
  }

  if (info.isFile()) {
    snapshot.set(relativePath.replaceAll("\\", "/"), `${info.mtimeMs}:${info.size}`);
  }
}

async function readContentSnapshot() {
  const snapshot = new Map();
  for (const target of watchTargets) await collectSnapshotEntry(target, snapshot);
  return snapshot;
}

function changedPath(previous, next) {
  for (const [file, signature] of next) {
    if (previous.get(file) !== signature) return file;
  }
  for (const file of previous.keys()) {
    if (!next.has(file)) return file;
  }
  return null;
}

async function pollForChanges() {
  try {
    const nextSnapshot = await readContentSnapshot();
    const changed = changedPath(contentSnapshot, nextSnapshot);
    if (changed) {
      contentSnapshot = nextSnapshot;
      scheduleBuild(changed);
    }
  } catch (error) {
    setStatus({ state: "error", message: `Preview polling failed: ${error.message}` });
  } finally {
    setTimeout(pollForChanges, pollIntervalMs);
  }
}

async function startPolling() {
  if (pollingStarted) return;
  pollingStarted = true;
  contentSnapshot = await readContentSnapshot();
  setTimeout(pollForChanges, pollIntervalMs);
}

function createPreviewServer() {
  return createServer(async (request, response) => {
    const url = request.url || "/";
    if (url.startsWith("/__Pagekiln/events")) {
      response.writeHead(200, {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      });
      response.write(`event: status\ndata: ${JSON.stringify(status)}\n\n`);
      clients.add(response);
      request.on("close", () => clients.delete(response));
      return;
    }
    if (url.startsWith("/__Pagekiln/status")) {
      response.writeHead(200, {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store"
      });
      response.end(JSON.stringify(status));
      return;
    }

    const file = await findFile(url);
    if (!file) {
      if (status.state === "building" || status.state === "starting") {
        sendPreviewMessage(response, 202, "正在生成页面", "这个路径还没有生成完成。构建成功后预览会自动刷新。");
        return;
      }
      if (status.state === "error") {
        sendPreviewMessage(response, 500, "构建失败", "请查看页面底部的错误提示；预览服务会保持运行，修复后会继续尝试构建。");
        return;
      }
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const ext = path.extname(file);
    const statusCode = file.endsWith("404.html") ? 404 : 200;
    if (ext === ".html") {
      await sendHtml(file, response, statusCode);
      return;
    }

    response.writeHead(statusCode, {
      "Content-Type": mime.get(ext) || "application/octet-stream",
      "Cache-Control": ext === ".xml" ? "no-cache" : "no-store",
      "X-Content-Type-Options": "nosniff"
    });
    createReadStream(file).pipe(response);
  });
}

function listen(server, port) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && port < preferredPort + 20) {
      listen(server, port + 1);
      return;
    }
    throw error;
  });
  server.listen(port, host, () => {
    const address = `http://${host}:${port}/`;
    console.log(`Serving live preview at ${address}`);
    console.log("Polling content, themes, static, and config.yml every 10 seconds.");
    console.log("Build errors stay visible in the browser; press Ctrl+C to stop.");
  });
}

listen(createPreviewServer(), preferredPort);
build("startup").finally(startPolling);
