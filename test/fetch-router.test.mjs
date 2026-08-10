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
