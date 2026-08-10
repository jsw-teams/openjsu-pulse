import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { deploy } from '../src/deploy.mjs';

test('deployment reads the target and VPS destination from config.yml data', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'pagekiln-deploy-'));
  try {
    const out = path.join(root, 'dist');
    await mkdir(out, { recursive: true });
    const result = await deploy(root, {
      config: { deployment: { targets: ['vps'], vps: { host: 'example.com', user: 'deploy', remotePath: '/var/www/site', port: 2222 } } },
      out
    }, ['--dry-run']);
    assert.deepEqual(result.targets, ['vps']);
    assert.equal(result.results[0].status, 'dry-run');
    assert.deepEqual(result.results[0].args.slice(0, 3), ['-r', '-P', '2222']);
    assert.match(result.results[0].args.at(-1), /deploy@example\.com:\/var\/www\/site\/$/);
    await assert.rejects(() => deploy(root, { config: { deployment: { targets: ['vps'], vps: { remotePath: '/var/www/site' } } }, out }, ['--target', 'vps']), /config\.yml/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('deployment can resolve multiple targets from config.yml in order', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'pagekiln-deploy-multi-'));
  try {
    const out = path.join(root, 'dist');
    await mkdir(out, { recursive: true });
    const result = await deploy(root, {
      config: {
        deployment: {
          targets: ['vps', 'cloudflare-pages'],
          vps: { host: 'example.com', user: 'deploy', remotePath: '/var/www/site' },
          cloudflare: { pages: { project: 'pagekiln-site' } }
        }
      },
      out
    }, ['--dry-run']);
    assert.deepEqual(result.targets, ['vps', 'cloudflare-pages']);
    assert.deepEqual(result.results.map(entry => entry.target), ['vps', 'cloudflare-pages']);
    assert.equal(result.results.every(entry => entry.status === 'dry-run'), true);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
