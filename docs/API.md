# API Reference

The API accepts and returns JSON except for redirects. Locally it is available at `http://localhost:5000` by default.

## Health check

`GET /api/health` returns `200` when the service is ready.

## Create a short link

`POST /api/shorten`

```json
{ "url": "https://example.com/a/long/path" }
```

A successful request returns `201`:

```json
{
  "code": "aB3xYz",
  "originalUrl": "https://example.com/a/long/path",
  "shortUrl": "http://localhost:5000/aB3xYz",
  "createdAt": "2026-09-28T10:00:00.000Z"
}
```

Malformed or unsupported URLs return a `4xx` response with an error message.

## Privacy and limits

`GET /api/links` is not available (404). The UI keeps at most five recent links in this browser's localStorage. Clearing browser data removes this history.

Creation is limited globally to 60 POST requests per minute per server process, including invalid submissions. Excess requests receive 429 with a `Retry-After` header. The store holds at most 10,000 links; at capacity creation returns 503 while existing redirects continue working. Bodies over 16 KB return 413.

Links are in memory and disappear on restart. Durable storage and shared rate limits are required before scaling across processes. Short codes are publicly accessible; they are not access controls for private destinations.

`BASE_URL` sets the public HTTP(S) origin and is required outside development/test. Request headers are used only as a development fallback. Browser origins must match `BASE_URL` or a comma-separated entry in `CORS_ORIGINS`; other origins receive 403. Requests without Origin remain supported; rate limiting applies to them too.

## Follow a short link

`GET /:code` redirects to the stored `originalUrl`. An unknown code returns `404`.

## Example

```bash
curl -X POST http://localhost:5000/api/shorten \
  -H 'Content-Type: application/json' \
  -d '{"url":"https://example.com"}'
```
