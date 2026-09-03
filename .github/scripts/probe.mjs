import { execFile as execFileCallback } from 'node:child_process';
import { promises as dnsPromises } from 'node:dns';
import { Resolver } from 'node:dns/promises';
import { promises as fs } from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { promisify } from 'node:util';

const execFile = promisify(execFileCallback);
const root = process.cwd();
const configPath = path.join(root, '.github', 'probes.json');
const outputPath = path.join(root, 'status', 'probes.json');
const supportedTypes = new Set(['http', 'tcp', 'ping', 'dns']);
const defaultTimeoutMs = 10_000;
const defaultHistoryLimit = 100;

const bandDefinitions = {
  http: [
    { key: 'green', label: '0–3000ms', max: 3000 },
    { key: 'yellow', label: '3000–6000ms', max: 6000 },
    { key: 'red', label: '>6000ms', max: Infinity }
  ],
  ping: [
    { key: 'green', label: '0–50ms', max: 50 },
    { key: 'lime', label: '50–100ms', max: 100 },
    { key: 'yellow', label: '100–150ms', max: 150 },
    { key: 'orange', label: '150–200ms', max: 200 },
    { key: 'red', label: '>200ms', max: Infinity }
  ],
  tcp: [
    { key: 'dark-green', label: '≤50ms', max: 50 },
    { key: 'green', label: '51–100ms', max: 100 },
    { key: 'lime', label: '101–200ms', max: 200 },
    { key: 'yellow', label: '201–250ms', max: 250 },
    { key: 'orange', label: '>250ms', max: Infinity }
  ],
  dns: [
    { key: 'green', label: '0–100ms', max: 100 },
    { key: 'yellow', label: '100–500ms', max: 500 },
    { key: 'red', label: '>500ms', max: Infinity }
  ]
};

function finiteNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function roundMs(value) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : null;
}

function elapsedMs(startedAt) {
  return roundMs(Number(process.hrtime.bigint() - startedAt) / 1_000_000);
}

function bandFor(type, responseTime, failed = false) {
  if (failed || !Number.isFinite(responseTime)) return { key: 'timeout', label: '超时' };
  const definitions = bandDefinitions[type] || bandDefinitions.http;
  return definitions.find(definition => responseTime <= definition.max) || definitions.at(-1);
}

function defaultDegradedAboveMs(type) {
  return { http: 3000, ping: 100, tcp: 200, dns: 500 }[type] || 3000;
}

function checkStatus(target, outcome) {
  if (!outcome.ok) return 'down';
  if (target.type === 'http' && outcome.httpStatus >= 400) return outcome.httpStatus >= 500 ? 'down' : 'degraded';
  const band = bandFor(target.type, outcome.responseTime);
  if (band.key === 'red') return 'down';
  const threshold = finiteNumber(target.degradedAboveMs, defaultDegradedAboveMs(target.type));
  return Number.isFinite(outcome.responseTime) && outcome.responseTime > threshold ? 'degraded' : 'operational';
}

function validateTarget(rawTarget, index) {
  if (!rawTarget || typeof rawTarget !== 'object' || Array.isArray(rawTarget)) throw new Error(`targets[${index}] must be an object`);
  const target = { ...rawTarget };
  target.id = String(target.id || '').trim();
  target.name = String(target.name || target.id || '').trim();
  target.type = String(target.type || '').trim().toLowerCase();
  if (!target.id) throw new Error(`targets[${index}] needs a non-empty id`);
  if (!target.name) throw new Error(`targets[${index}] needs a non-empty name`);
  if (!supportedTypes.has(target.type)) throw new Error(`targets[${index}] has unsupported type "${target.type}"; use http, tcp, ping, or dns`);
  if (target.type === 'http') {
    let parsed;
    try { parsed = new URL(String(target.url || '')); } catch { throw new Error(`targets[${index}] HTTP target needs a valid url`); }
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error(`targets[${index}] HTTP url must use http or https`);
    target.url = parsed.toString();
    if (target.expectedStatus !== undefined) {
      const expectedStatuses = (Array.isArray(target.expectedStatus) ? target.expectedStatus : [target.expectedStatus]).map(Number);
      if (!expectedStatuses.length || expectedStatuses.some(status => !Number.isInteger(status) || status < 100 || status > 599)) throw new Error(`targets[${index}] HTTP expectedStatus must contain status codes from 100 to 599`);
      target.expectedStatus = expectedStatuses;
    }
  }
  if (['tcp', 'ping', 'dns'].includes(target.type)) {
    target.host = String(target.host || '').trim();
    if (!target.host || /[\s/]/.test(target.host)) throw new Error(`targets[${index}] ${target.type} target needs a valid host`);
  }
  if (target.type === 'tcp') {
    target.port = Number(target.port);
    if (!Number.isInteger(target.port) || target.port < 1 || target.port > 65535) throw new Error(`targets[${index}] TCP target needs a port from 1 to 65535`);
  }
  if (target.type === 'dns') {
    target.query = String(target.query || '').trim();
    if (!target.query || /[\s/]/.test(target.query)) throw new Error(`targets[${index}] DNS target needs a query hostname`);
  }
  target.timeoutMs = Math.min(30_000, Math.max(500, Math.round(finiteNumber(target.timeoutMs, finiteNumber(process.env.PROBE_TIMEOUT_MS, defaultTimeoutMs)))));
  target.degradedAboveMs = Math.max(0, finiteNumber(target.degradedAboveMs, defaultDegradedAboveMs(target.type)));
  return target;
}

async function probeHttp(target) {
  const startedAt = process.hrtime.bigint();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), target.timeoutMs);
  try {
    const response = await fetch(target.url, {
      method: String(target.method || 'GET').toUpperCase(),
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'OpenJSU-Pulse-GitHub-Action/1.0' }
    });
    const responseTime = elapsedMs(startedAt);
    const expected = Array.isArray(target.expectedStatus) ? target.expectedStatus : null;
    const expectedStatus = expected?.length ? expected.includes(response.status) : response.status >= 200 && response.status < 400;
    if (response.body?.cancel) await response.body.cancel();
    return { ok: expectedStatus, responseTime, httpStatus: response.status, message: `HTTP ${response.status}` };
  } catch (error) {
    return { ok: false, responseTime: elapsedMs(startedAt), message: error?.name === 'AbortError' ? 'HTTP timeout' : `HTTP error: ${error?.message || 'unknown error'}` };
  } finally {
    clearTimeout(timer);
  }
}

function probeTcp(target) {
  const startedAt = process.hrtime.bigint();
  return new Promise(resolve => {
    let finished = false;
    const socket = net.createConnection({ host: target.host, port: target.port });
    const finish = outcome => {
      if (finished) return;
      finished = true;
      socket.destroy();
      resolve(outcome);
    };
    socket.setTimeout(target.timeoutMs, () => finish({ ok: false, responseTime: elapsedMs(startedAt), message: 'TCP timeout' }));
    socket.once('connect', () => finish({ ok: true, responseTime: elapsedMs(startedAt), message: `TCP ${target.port}` }));
    socket.once('error', error => finish({ ok: false, responseTime: elapsedMs(startedAt), message: `TCP error: ${error?.message || 'unknown error'}` }));
  });
}

async function probePing(target) {
  const command = process.platform === 'win32' ? 'ping.exe' : 'ping';
  const args = process.platform === 'win32'
    ? ['-n', '1', '-w', String(target.timeoutMs), target.host]
    : ['-c', '1', '-W', String(Math.max(1, Math.ceil(target.timeoutMs / 1000))), target.host];
  const startedAt = process.hrtime.bigint();
  try {
    const { stdout, stderr } = await execFile(command, args, { timeout: target.timeoutMs + 1500, maxBuffer: 64 * 1024 });
    const output = `${stdout}\n${stderr}`;
    const match = output.match(/time[=<]\s*([\d.]+)\s*ms/i);
    return { ok: true, responseTime: match ? roundMs(Number(match[1])) : elapsedMs(startedAt), message: 'ICMP echo' };
  } catch (error) {
    return { ok: false, responseTime: elapsedMs(startedAt), message: error?.killed ? 'Ping timeout' : `Ping error: ${error?.message || 'unknown error'}` };
  }
}

async function probeDns(target, config) {
  const startedAt = process.hrtime.bigint();
  try {
    const resolver = new Resolver();
    const server = net.isIP(target.host) ? target.host : (await dnsPromises.lookup(target.host)).address;
    resolver.setServers([server]);
    const answers = await resolver.resolve4(target.query || config.dns?.query || 'example.com');
    return { ok: answers.length > 0, responseTime: elapsedMs(startedAt), message: `${answers.length} A record${answers.length === 1 ? '' : 's'}` };
  } catch (error) {
    return { ok: false, responseTime: elapsedMs(startedAt), message: `DNS error: ${error?.message || 'unknown error'}` };
  }
}

async function probeTarget(target, config) {
  const outcome = target.type === 'http'
    ? await probeHttp(target)
    : target.type === 'tcp'
      ? await probeTcp(target)
      : target.type === 'ping'
        ? await probePing(target)
        : await probeDns(target, config);
  const status = checkStatus(target, outcome);
  const timedOut = !Number.isFinite(outcome.responseTime) || /timeout/i.test(outcome.message || '');
  const band = bandFor(target.type, outcome.responseTime, timedOut);
  return { ...outcome, status, band: band.key, bandLabel: band.label, checkedAt: new Date().toISOString() };
}

function normalizeHistoryItem(item) {
  if (typeof item === 'string') return { status: item, checkedAt: null, responseTime: null };
  if (!item || typeof item !== 'object') return null;
  return {
    status: String(item.status || 'down'),
    checkedAt: item.checkedAt || null,
    responseTime: Number.isFinite(Number(item.responseTime)) ? Number(item.responseTime) : null
  };
}


async function readPreviousSnapshot() {
  try {
    return JSON.parse(await fs.readFile(outputPath, 'utf8'));
  } catch {
    return null;
  }
}

function publicTarget(target) {
  const candidate = String(target.name || target.id).trim();
  const looksLikeAddress = /^(?:https?:\/\/|www\.)|^(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#:]|$)/i.test(candidate);
  return {
    id: target.id,
    name: looksLikeAddress ? target.id : candidate
  };
}


async function main() {
  const config = JSON.parse(await fs.readFile(configPath, 'utf8'));
  if (!Array.isArray(config.targets) || !config.targets.length) throw new Error('probes.json must contain at least one target');
  const targets = config.targets.map(validateTarget);
  const ids = new Set();
  for (const target of targets) {
    if (ids.has(target.id)) throw new Error(`duplicate target id "${target.id}"`);
    ids.add(target.id);
  }
  const historyLimit = Math.min(100, Math.max(1, Math.round(finiteNumber(config.historyLimit, defaultHistoryLimit))));
  const previous = await readPreviousSnapshot();
  const previousById = new Map((previous?.services || []).map(service => [service.id, service]));
  const results = await Promise.all(targets.map(async target => ({ target, outcome: await probeTarget(target, config) })));
  const services = results.map(({ target, outcome }) => {
    const previousService = previousById.get(target.id);
    const priorChecks = Array.isArray(previousService?.checks) ? previousService.checks.map(normalizeHistoryItem).filter(Boolean) : [];
    const check = {
      status: outcome.status,
      responseTime: outcome.responseTime,
      checkedAt: outcome.checkedAt
    };
    const checks = [check, ...priorChecks].filter(item => item.checkedAt || item === check).slice(0, historyLimit);
    const normalChecks = checks.filter(item => item.status === 'operational');
    const uptime = checks.length ? Number((normalChecks.length / checks.length * 100).toFixed(2)) : 0;
    return {
      ...publicTarget(target),
      status: outcome.status,
      responseTime: outcome.responseTime,
      lastChecked: outcome.checkedAt,
      uptime,
      checks
    };
  });
  const snapshot = {
    version: 1,
    generatedAt: new Date().toISOString(),
    intervalMinutes: Math.max(1, Math.round(finiteNumber(config.intervalMinutes, 5))),
    historyLimit,
    services
  };

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, 'utf8');
  for (const service of services) console.log(`${service.status.padEnd(11)} ${service.name} ${service.responseTime ?? '—'}ms`);
}

try {
  await main();
} catch (error) {
  console.error(error?.stack || error);
  process.exitCode = 1;
}
