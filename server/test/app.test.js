import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it } from 'node:test';
import request from 'supertest';
import { LinkStore } from '../src/link-store.js';
import { createApp } from '../src/app.js';

describe('URL shortener API', () => {
  let api;
  let server;

  beforeEach(async () => {
    await new Promise((resolve) => {
      server = createApp().listen(0, '127.0.0.1', resolve);
    });
    api = request(server);
  });

  afterEach(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it('reports its health', async () => {
    const response = await api.get('/api/health');

    assert.equal(response.status, 200);
    assert.deepEqual(response.body, { status: 'ok' });
  });

  it('creates and redirects a short link', async () => {
    const created = await api
      .post('/api/shorten')
      .send({ url: 'https://example.com/articles?id=7' });

    assert.equal(created.status, 201);
    assert.match(created.body.code, /^[A-Za-z0-9_-]{8}$/);
    assert.equal(created.body.originalUrl, 'https://example.com/articles?id=7');
    const shortUrl = new URL(created.body.shortUrl);
    assert.equal(shortUrl.protocol, 'http:');
    assert.equal(shortUrl.pathname, `/${created.body.code}`);
    assert.ok(Date.parse(created.body.createdAt));

    const listed = await api.get('/api/links');
    assert.equal(listed.status, 404);
    assert.equal(JSON.stringify(listed.body).includes(created.body.originalUrl), false);

    const redirected = await api.get(`/${created.body.code}`);
    assert.equal(redirected.status, 302);
    assert.equal(redirected.headers.location, created.body.originalUrl);
  });

  it('rejects missing, malformed, and unsupported URLs', async () => {
    for (const url of [undefined, 'not a url', 'ftp://example.com/file']) {
      const response = await api.post('/api/shorten').send({ url });
      assert.equal(response.status, 400);
      assert.match(response.body.error, /valid HTTP or HTTPS URL/);
    }
  });

  it('returns JSON errors for unknown links and routes', async () => {
    const unknownLink = await api.get('/missing-code');
    const unknownRoute = await api.get('/api/missing');

    assert.equal(unknownLink.status, 404);
    assert.deepEqual(unknownLink.body, { error: 'Short link not found.' });
    assert.equal(unknownRoute.status, 404);
    assert.deepEqual(unknownRoute.body, { error: 'Route not found.' });
  });

  it('returns a helpful error for malformed JSON', async () => {
    const response = await api
      .post('/api/shorten')
      .set('Content-Type', 'application/json')
      .send('{');

    assert.equal(response.status, 400);
    assert.deepEqual(response.body, { error: 'Request body must be valid JSON.' });
  });
});

async function withApi(options, run) {
  const server = createApp(options).listen(0, '127.0.0.1');
  try { await run(request(server)); }
  finally { await new Promise((resolve) => server.close(resolve)); }
}

it('requires a trusted production origin and ignores spoofed headers', async () => {
  assert.throws(() => createApp({ environment: 'production', baseUrl: '' }), /BASE_URL/);
  assert.throws(() => createApp({ baseUrl: 'javascript:alert(1)' }), /BASE_URL/);
  await withApi({ baseUrl: 'https://short.example', environment: 'production' }, async (api) => {
    const result = await api.post('/api/shorten').set('Host', 'evil.example')
      .set('X-Forwarded-Host', 'evil.example').send({ url: 'https://example.com' });
    assert.equal(result.status, 201);
    assert.equal(result.body.shortUrl, `https://short.example/${result.body.code}`);
  });
});

it('restricts origins, including preflight requests', async () => {
  await withApi({ allowedOrigins: ['https://ui.example'] }, async (api) => {
    assert.equal((await api.post('/api/shorten').set('Origin', 'https://evil.example')
      .send({ url: 'https://example.com' })).status, 403);
    assert.equal((await api.options('/api/shorten').set('Origin', 'https://evil.example')).status, 403);
    const allowed = await api.options('/api/shorten').set('Origin', 'https://ui.example')
      .set('Access-Control-Request-Method', 'POST');
    assert.equal(allowed.status, 204);
    assert.equal(allowed.headers['access-control-allow-origin'], 'https://ui.example');
  });
});

it('limits creation volume and recovers after the window', async () => {
  let time = 0;
  await withApi({ rateLimit: 1, rateWindowMs: 1000, now: () => time }, async (api) => {
    assert.equal((await api.post('/api/shorten').send({ url: 'https://example.com' })).status, 201);
    const limited = await api.post('/api/shorten').send({ url: 'https://example.com' });
    assert.equal(limited.status, 429);
    assert.equal(limited.headers['retry-after'], '1');
    time = 1000;
    assert.equal((await api.post('/api/shorten').send({ url: 'https://example.com' })).status, 201);
  });
});

it('bounds storage without deleting existing links and rejects oversized bodies', async () => {
  await withApi({ store: new LinkStore({ maxLinks: 1 }) }, async (api) => {
    const first = await api.post('/api/shorten').send({ url: 'https://example.com' });
    assert.equal((await api.post('/api/shorten').send({ url: 'https://example.org' })).status, 503);
    assert.equal((await api.get(`/${first.body.code}`)).status, 302);
    assert.equal((await api.post('/api/shorten').send({ url: 'x'.repeat(17000) })).status, 413);
  });
});
