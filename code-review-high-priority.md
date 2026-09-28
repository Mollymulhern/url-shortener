# Code review: high-priority findings

Based on reading the code; tests and lint were not run.

## 1. Every visitor sees every link (`server/src/app.js:43`)
- `GET /api/links` returns all links ever created, with no limit.
- The client shows them under "Made by you / Recent links", so any visitor sees URLs other people shortened, which can include private links.
- **Fix:** keep "recent links" per browser (e.g. `localStorage`) or add ownership. At minimum, stop exposing the full list publicly.

## 2. `shortUrl` is built from the `Host` header (`server/src/app.js:38`)
- Anyone can send `Host: evil.example`, and the saved `shortUrl` points to their domain. Because of #1, that link then appears in everyone's list.
- Behind a proxy or HTTPS load balancer, `request.protocol` is `http` because `trust proxy` isn't set.
- **Fix:** read a configured `BASE_URL` from env; fall back to the request only in development.

## 3. `server/.env` is never loaded
- README and AGENTS.md say to put `PORT` in `server/.env`, but nothing reads that file.
- **Fix:** `node --env-file-if-exists=.env src/server.js` (Node ≥22), `--env-file`, or `dotenv`.

## 4. Nothing limits memory use or request volume (`server/src/link-store.js`, `server/src/app.js:22`)
- Links live in an in-memory `Map` with no cap, so repeated `POST /api/shorten` calls can fill the process's memory.
- `cors()` lets any website call the API from a visitor's browser.
- **Fix:** add rate limiting (e.g. `express-rate-limit`), restrict CORS origins, and eventually add real storage. All links are currently lost on every restart.
