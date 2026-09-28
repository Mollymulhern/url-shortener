const assert = require('node:assert/strict');
const test = require('node:test');

const baseUrl = process.env.TEST_BASE_URL?.replace(/\/$/, '');
const liveTest = baseUrl ? test : test.skip;

liveTest('health endpoint reports that the API is available', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.match(response.headers.get('content-type') ?? '', /application\/json/);
});

liveTest('a URL can be shortened and resolved without a public listing', async () => {
  const originalUrl = 'https://example.com/docs?source=contract-test';
  const createResponse = await fetch(`${baseUrl}/api/shorten`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: originalUrl })
  });
  assert.equal(createResponse.status, 201);
  const created = await createResponse.json();
  assert.equal(created.originalUrl, originalUrl);
  assert.equal(typeof created.code, 'string');
  assert.ok(created.code.length > 0);
  assert.equal(typeof created.shortUrl, 'string');
  assert.doesNotThrow(() => new URL(created.shortUrl));
  assert.ok(!Number.isNaN(Date.parse(created.createdAt)));

  const listResponse = await fetch(`${baseUrl}/api/links`);
  assert.equal(listResponse.status, 404);

  const redirectResponse = await fetch(`${baseUrl}/${created.code}`, { redirect: 'manual' });
  assert.ok([301, 302, 307, 308].includes(redirectResponse.status));
  assert.equal(redirectResponse.headers.get('location'), originalUrl);
});

liveTest('invalid URLs are rejected', async () => {
  const response = await fetch(`${baseUrl}/api/shorten`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'not-a-url' })
  });
  assert.ok(response.status >= 400 && response.status < 500);
});
