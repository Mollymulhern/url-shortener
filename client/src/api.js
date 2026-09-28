async function request(path, options) {
  const response = await fetch(path, options);
  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || body.message || 'Something went wrong. Please try again.');
  }

  return body;
}

export function createShortLink(url) {
  return request('/api/shorten', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
}
