import test from 'node:test';
import assert from 'node:assert/strict';
import { Router, createSiteFetchHandler } from '../src/fetch-router.ts';

test('Fetch router matches methods and decoded parameters', async () => {
  const router = new Router();
  router.get('/api/items/:id', ({ params }) => Response.json({ id: params.id }));
  const response = await router.match(new Request('https://example.test/api/items/a%20b'), {}, {});
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { id: 'a b' });
  assert.equal(await router.match(new Request('https://example.test/api/items/a', { method: 'POST' }), {}, {}), null);
});

test('shared site handler runs dynamic routes and delegates static assets', async () => {
  const router = new Router();
  router.get('/api/health', () => new Response('ok'));
  const fetched = [];
  const handler = createSiteFetchHandler({
    router,
    defaultLocale: 'en',
    assets(request) { fetched.push(new URL(request.url).pathname); return new Response('asset'); }
  });
  assert.equal(await (await handler(new Request('https://example.test/api/health'), {}, {})).text(), 'ok');
  assert.equal(await (await handler(new Request('https://example.test/'), {}, {})).text(), 'asset');
  assert.deepEqual(fetched, ['/index.html']);
});

test('site handler falls back to the archive dist asset prefix', async () => {
  const requested = [];
  const handler = createSiteFetchHandler({ defaultLocale: 'en' });
  const response = await handler(new Request('https://example.test/'), {
    ASSETS: {
      fetch(request) {
        const pathname = new URL(request.url).pathname;
        requested.push(pathname);
        return pathname === '/dist/index.html' ? new Response('asset') : new Response('missing', { status: 404 });
      }
    }
  }, {});
  assert.equal(await response.text(), 'asset');
  assert.deepEqual(requested, ['/', '/index.html', '/dist/index.html']);
});

test('site handler checks the configured static asset directory', async () => {
  const requested = [];
  const handler = createSiteFetchHandler({ defaultLocale: 'en', staticDirectory: 'static' });
  const response = await handler(new Request('https://example.test/'), {
    ASSETS: {
      fetch(request) {
        const pathname = new URL(request.url).pathname;
        requested.push(pathname);
        return pathname === '/static/index.html' ? new Response('asset') : new Response('missing', { status: 404 });
      }
    }
  }, {});
  assert.equal(await response.text(), 'asset');
  assert.deepEqual(requested, ['/', '/index.html', '/static/index.html']);
});

test('site handler skips a Pages self-redirect and continues to an asset candidate', async () => {
  const requested = [];
  const handler = createSiteFetchHandler({ defaultLocale: 'en' });
  const response = await handler(new Request('https://example.test/'), {
    ASSETS: {
      fetch(request) {
        const pathname = new URL(request.url).pathname;
        requested.push(pathname);
        if (pathname === '/') return new Response(null, { status: 308, headers: { location: '/' } });
        return pathname === '/index.html' ? new Response('asset') : new Response('missing', { status: 404 });
      }
    }
  }, {});
  assert.equal(await response.text(), 'asset');
  assert.deepEqual(requested, ['/', '/index.html']);
});

test('site handler never returns a same-path asset redirect when no candidate exists', async () => {
  const handler = createSiteFetchHandler({ defaultLocale: 'en' });
  const response = await handler(new Request('https://example.test/missing/'), {
    ASSETS: { fetch: () => new Response(null, { status: 308, headers: { location: '/missing/' } }) }
  }, {});
  assert.equal(response.status, 404);
});
