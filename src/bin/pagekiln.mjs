#!/usr/bin/env node

import { createContext, refreshContext, build, check, inspect, getCatalog } from '../runtime/compiler.js';
import { promises as fs } from 'node:fs';
import { watch } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { deploy, deployHelp } from '../deploy.mjs';

const args = process.argv.slice(2);
const requestedCommand = args[0] || 'g';
const command = ({ g: 'build', s: 'serve', d: 'deploy' })[requestedCommand] || requestedCommand;
const commandArgs = args.slice(1);
const root = process.env.PAGEKILN_SITE_ROOT || process.cwd();
const publicCommands = new Set(['g', 's', 'd', 'build', 'check', 'catalog', 'inspect', 'init', 'help', '--help', '-h']);

const starterRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../starter');

async function writeNew(file, value) {
  try {
    await fs.access(file);
  } catch {
    await fs.writeFile(file, value);
  }
}

async function copyStarter(source, destination) {
  await fs.mkdir(destination, { recursive: true });
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    const from = path.join(source, entry.name);
    const to = path.join(destination, entry.name);
    if (entry.isDirectory()) await copyStarter(from, to);
    else await writeNew(to, await fs.readFile(from));
  }
}

async function initialize() {
  await copyStarter(starterRoot, root);
  console.log('Initialized neutral Pagekiln site.');
}

function contentType(file) {
  const extension = path.extname(file).toLowerCase();
  return ({
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.md': 'text/markdown; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon',
    '.webp': 'image/webp',
    '.avif': 'image/avif',
    '.svg': 'image/svg+xml',
    '.woff2': 'font/woff2'
  })[extension] || 'application/octet-stream';
}

function outputPath(ctx, requestUrl) {
  const url = new URL(requestUrl || '/', 'http://localhost');
  const pathname = decodeURIComponent(url.pathname);
  const relative = pathname === '/'
    ? 'index.html'
    : `${pathname.replace(/^\/+/, '')}${pathname.endsWith('/') ? 'index.html' : ''}`;
  const outputRoot = path.resolve(ctx.out);
  const file = path.resolve(outputRoot, relative);
  return file.startsWith(`${outputRoot}${path.sep}`) ? file : null;
}

async function develop() {
  let ctx = await createContext(root);
  await build(ctx);
  let timer;
  let building = false;
  const changedFiles = new Set();
  const liveClients = new Set();
  const liveReloadScript = `<script>(()=>{const source=new EventSource('/__pagekiln/live');source.onmessage=()=>location.reload()})()</script>`;
  const notifyReload = () => { for (const client of liveClients) { try { client.write('data: reload\\n\\n'); } catch { liveClients.delete(client); } } };
  const flush = async () => {
    if (building) return;
    building = true;
    try {
      while (changedFiles.size) {
        const changes = [...changedFiles];
        changedFiles.clear();
        try {
          await refreshContext(ctx, changes);
          await build(ctx);
          notifyReload();
          console.log(`Rebuilt ${ctx.docs.length} documents (${changes.length} changed files) in ${Math.round(ctx.profile.total)}ms`);
        } catch (error) {
          console.error(error);
        }
      }
    } finally {
      building = false;
    }
  };
  const rebuild = file => {
    if (file) changedFiles.add(String(file));
    clearTimeout(timer);
    timer = setTimeout(() => void flush(), 80);
  };
  const watcher = watch(root, { recursive: true }, (_event, file) => {
    const candidate = String(file || '');
    if (!candidate) return;
    const absolute = path.isAbsolute(candidate) ? candidate : path.join(root, candidate);
    const relative = path.relative(root, absolute).replaceAll('\\', '/');
    if (!relative || relative.startsWith('../') || ['dist/', '.pagekiln/', 'node_modules/', 'src/runtime/'].some(prefix => relative.startsWith(prefix))) return;
    if (relative === 'config.yml' || relative === 'AGENTS.md' || relative.startsWith('content/') || relative.startsWith('themes/')) rebuild(relative);
  });
  const server = createServer(async (request, response) => {
    const requestUrl = new URL(request.url || '/', 'http://localhost');
    if (requestUrl.pathname === '/__pagekiln/live') {
      response.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', connection: 'keep-alive' });
      response.write(': connected\\n\\n');
      liveClients.add(response);
      request.on('close', () => liveClients.delete(response));
      return;
    }
    const file = outputPath(ctx, request.url);
    if (!file) {
      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
      response.end('Not found');
      return;
    }
    try {
      const data = await fs.readFile(file);
      response.writeHead(200, { 'content-type': contentType(file), 'cache-control': 'no-store' });
      if (file.endsWith('.html')) {
        const html = data.toString();
        const liveHtml = html.includes('</body>') ? html.replace('</body>', `${liveReloadScript}</body>`) : `${html}${liveReloadScript}`;
        response.end(Buffer.from(liveHtml));
      } else response.end(data);
    } catch {
      try {
        const data = await fs.readFile(path.join(ctx.out, '404.html'));
        response.writeHead(404, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
        response.end(data);
      } catch {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store' });
        response.end('Not found');
      }
    }
  });
  server.on('close', () => { watcher.close(); for (const client of liveClients) client.end(); liveClients.clear(); });
  const inlinePort = commandArgs.find(value => value.startsWith('--port='));
  const portValue = inlinePort?.slice('--port='.length) || (commandArgs.includes('--port') ? commandArgs[commandArgs.indexOf('--port') + 1] : commandArgs.find(value => /^\d+$/.test(value)) || '4173');
  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Invalid preview port: ${portValue}`);
  server.listen(port, () => console.log(`Pagekiln preview server: http://localhost:${port}`));
}

if (!publicCommands.has(requestedCommand)) {
  console.error(`Unknown command: ${requestedCommand}`);
  console.error('Run pagekiln --help for available commands.');
  process.exitCode = 1;
} else if (command === 'help' || command === '--help' || command === '-h') {
  console.log(`Usage: pagekiln <g|s|d|build|check|catalog|inspect|init> [options]\n\n  g                 Generate dist/\n  s [port]          Serve a local incremental preview\n  d [--dry-run]     Build and deploy from config.yml\n  build             Generate dist/ explicitly\n  check             Validate source and generated contracts\n  catalog           Print the source-backed theme and extension catalog\n  inspect <query>   Inspect content or a block, pattern, collection, or plugin\n  init              Create a neutral starter site\n\n${deployHelp()}`);
} else if (command === 'catalog') {
  const ctx = await createContext(root);
  console.log(JSON.stringify(getCatalog(ctx), null, 2));
} else if (command === 'inspect') {
  try {
    console.log(JSON.stringify(await inspect(await createContext(root), commandArgs[0]), null, 2));
  } catch (error) {
    const code = error?.code || 'INSPECT_ERROR';
    console.error(JSON.stringify({ error: { code, message: error.message || String(error), query: commandArgs[0] || '', ...(error?.details || {}) } }, null, 2));
    process.exitCode = 1;
  }
} else if (command === 'check') {
  const ctx = await createContext(root);
  await build(ctx);
  const result = await check(ctx);
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exitCode = 1;
} else if (command === 'init') {
  await initialize();
} else if (command === 'serve') {
  await develop();
} else if (command === 'deploy') {
  if (commandArgs.includes('--help') || commandArgs.includes('-h')) {
    console.log(deployHelp());
    process.exit(0);
  }
  const ctx = await createContext(root);
  await build(ctx);
  await deploy(root, ctx, commandArgs);
} else if (command === 'build') {
  const ctx = await createContext(root);
  await build(ctx);
  console.log(`Built ${ctx.docs.length} documents in ${Math.round(ctx.profile.total)}ms`);
  if (commandArgs.includes('--profile')) console.log(JSON.stringify(ctx.profile, null, 2));
}
