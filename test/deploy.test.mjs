import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { deploy } from '../src/deploy.mjs';

test('deployment reads the target and VPS destination from config.yml data', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'pagekiln-deploy-'));
  try {
    const out = path.join(root, 'dist');
    await mkdir(out, { recursive: true });
    const result = await deploy(root, {
      config: { deployment: { targets: ['vps'], vps: { host: 'example.com', user: 'deploy', remotePath: '/var/www/site', port: 2222, identityFile: '~/.ssh/id_ed25519', publicKeyFile: '~/.ssh/id_ed25519.pub' } } },
      out
    }, ['--dry-run']);
    assert.deepEqual(result.targets, ['vps']);
    assert.equal(result.results[0].status, 'dry-run');
    assert.deepEqual(result.results[0].args.slice(0, 3), ['-r', '-P', '2222']);
    assert.equal(result.results[0].args.includes('-i'), true);
    assert.equal(result.results[0].authFiles.length, 2);
    assert.match(result.results[0].args.at(-1), /deploy@example\.com:\/var\/www\/site\/$/);
    await assert.rejects(() => deploy(root, { config: { deployment: { targets: ['vps'], vps: { remotePath: '/var/www/site' } } }, out }, ['--target', 'vps']), /config\.yml/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('GitHub and Cloudflare token configuration names environment variables without exposing secrets', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'pagekiln-deploy-token-'));
  try {
    const out = path.join(root, 'dist');
    await mkdir(out, { recursive: true });
    const github = await deploy(root, {
      config: { deployment: { targets: ['github-pages'], github: { remote: 'origin', branch: 'gh-pages', tokenEnv: 'GITHUB_TOKEN' } } },
      out
    }, ['--dry-run']);
    assert.equal(github.results[0].credentialEnv, 'GITHUB_TOKEN');
    assert.equal(JSON.stringify(github).includes('secret-value'), false);

    const cloudflare = await deploy(root, {
      config: { deployment: { targets: ['cloudflare-pages'], cloudflare: { apiTokenEnv: 'PAGEKILN_TEST_CLOUDFLARE_TOKEN_7F4B', pages: { project: 'pagekiln-site' } } } },
      out
    }, ['--dry-run']);
    assert.equal(cloudflare.results[0].credentialEnv, 'PAGEKILN_TEST_CLOUDFLARE_TOKEN_7F4B');
    await assert.rejects(() => deploy(root, {
      config: { deployment: { targets: ['cloudflare-pages'], cloudflare: { apiTokenEnv: 'PAGEKILN_TEST_CLOUDFLARE_TOKEN_7F4B', pages: { project: 'pagekiln-site' } } } },
      out
    }), /PAGEKILN_TEST_CLOUDFLARE_TOKEN_7F4B/);
    await assert.rejects(() => deploy(root, {
      config: { deployment: { targets: ['github-pages'], github: { remote: 'origin', branch: 'gh-pages', token: 'secret-value' } } },
      out
    }, ['--dry-run']), /must not contain a secret/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('VPS rejects a public key without its private key', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'pagekiln-deploy-keypair-'));
  try {
    const out = path.join(root, 'dist');
    await mkdir(out, { recursive: true });
    await assert.rejects(() => deploy(root, {
      config: { deployment: { targets: ['vps'], vps: { host: 'example.com', user: 'deploy', remotePath: '/var/www/site', publicKeyFile: '~/.ssh/id_ed25519.pub' } } },
      out
    }, ['--dry-run']), /publicKeyFile requires/);
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

test('OpenAI Sites handoff validates the dist entry and static root', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'pagekiln-deploy-sites-'));
  try {
    const out = path.join(root, 'dist');
    await mkdir(path.join(out, 'server'), { recursive: true });
    await mkdir(path.join(root, '.openai'), { recursive: true });
    await writeFile(path.join(out, 'server/index.js'), 'export default {}');
    await writeFile(path.join(out, 'index.html'), '<!doctype html>');
    await writeFile(path.join(root, '.openai/hosting.json'), '{"project_id":"appgprj_test"}');
    const result = await deploy(root, {
      config: { deployment: { targets: ['openai-sites'], openaiSites: { metadata: '.openai/hosting.json', staticDirectory: 'dist' } } },
      out
    }, ['--dry-run']);
    assert.equal(result.results[0].status, 'handoff-required');
    assert.equal(result.results[0].staticDirectory, 'dist');
    await rm(path.join(out, 'index.html'));
    await assert.rejects(() => deploy(root, {
      config: { deployment: { targets: ['openai-sites'], openaiSites: { metadata: '.openai/hosting.json', staticDirectory: 'dist' } } },
      out
    }, ['--dry-run']), /dist\/index\.html/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
