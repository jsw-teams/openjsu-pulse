import { promises as fs } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';

const TARGET_ALIASES = new Map([
  ['cf-pages', 'cloudflare-pages'],
  ['cloudflare-pages', 'cloudflare-pages'],
  ['pages', 'cloudflare-pages'],
  ['cf-workers', 'cloudflare-workers'],
  ['cloudflare-workers', 'cloudflare-workers'],
  ['workers', 'cloudflare-workers'],
  ['github', 'github-pages'],
  ['github-pages', 'github-pages'],
  ['gh-pages', 'github-pages'],
  ['vps', 'vps'],
  ['scp', 'vps'],
  ['openai-site', 'openai-sites'],
  ['openai-sites', 'openai-sites'],
  ['sites', 'openai-sites']
]);

const TARGET_LABELS = {
  'cloudflare-pages': 'Cloudflare Pages',
  'cloudflare-workers': 'Cloudflare Workers',
  'github-pages': 'GitHub Pages',
  vps: 'VPS',
  'openai-sites': 'OpenAI Sites'
};

function executable(name) {
  return process.platform === 'win32' && name === 'wrangler' ? 'wrangler.cmd' : name;
}

function hasFlag(args, name) {
  return args.includes(name) || args.some(value => value === `${name}=true`);
}

function cleanName(value, fallback) {
  const candidate = String(value || fallback || '').trim();
  return candidate || fallback;
}

function environmentName(value, label) {
  const candidate = cleanName(value, '');
  if (!candidate) return '';
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(candidate)) throw new Error(`${label} must be a valid environment variable name.`);
  return candidate;
}

function secretEnvironment(value, label, dryRun) {
  const name = environmentName(value, label);
  if (!name) return { name: '', env: undefined };
  const secret = process.env[name];
  if (!dryRun && !secret) throw new Error(`${label} ${name} is not set; credentials stay in the environment and never in config.yml.`);
  return { name, env: dryRun || !secret ? undefined : { [name]: secret } };
}

function rejectInlineCredential(settings, label) {
  for (const key of ['token', 'apiToken', 'accessToken', 'secret']) {
    if (settings && Object.prototype.hasOwnProperty.call(settings, key) && String(settings[key] || '').trim()) {
      throw new Error(`${label}.${key} must not contain a secret; use an environment variable name instead.`);
    }
  }
}

function resolveUserPath(root, value) {
  const candidate = cleanName(value, '');
  if (!candidate) return '';
  if (candidate === '~') return os.homedir();
  if (/^~[\\/]/.test(candidate)) return path.join(os.homedir(), candidate.slice(2));
  return path.resolve(root, candidate);
}

function safeGitRef(value, label) {
  const candidate = cleanName(value, '');
  if (!candidate || candidate.startsWith('-') || !/^[A-Za-z0-9._/-]+$/.test(candidate)) throw new Error(`${label} contains unsupported characters: ${candidate || '(empty)'}`);
  return candidate;
}

function deploymentConfig(ctx) {
  return ctx.config?.deployment && typeof ctx.config.deployment === 'object' ? ctx.config.deployment : {};
}

export function configuredTargets(config) {
  const deployment = config && typeof config === 'object' ? config : {};
  const raw = deployment.targets;
  if (raw == null) return [];
  const values = Array.isArray(raw) ? raw : [raw];
  const targets = [];
  for (const value of values) {
    const target = normalizeTarget(value);
    if (!target) throw new Error(`Unknown deployment target "${String(value)}" in deployment.targets; choose one of ${Object.keys(TARGET_LABELS).join(', ')}.`);
    if (!targets.includes(target)) targets.push(target);
  }
  return targets;
}

export function normalizeTarget(value) {
  return TARGET_ALIASES.get(String(value || '').trim().toLowerCase()) || null;
}

export function deployHelp() {
  return [
    'Usage: pagekiln d [--dry-run]',
    '',
    'Targets:',
    '  cloudflare-pages   wrangler pages deploy dist --project-name <name>',
    '  cloudflare-workers  wrangler deploy using dist/wrangler.toml',
    '  github              git subtree push dist to a selected remote branch',
    '  vps                 scp dist/ to user@host:/remote/path',
    '  openai-sites        validate dist/, dist/server/, and .openai/hosting.json for Sites',
    '',
    'Deployment:',
    '  Set deployment.targets to one value or a list, plus provider settings, in config.yml.',
    '  Use --dry-run to inspect the resolved action without uploading.',
    '  GitHub HTTPS auth uses github.tokenEnv; Cloudflare auth uses cloudflare.apiTokenEnv.',
    '  VPS uses vps.identityFile for a private key and optional publicKeyFile for a key pair.',
    '  OpenAI Sites then uses the connector: push exact source HEAD, save one version, deploy that version, and poll it.',
    '',
    'Options:',
    '  --dry-run           build and print the deployment action without uploading'
  ].join('\n');
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: options.cwd, env: options.env ? { ...process.env, ...options.env } : undefined, shell: false, stdio: options.inherit === false ? ['ignore', 'pipe', 'pipe'] : 'inherit' });
    let stdout = '';
    let stderr = '';
    if (options.inherit === false) {
      child.stdout.on('data', chunk => { stdout += String(chunk); });
      child.stderr.on('data', chunk => { stderr += String(chunk); });
    }
    child.once('error', error => reject(new Error(`${command} is unavailable: ${error.message}`)));
    child.once('close', code => code === 0 ? resolve({ stdout, stderr }) : reject(new Error(`${command} exited with code ${code}${stderr.trim() ? `: ${stderr.trim()}` : ''}`)));
  });
}

async function requireFile(file, message) {
  try { await fs.access(file); } catch { throw new Error(message); }
}

function commandFor(target, root, ctx, options) {
  const config = deploymentConfig(ctx);
  const cloudflare = config.cloudflare && typeof config.cloudflare === 'object' ? config.cloudflare : {};
  const pages = cloudflare.pages && typeof cloudflare.pages === 'object' ? cloudflare.pages : {};
  const workers = cloudflare.workers && typeof cloudflare.workers === 'object' ? cloudflare.workers : {};
  const github = config.github && typeof config.github === 'object' ? config.github : {};
  const vps = config.vps && typeof config.vps === 'object' ? config.vps : {};
  const dist = ctx.out;
  if (target === 'cloudflare-pages') {
    const project = cleanName(pages.project, '');
    if (!project) throw new Error('Cloudflare Pages requires deployment.cloudflare.pages.project in config.yml.');
    rejectInlineCredential(cloudflare, 'deployment.cloudflare');
    const credential = secretEnvironment(cloudflare.apiTokenEnv, 'Cloudflare API token environment variable', options.dryRun);
    const commandArgs = ['pages', 'deploy', dist, '--project-name', project];
    if (pages.branch) commandArgs.push('--branch', safeGitRef(pages.branch, 'Cloudflare Pages branch'));
    return { command: executable('wrangler'), args: commandArgs, env: credential.env, credentialEnv: credential.name, summary: `Cloudflare Pages project ${project}` };
  }
  if (target === 'cloudflare-workers') {
    const configFile = path.join(dist, 'wrangler.toml');
    const name = cleanName(workers.name, '');
    if (!name || !cleanName(workers.compatibilityDate, '')) throw new Error('Cloudflare Workers requires deployment.cloudflare.workers.name and compatibilityDate in config.yml.');
    rejectInlineCredential(cloudflare, 'deployment.cloudflare');
    const credential = secretEnvironment(cloudflare.apiTokenEnv, 'Cloudflare API token environment variable', options.dryRun);
    return { command: executable('wrangler'), args: ['deploy', '--config', configFile], env: credential.env, credentialEnv: credential.name, summary: `Cloudflare Worker ${name}` };
  }
  if (target === 'github-pages') {
    const remote = safeGitRef(github.remote, 'Git remote');
    const branch = safeGitRef(github.branch, 'GitHub Pages branch');
    const prefix = path.relative(root, dist).replaceAll('\\', '/') || '.';
    rejectInlineCredential(github, 'deployment.github');
    const credential = secretEnvironment(github.tokenEnv, 'GitHub token environment variable', options.dryRun);
    const env = credential.env ? {
      ...credential.env,
      GIT_TERMINAL_PROMPT: '0',
      GIT_CONFIG_COUNT: '1',
      GIT_CONFIG_KEY_0: 'http.extraheader',
      GIT_CONFIG_VALUE_0: `AUTHORIZATION: basic ${Buffer.from(`x-access-token:${credential.env[credential.name]}`).toString('base64')}`
    } : undefined;
    return { command: executable('git'), args: ['subtree', 'push', '--prefix', prefix, remote, branch], env, credentialEnv: credential.name, summary: `GitHub Pages ${remote}/${branch}` };
  }
  if (target === 'vps') {
    const host = cleanName(vps.host, '');
    const user = cleanName(vps.user, '');
    const destinationPath = cleanName(vps.remotePath, '');
    if (!host || !user || !destinationPath) throw new Error('VPS deployment requires deployment.vps.host, user, and remotePath in config.yml.');
    if (!/^[A-Za-z0-9._:-]+$/.test(host)) throw new Error(`VPS host contains unsupported characters: ${host}`);
    if (!/^[A-Za-z0-9._-]+$/.test(user)) throw new Error(`VPS user contains unsupported characters: ${user}`);
    if (destinationPath.startsWith('-') || !/^[A-Za-z0-9._~/-]+$/.test(destinationPath)) throw new Error(`VPS remotePath contains unsupported characters: ${destinationPath}`);
    const sshPort = cleanName(vps.port, '22');
    const privateKeyValue = cleanName(vps.identityFile, '');
    const publicKeyValue = cleanName(vps.publicKeyFile, '');
    if (publicKeyValue && !privateKeyValue) throw new Error('VPS publicKeyFile requires the matching privateKeyFile; a public key alone cannot authenticate SCP.');
    const identityFile = resolveUserPath(root, privateKeyValue);
    const publicKeyFile = resolveUserPath(root, publicKeyValue);
    const destination = `${user}@${host}:${destinationPath.replace(/\/$/, '')}/`;
    const commandArgs = ['-r'];
    if (!/^\d{1,5}$/.test(sshPort) || Number(sshPort) < 1 || Number(sshPort) > 65535) throw new Error(`Invalid VPS port: ${sshPort}`);
    commandArgs.push('-P', sshPort);
    if (identityFile) {
      commandArgs.push('-i', identityFile);
    }
    const source = `${path.resolve(dist).replaceAll('\\', '/')}/.`;
    commandArgs.push(source, destination);
    return {
      command: executable('scp'),
      args: commandArgs,
      authFiles: [
        ...(identityFile ? [{ path: identityFile, label: 'VPS privateKeyFile' }] : []),
        ...(publicKeyFile ? [{ path: publicKeyFile, label: 'VPS publicKeyFile' }] : [])
      ],
      summary: `${user}@${host}:${destinationPath}`
    };
  }
  if (target === 'openai-sites') return { command: null, args: [], summary: 'OpenAI Sites connector handoff' };
  throw new Error(`Unknown deployment target: ${options.target || target}`);
}

async function validateOpenAISites(root, dist, settings = {}, metadataPath = '.openai/hosting.json') {
  const file = path.resolve(root, metadataPath);
  const relative = path.relative(root, file);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error('deployment.openaiSites.metadata must stay inside the site root.');
  await requireFile(file, `OpenAI Sites requires ${relative} with an existing project_id; no remote site was created.`);
  let metadata;
  try { metadata = JSON.parse(await fs.readFile(file, 'utf8')); } catch (error) { throw new Error(`Cannot parse ${relative}: ${error.message}`); }
  if (!metadata || typeof metadata.project_id !== 'string' || !metadata.project_id.trim()) throw new Error(`${relative} must contain the exact Sites project_id returned by the Sites connector.`);
  await requireFile(path.join(dist, 'server', 'index.js'), 'OpenAI Sites requires dist/server/index.js; run pagekiln g before the handoff.');
  const rawStaticDirectory = cleanName(settings.staticDirectory, 'dist').replaceAll('\\', '/').replace(/^\/+|\/+$/g, '');
  if (!rawStaticDirectory || rawStaticDirectory === '.' || rawStaticDirectory.split('/').includes('..')) throw new Error('deployment.openaiSites.staticDirectory must be a safe relative directory such as dist.');
  const staticRoot = rawStaticDirectory === 'dist' ? dist : path.join(dist, rawStaticDirectory);
  await requireFile(path.join(staticRoot, 'index.html'), `OpenAI Sites requires ${rawStaticDirectory}/index.html; run pagekiln g before the handoff.`);
  return { file, projectId: metadata.project_id, staticDirectory: rawStaticDirectory };
}

export async function deploy(root, ctx, args = []) {
  const config = deploymentConfig(ctx);
  const unsupportedOptions = args.filter(arg => arg !== '--dry-run');
  if (unsupportedOptions.length) throw new Error('Deployment target and provider settings belong in config.yml; pagekiln d only accepts --dry-run.');
  const targets = configuredTargets(config);
  if (!targets.length) throw new Error(`Set deployment.targets in config.yml. Available targets: ${Object.keys(TARGET_LABELS).join(', ')}.`);
  const options = { dryRun: hasFlag(args, '--dry-run') };
  const dist = ctx.out;
  await requireFile(dist, `Build output is missing: ${path.relative(root, dist) || 'dist'}`);
  const results = [];
  for (const target of targets) {
    const action = commandFor(target, root, ctx, options);
    if (target === 'openai-sites') {
      const openaiSites = config.openaiSites && typeof config.openaiSites === 'object' ? config.openaiSites : {};
      const sites = await validateOpenAISites(root, dist, openaiSites, cleanName(openaiSites.metadata, '.openai/hosting.json'));
      results.push({ target, label: TARGET_LABELS[target], status: 'handoff-required', projectId: sites.projectId, metadata: path.relative(root, sites.file), staticDirectory: sites.staticDirectory, dist: path.relative(root, dist) });
      continue;
    }
    if (options.dryRun) {
      results.push({ target, label: TARGET_LABELS[target], status: 'dry-run', command: action.command, args: action.args, cwd: root, credentialEnv: action.credentialEnv || undefined, authFiles: action.authFiles?.map(file => file.path), summary: action.summary });
      continue;
    }
    if (target === 'github-pages') await run(executable('git'), ['rev-parse', '--is-inside-work-tree'], { cwd: root });
    if (target === 'cloudflare-workers') await requireFile(path.join(dist, 'wrangler.toml'), 'Cloudflare Workers deployment file is missing: dist/wrangler.toml');
    for (const file of action.authFiles || []) await requireFile(file.path, `${file.label} does not exist: ${file.path}`);
    console.log(`Deploying ${path.relative(root, dist) || 'dist'} to ${action.summary}...`);
    await run(action.command, action.args, { cwd: root, env: action.env });
    results.push({ target, label: TARGET_LABELS[target], status: 'deployed', summary: action.summary });
  }
  if (targets.includes('openai-sites') && !options.dryRun) console.log('OpenAI Sites uses its connector to push the validated source, save a version, and deploy it; this CLI does not invent credentials or project IDs.');
  const result = { targets, results };
  console.log(JSON.stringify(result, null, 2));
  return result;
}
